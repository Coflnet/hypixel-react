import { redirect } from 'next/navigation'
import { cache } from 'react'
import { parseItem } from '../../../utils/Parser/APIResponseParser'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import { convertTagToName, numberWithThousandsSeparators, getItemImageUrl } from '../../../utils/Formatter'
import { atobUnicode } from '../../../utils/Base64Utils'
import Search from '../../../components/Search/Search'
import BazaarPriceGraph from '../../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'
import AuctionHousePriceGraph from '../../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'
import { hasFlag } from '../../../components/FilterElement/FilterType'
import { Container } from 'react-bootstrap'
import NitroAdSlot from '../../../components/Ads/NitroAdSlot'
import ItemFAQ from '../../../components/ItemFAQ/ItemFAQ'
import { 
    getApiItems, 
    getApiItemItemTagDetails, 
    getApiItemSearchSearchVal, 
    getApiBazaarItemTagHistory, 
    getApiBazaarItemTagHistoryDay, 
    getApiBazaarItemTagHistoryWeek, 
    getApiItemPriceItemTagHistoryDay, 
    getApiItemPriceItemTagHistoryWeek, 
    getApiItemPriceItemTagHistoryMonth,
    getApiItemPriceItemTagHistoryFull,
    getApiAuctionsTagItemTagRecentOverview
} from '../../../api/_generated/skyApi'

export async function generateStaticParams() {
    try {
        const response = await getApiItems()
        const items = response.data
        return items.map((item) => ({
            tag: item.tag,
        }))
    } catch (e) {
        console.error("Failed to generate static params", e)
        return []
    }
}

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
                name: convertTagToName(tag),
                iconUrl: getItemImageUrl({ tag })
            })
        )
    }

    // Prepare FAQ data for SEO and visible content
    const rawItem = data.item || {}
    const selectedRange = data.range || 'day'

    // Build FAQ Q/A pairs (Static ones for prerendering)
    const faqPairs: { q: string; a: string }[] = []
    
    const defaultTier = rawItem.tier || item.tier || 'Unknown'
    const category = rawItem.category || item.category || 'Unknown'
    const npcPrice = rawItem.npcPrice !== undefined ? rawItem.npcPrice : 'N/A'
    
    faqPairs.push({
        q: `What is the item ID for ${item.name || convertTagToName(tag)}?`,
        a: `The unique item ID (tag) for this item is ${rawItem.tag || tag}.`
    })

    faqPairs.push({
        q: `What is the default tier, category and NPC price for ${item.name || convertTagToName(tag)}?`,
        a: `Default tier: ${defaultTier}. Category: ${category}. NPC Price: ${npcPrice === 'N/A' ? 'N/A' : numberWithThousandsSeparators(npcPrice) + ' coins'}`
    })

    faqPairs.push({
        q: `Is ${item.name || convertTagToName(tag)} a Bazaar item?`,
        a: item.bazaar ? `Yes, ${item.name || convertTagToName(tag)} is available on the Bazaar.` : `No, ${item.name || convertTagToName(tag)} is not a Bazaar item and is traded on the Auction House.`
    })

    if (item.bazaar) {
        faqPairs.push({
            q: `How do I buy ${item.name || convertTagToName(tag)}?`,
            a: `You can buy ${item.name || convertTagToName(tag)} from the Bazaar NPC in the Hub. You can either place a Buy Order or use Buy Instantly.`
        })
    } else {
        faqPairs.push({
            q: `How do I buy ${item.name || convertTagToName(tag)}?`,
            a: `You can buy ${item.name || convertTagToName(tag)} from the Auction House (AH). It is typically sold as a BIN (Buy It Now) item.`
        })
    }

    return (
        <>
            <Container>
                <Search selected={getItem()} type="item" showFavoriteToggle />
                {item.bazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}
            </Container>
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
            <ItemFAQ 
                item={item} 
                initialFaqPairs={faqPairs} 
                tag={tag} 
                range={selectedRange} 
                filter={data.filter} 
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

const getItemData = cache(async (searchParams, params) => {
    let range = searchParams.range || 'day'
    let tag = params.tag as string
    let itemFilter = getItemFilterFromUrl(searchParams)

    try {
        const itemDetailsResponse = await getApiItemItemTagDetails(tag)
        let itemDetails = parseItem(itemDetailsResponse.data)

        if (!itemDetails || !itemDetails.name) {
            const searchResponse = await getApiItemSearchSearchVal(tag)
            const searchResults = searchResponse.data
            if (searchResults && searchResults.length > 0) {
                redirect(`/item/${searchResults[0].id}`)
            } else {
                return {
                    item: {
                        tag: tag
                    },
                    prices: [],
                    range: null,
                    filter: null
                }
            }
        }

        if (range === 'active') {
            return {
                item: itemDetails,
                prices: [],
                range: range || null,
                filter: itemFilter || null
            }
        }

        let isBazaar = hasFlag(itemDetails.flags, 1)
        let prices: any = []
        let recentAuctions: any = []

        if (isBazaar) {
            if (range === 'full') {
                const response = await getApiBazaarItemTagHistory(tag, {
                    start: new Date(0).toISOString(),
                    end: new Date().toISOString()
                })
                prices = response.data
            } else if (range === 'week') {
                const response = await getApiBazaarItemTagHistoryWeek(tag)
                prices = response.data
            } else {
                const response = await getApiBazaarItemTagHistoryDay(tag)
                prices = response.data
            }
        } else {
            let pricesPromise;
            if (range === 'week') {
                pricesPromise = getApiItemPriceItemTagHistoryWeek(tag, itemFilter || {})
            } else if (range === 'month') {
                pricesPromise = getApiItemPriceItemTagHistoryMonth(tag, itemFilter || {})
            } else if (range === 'full') {
                pricesPromise = getApiItemPriceItemTagHistoryFull(tag)
            } else {
                pricesPromise = getApiItemPriceItemTagHistoryDay(tag, itemFilter || {})
            }

            const recentAuctionsPromise = getApiAuctionsTagItemTagRecentOverview(tag, itemFilter || {})
            
            const [pricesResult, recentAuctionsResult] = await Promise.allSettled([pricesPromise, recentAuctionsPromise])
            
            if (pricesResult.status === 'fulfilled') {
                prices = (pricesResult.value as any).data
            }
            if (recentAuctionsResult.status === 'fulfilled') {
                recentAuctions = (recentAuctionsResult.value as any).data
            }
        }

        return {
            item: itemDetails,
            prices: prices || [],
            recentAuctions: recentAuctions || [],
            range: range || null,
            filter: itemFilter ? itemFilter : null
        }
    } catch (e) {
        console.log('Error fetching item data: ' + JSON.stringify(e))
        return {
            item: {
                tag: tag
            },
            prices: [],
            recentAuctions: [],
            range: null,
            filter: null
        }
    }
})

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
