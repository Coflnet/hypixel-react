import { redirect } from 'next/navigation'
import { parseItem } from '../../../utils/Parser/APIResponseParser'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import { convertTagToName, numberWithThousandsSeparators } from '../../../utils/Formatter'
import api, { initAPI } from '../../../api/ApiHelper'
import { atobUnicode } from '../../../utils/Base64Utils'
import Search from '../../../components/Search/Search'
import BazaarPriceGraph from '../../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'
import AuctionHousePriceGraph from '../../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'
import { hasFlag } from '../../../components/FilterElement/FilterType'
import { Container } from 'react-bootstrap'
import NitroAdSlot from '../../../components/Ads/NitroAdSlot'
import ItemFAQ from '../../../components/ItemFAQ/ItemFAQ'
import { getCachedItemInfo, ItemFlagsNumeric, hasItemFlag } from '../../../utils/ItemsCache'

// Revalidate every 60 seconds for price data freshness
export const revalidate = 60

export default async function Page(props) {
    const params = await props.params
    const searchParams = await props.searchParams
    let tag = params.tag as string

    let data = await getItemData(searchParams, params)
    let item = parseItem(data.item)

    function getItem(): Item {
        return (
            item ||
            parseItem({
                tag: tag,
                itemName: convertTagToName(tag),
                iconUrl: api.getItemImageUrl({ tag })
            })
        )
    }

    return (
        <>
            <Container>
                <Search selected={getItem()} type="item" showFavoriteToggle />
                {item.bazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}

                <NitroAdSlot
                    slotId="flip-banner"
                    config={{
                        delayLoading: true,
                        report: {
                            enabled: true,
                            icon: true,
                            wording: 'Report Ad',
                            position: 'bottom-right'
                        }
                    }}
                />
                <ItemFAQ
                    item={getItem() as any}
                    tag={tag}
                    range={data.range}
                    prices={data.prices}
                    isBazaar={!!item.bazaar}
                    itemFlags={data.itemFlags}
                />
            </Container>
            <NitroAdSlot
                slotId="below-faq"
                config={{
                    delayLoading: true,
                    report: {
                        enabled: true,
                        icon: true,
                        wording: 'Report Ad',
                        position: 'bottom-right'
                    }
                }}
            />
            <NitroAdSlot
                slotId="bottom-banner"
                config={{
                    format: 'anchor-v2',
                    anchor: 'bottom',
                    anchorBgColor: 'rgb(0 0 0 / 80%)',
                    anchorClose: true,
                    anchorPersistClose: false,
                    anchorStickyOffset: 0,
                    mediaQuery: '(min-width: 0px)',
                    report: {
                        enabled: true,
                        icon: true,
                        wording: 'Report Ad',
                        position: 'top-right'
                    }
                }}
            />
        </>
    )
}

export async function generateMetadata(props) {
    const searchParams = await props.searchParams
    const params = await props.params
    function getAvgPrice(prices) {
        let priceSum = 0

        prices.forEach(item => {
            priceSum += item.avg
        })

        return Math.round(priceSum / prices.length)
    }

    function getFiltersText(filter) {
        if (!filter) {
            return ' '
        }
        return `${Object.keys(filter)
            .map(key => `➡️ ${key}: ${filter[key]}`)
            .join('\n')}`
    }

    let tag = params?.tag as string
    let { item, filter, prices, range } = await getItemData(searchParams, params)
    if (hasFlag(item.flags, 1)) {
        let sellPriceSum = 0
        let buyPriceSum = 0

        prices.forEach(p => {
            sellPriceSum += p.sellData.price
            buyPriceSum += p.buyData.price
        })

        return getHeadMetadata(
            `${item.name || convertTagToName(tag)} price`,
            `🕑 ${range ? `Range: ${range}` : null}
            Avg Sell Price: ${sellPriceSum ? numberWithThousandsSeparators(Math.round(sellPriceSum / prices.length)) : '---'} 
            Avg Buy Price: ${buyPriceSum ? numberWithThousandsSeparators(Math.round(buyPriceSum / prices.length)) : '---'}`,
            item.iconUrl,
            [convertTagToName(item.tag)],
            `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
        )
    }
    return getHeadMetadata(
        `${item.name || convertTagToName(tag)} price`,
        `💰 Price: ${getAvgPrice(prices) ? numberWithThousandsSeparators(Math.round(getAvgPrice(prices))) : '---'} Coins
        🕑 ${range ? `Range: ${range}` : null}

         ${filter ? `Filters: \n${getFiltersText(filter)}` : ''}`,
        item.iconUrl,
        [convertTagToName(item.tag)],
        `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
    )
}

async function getItemData(searchParams, params) {
    let range = searchParams.range || 'day'
    let tag = params.tag as string
    let itemFilter = getItemFilterFromUrl(searchParams)

    let api = initAPI(true)
    try {
        // First, get cached item info to know if it's bazaar (fast, from cache)
        // This allows us to start fetching prices in parallel with item details
        const cachedInfo = await getCachedItemInfo(tag)
        const isBazaarFromCache = cachedInfo?.isBazaar ?? null

        // If we know from cache whether item is bazaar, we can parallelize fetches
        // Otherwise, we need to fetch item details first to determine the type
        if (isBazaarFromCache !== null && range !== 'active') {
            // Parallel fetch: item details and prices at the same time
            const [itemDetails, prices] = await Promise.all([
                api.getItemDetails(tag) as Promise<any>,
                fetchPrices(api, tag, range, isBazaarFromCache, itemFilter)
            ])

            if (!itemDetails || !itemDetails.name) {
                let searchResults = await api.itemSearch(tag)
                if (searchResults) {
                    redirect(`/item/${searchResults[0].id}`)
                } else {
                    return {
                        item: { tag: tag },
                        prices: [],
                        range: null,
                        filter: null,
                        itemFlags: cachedInfo
                    }
                }
            }

            return {
                item: itemDetails,
                prices: prices || [],
                range: range || null,
                filter: itemFilter ? itemFilter : null,
                itemFlags: cachedInfo
            }
        }

        // Fallback: sequential fetch when cache miss or active range
        let itemDetails = (await api.getItemDetails(tag)) as any

        if (!itemDetails || !itemDetails.name) {
            let searchResults = await api.itemSearch(tag)
            if (searchResults) {
                redirect(`/item/${searchResults[0].id}`)
            } else {
                return {
                    item: { tag: tag },
                    prices: [],
                    range: null,
                    filter: null,
                    itemFlags: cachedInfo
                }
            }
        }

        if (range === 'active') {
            return {
                item: itemDetails,
                prices: [],
                range: range || null,
                filter: itemFilter || null,
                itemFlags: cachedInfo
            }
        }

        let isBazaar = hasFlag(itemDetails.flags, 1)
        let prices = await fetchPrices(api, tag, range, isBazaar, itemFilter)

        return {
            item: itemDetails,
            prices: prices || [],
            range: range || null,
            filter: itemFilter ? itemFilter : null,
            itemFlags: cachedInfo
        }
    } catch (e) {
        console.log('Error fetching item data: ' + JSON.stringify(e))
        return {
            item: { tag: tag },
            prices: [],
            range: null,
            filter: null,
            itemFlags: null
        }
    }
}

/**
 * Fetch prices based on item type (bazaar or auction house)
 */
async function fetchPrices(api: API, tag: string, range: string, isBazaar: boolean, itemFilter: any): Promise<any> {
    if (isBazaar) {
        if (range === 'full') {
            return api.getBazaarPricesByRange(tag, new Date(0), new Date())
        } else {
            return api.getBazaarPrices(tag, range as any)
        }
    } else {
        return api.getItemPrices(tag, range as DateRange, itemFilter ? itemFilter : {}) as any
    }
}

function getItemFilterFromUrl(searchParams) {
    let itemFilterBase64 = searchParams.itemFilter
    if (itemFilterBase64) {
        try {
            return JSON.parse(atobUnicode(itemFilterBase64))
        } catch (e) {
            console.error('Error parsing item filter from URL: ' + e)
            return null
        }
    }

    let nonFilterParams = ['range', 'refId', 'conId']
    let itemFilter = {}
    for (const [key, value] of Object.entries(searchParams)) {
        if (nonFilterParams.indexOf(key) === -1) {
            itemFilter[key] = value
        }
    }
    return Object.keys(itemFilter).length > 0 ? itemFilter : null
}
