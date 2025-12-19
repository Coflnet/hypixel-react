import { redirect } from 'next/navigation'
import { cache } from 'react'
import { parseItem, parseBazaarPrice } from '../../../utils/Parser/APIResponseParser'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import { convertTagToName, numberWithThousandsSeparators, getItemImageUrl } from '../../../utils/Formatter'
import { atobUnicode } from '../../../utils/Base64Utils'
import Search from '../../../components/Search/Search'
import BazaarPriceGraph from '../../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraphLazy'
import AuctionHousePriceGraph from '../../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraphLazy'
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
    let item = data.item // data.item is already parsed in getItemData

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

    const isBazaar = hasFlag(item.flags, 1)
    const isAuction = hasFlag(item.flags, 4)
    const isMuseum = hasFlag(item.flags, 32)

    let bazaarAhStatus = ''
    if (isBazaar && isAuction) {
        bazaarAhStatus = `Yes, ${item.name || convertTagToName(tag)} is available on both the Bazaar and the Auction House.`
    } else if (isBazaar) {
        bazaarAhStatus = `Yes, ${item.name || convertTagToName(tag)} is available on the Bazaar.`
    } else if (isAuction) {
        bazaarAhStatus = `No, ${item.name || convertTagToName(tag)} is not a Bazaar item but is traded on the Auction House.`
    } else {
        bazaarAhStatus = `No, ${item.name || convertTagToName(tag)} is neither available on the Bazaar nor the Auction House.`
    }

    faqPairs.push({
        q: `Is ${item.name || convertTagToName(tag)} a Bazaar item?`,
        a: bazaarAhStatus
    })

    faqPairs.push({
        q: `Can I donate ${item.name || convertTagToName(tag)} to the Museum?`,
        a: isMuseum ? `Yes, ${item.name || convertTagToName(tag)} can be donated to the Museum for SkyBlock XP.` : `No, ${item.name || convertTagToName(tag)} cannot be donated to the Museum.`
    })

    if (isBazaar) {
        faqPairs.push({
            q: `What is the best way to flip ${item.name || convertTagToName(tag)}?`,
            a: `For Bazaar items like ${item.name || convertTagToName(tag)}, the most common flipping strategy is "Bazaar Flipping" — buying low via Buy Orders and selling high via Sell Offers. Check the margin between the Buy and Sell prices to see if it's currently profitable.`
        })
        faqPairs.push({
            q: `How do I buy ${item.name || convertTagToName(tag)}?`,
            a: `You can buy ${item.name || convertTagToName(tag)} from the Bazaar NPC in the Hub. You can either place a Buy Order or use Buy Instantly.`
        })
    } else if (isAuction) {
        faqPairs.push({
            q: `What is the best way to flip ${item.name || convertTagToName(tag)}?`,
            a: `For Auction House items, you can try "BIN Flipping" (buying underpriced Buy It Now listings) or "Auction Flipping" (winning bid-based auctions for less than their market value and reselling them as BIN).`
        })
        faqPairs.push({
            q: `How do I buy ${item.name || convertTagToName(tag)}?`,
            a: `You can buy ${item.name || convertTagToName(tag)} from the Auction House (AH). It is typically sold as a BIN (Buy It Now) item.`
        })
    }

    faqPairs.push({
        q: `How often is the price of ${item.name || convertTagToName(tag)} updated?`,
        a: `Prices on Coflnet are updated in real-time. We track every single transaction on the Hypixel SkyBlock Auction House and Bazaar to provide the most accurate and up-to-date market data.`
    })

    return (
        <>
            <Container>
                <Search selected={getItem()} type="item" showFavoriteToggle />
                <div style={{ minHeight: '60vh' }}>
                    {item.bazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}
                </div>
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
    if (item && hasFlag(item.flags, 1)) {
        let sellPriceSum = 0
        let buyPriceSum = 0

        if (Array.isArray(prices)) {
            prices.forEach(p => {
                if (p?.sellData?.price) sellPriceSum += p.sellData.price
                if (p?.buyData?.price) buyPriceSum += p.buyData.price
            })
        }

        const avgSell = prices?.length ? Math.round(sellPriceSum / prices.length) : 0
        const avgBuy = prices?.length ? Math.round(buyPriceSum / prices.length) : 0

        return getHeadMetadata(
            `${item.name || convertTagToName(tag)} price`,
            `🕑 ${range ? `Range: ${range}` : null}
            Avg Sell Price: ${avgSell ? numberWithThousandsSeparators(avgSell) : '---'} 
            Avg Buy Price: ${avgBuy ? numberWithThousandsSeparators(avgBuy) : '---'}`,
            item.iconUrl,
            [convertTagToName(item.tag)],
            `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
        )
    }
    
    const avgPrice = Array.isArray(prices) ? getAvgPrice(prices) : 0

    return getHeadMetadata(
        `${item.name || convertTagToName(tag)} price`,
        `💰 Price: ${avgPrice ? numberWithThousandsSeparators(avgPrice) : '---'} Coins
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
        let itemDetails = itemDetailsResponse.data ? parseItem(itemDetailsResponse.data) : null

        let prices: any[] = []
        let recentAuctions: any[] = []

        if (itemDetails?.bazaar) {
            let response;
            if (range === 'all' || range === 'full') {
                response = await getApiBazaarItemTagHistory(tag, {
                    start: new Date(0).toISOString(),
                    end: new Date().toISOString()
                })
            } else if (range === 'week') {
                response = await getApiBazaarItemTagHistoryWeek(tag)
            } else {
                response = await getApiBazaarItemTagHistoryDay(tag)
            }
            prices = (response?.data || []).map(parseBazaarPrice)
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
                prices = (pricesResult.value as any).data || []
            }
            if (recentAuctionsResult.status === 'fulfilled') {
                recentAuctions = (recentAuctionsResult.value as any).data || []
            }
        }

        return {
            item: itemDetails || parseItem({ tag }),
            prices: prices,
            recentAuctions: recentAuctions,
            range: range || null,
            filter: itemFilter ? itemFilter : null
        }
    } catch (e) {
        console.error('Error fetching item data for ' + tag, e)
        return {
            item: parseItem({ tag }),
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
