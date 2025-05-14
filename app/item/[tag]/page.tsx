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
                iconUrl: api.getItemImageUrl({ tag })
            })
        )
    }

    return (
        <>
            <Container>
                <Search selected={getItem()} type="item" />
                {item.bazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}
            </Container>
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
        let itemDetails = (await api.getItemDetails(tag)) as any

        if (!itemDetails || !itemDetails.name) {
            let searchResults = await api.itemSearch(tag)
            if (searchResults) {
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
        let prices: any = null

        if (isBazaar) {
            if (range === 'full') {
                prices = await api.getBazaarPricesByRange(tag, new Date(0), new Date())
            } else {
                prices = await api.getBazaarPrices(tag, range as any)
            }
        } else {
            prices = (await api.getItemPrices(tag, range as DateRange, itemFilter ? itemFilter : {})) as any
        }

        return {
            item: itemDetails,
            prices: prices || [],
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
            range: null,
            filter: null
        }
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
