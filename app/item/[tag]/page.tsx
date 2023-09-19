import { redirect } from 'next/navigation'
import { parseItem } from '../../../utils/Parser/APIResponseParser'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import { convertTagToName, numberWithThousandsSeparators } from '../../../utils/Formatter'
import { DEFAULT_DATE_RANGE } from '../../../components/ItemPriceRange/ItemPriceRange'
import api, { initAPI } from '../../../api/ApiHelper'
import { atobUnicode } from '../../../utils/Base64Utils'
import Search from '../../../components/Search/Search'
import BazaarPriceGraph from '../../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'
import AuctionHousePriceGraph from '../../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'
import RBContainer from '../../../components/ReactBootstrapWrapper/Container'
import { hasFlag } from '../../../components/FilterElement/FilterType'

export default async function Page({ searchParams, params }) {
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
            {}
            <RBContainer>
                <Search selected={getItem()} type="item" />
                {item.bazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}
            </RBContainer>
        </>
    )
}

export async function generateMetadata({ params, searchParams }) {
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
        return getHeadMetadata(
            `${item.name || convertTagToName(tag)} price`,
            `🕑 ${range ? `Range: ${range}` : null}`,
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
    let itemFilter = searchParams.itemFilter

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
        let prices = hasFlag(itemDetails.flags, 1)
            ? []
            : ((await api.getItemPrices(tag, range as DateRange, itemFilter ? JSON.parse(atobUnicode(itemFilter)) : {})) as any)
        return {
            item: itemDetails,
            prices: prices || [],
            range: range || null,
            filter: itemFilter ? JSON.parse(atobUnicode(itemFilter)) : null
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
