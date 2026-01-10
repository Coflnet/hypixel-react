import { redirect } from 'next/navigation'
import { parseItem } from '../../../utils/Parser/APIResponseParser'
import { getHeadMetadata, getCanonicalUrl } from '../../../utils/SSRUtils'
import { convertTagToName, numberWithThousandsSeparators } from '../../../utils/Formatter'
import api, { initAPI } from '../../../api/ApiHelper'
import { atobUnicode } from '../../../utils/Base64Utils'
import dynamic from 'next/dynamic'
import { ItemPageClient } from './ItemPageClient'
import { hasFlag } from '../../../components/FilterElement/FilterType'
import { getCachedItemInfo, ItemFlagsNumeric, hasItemFlag, parseFlags } from '../../../utils/ItemsCache'

const BazaarPriceGraph = dynamic(() => import('../../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'), {
    loading: () => <div style={{ minHeight: '300px' }}>Loading chart...</div>
})

const AuctionHousePriceGraph = dynamic(() => import('../../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'), {
    loading: () => <div style={{ minHeight: '300px' }}>Loading chart...</div>
})

const NitroAdSlot = dynamic(() => import('../../../components/Ads/NitroAdSlot'), {
    loading: () => <div style={{ minHeight: '90px' }} />
})

const ItemFAQ = dynamic(() => import('../../../components/ItemFAQ/ItemFAQ'), {
    loading: () => <div style={{ minHeight: '200px' }}>Loading...</div>
})

// Revalidate every 600 seconds (10 minutes) for price data freshness
// Note: Shorter revalidation times can cause hydration mismatches in some cases
export const revalidate = 600

// Enable static params optimization for popular items
export const dynamicParams = true

export default async function Page(props) {
    const params = await props.params
    const searchParams = await props.searchParams
    let tag = params.tag as string

    let data = await getItemData(searchParams, params)
    let item = parseItem(data.item)

    const isBazaar = data.itemFlags?.isBazaar ?? false

    function getItem(): Item {
        return (
            item ||
            parseItem({
                tag: tag,
                itemName: data.itemFlags?.name || convertTagToName(tag),
                iconUrl: api.getItemImageUrl({ tag }),
                flags: data.itemFlags?.flags
            })
        )
    }

    return (
        <>
            <ItemPageClient item={getItem()}>
                {isBazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}

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
                    isBazaar={isBazaar}
                    itemFlags={data.itemFlags || null}
                />
            </ItemPageClient>
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
            `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`,
            getCanonicalUrl(`/item/${tag}`)
        )
    }
    return getHeadMetadata(
        `${item.name || convertTagToName(tag)} price`,
        `💰 Price: ${getAvgPrice(prices) ? numberWithThousandsSeparators(Math.round(getAvgPrice(prices))) : '---'} Coins
        🕑 ${range ? `Range: ${range}` : null}

         ${filter ? `Filters: 
${getFiltersText(filter)}` : ''}`,
        item.iconUrl,
        [convertTagToName(item.tag)],
        `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`,
        getCanonicalUrl(`/item/${tag}`)
    )
}

async function getItemData(searchParams, params) {
    let range = searchParams.range || 'day'
    let tag = params.tag as string
    let itemFilter = getItemFilterFromUrl(searchParams)

    let api = initAPI(true)
    try {
        const cachedInfo = await getCachedItemInfo(tag)
        const isBazaarFromCache = cachedInfo?.isBazaar ?? null

        if (isBazaarFromCache !== null && range !== 'active') {
            const [itemDetails, prices] = await Promise.all([
                api.getItemDetails(tag) as Promise<any>,
                fetchPrices(api, tag, range, isBazaarFromCache, itemFilter)
            ])

            if (!itemDetails || !itemDetails.name) {
                let searchResults = await api.itemSearch(tag)
                if (searchResults && searchResults[0] && searchResults[0].id !== tag) {
                    redirect(`/item/${searchResults[0].id}`)
                } else {
                    return {
                        item: { tag: tag, itemName: cachedInfo?.name, flags: cachedInfo?.flags },
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

        let itemDetails = (await api.getItemDetails(tag)) as any

        if (!itemDetails || !itemDetails.name) {
            let searchResults = await api.itemSearch(tag)
            if (searchResults && searchResults[0] && searchResults[0].id !== tag) {
                redirect(`/item/${searchResults[0].id}`)
            } else {
                return {
                    item: { tag: tag, itemName: cachedInfo?.name, flags: cachedInfo?.flags },
                    prices: [],
                    range: range || null,
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
    } catch (error) {
        console.error('Error fetching item data:', error instanceof Error ? error.message : error)

        let cachedInfo = await getCachedItemInfo(tag).catch(() => null)

        if (!cachedInfo) {
            try {
                const itemsResponse = await fetch('https://sky.coflnet.com/api/items', { next: { revalidate: 3600 } })
                const items = await itemsResponse.json()
                const item = items.find((i: any) => i.tag === tag)
                if (item) {
                    const numericFlags = parseFlags(item.flags)
                    cachedInfo = {
                        tag,
                        name: item.name || null,
                        isBazaar: hasItemFlag(numericFlags, ItemFlagsNumeric.BAZAAR),
                        isTradeable: hasItemFlag(numericFlags, ItemFlagsNumeric.TRADEABLE),
                        isAuction: hasItemFlag(numericFlags, ItemFlagsNumeric.AUCTION),
                        isCraftable: hasItemFlag(numericFlags, ItemFlagsNumeric.CRAFT),
                        isMuseum: hasItemFlag(numericFlags, ItemFlagsNumeric.MUSEUM),
                        isFireSale: hasItemFlag(numericFlags, ItemFlagsNumeric.FIRESALE),
                        flags: numericFlags
                    }
                }
            } catch (e) {
                console.error('Failed direct API fallback:', e)
            }
        }

        return {
            item: { tag: tag, itemName: cachedInfo?.name, flags: cachedInfo?.flags },
            prices: [],
            range: range || null,
            filter: null,
            itemFlags: cachedInfo
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
