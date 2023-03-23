import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import api, { initAPI } from '../../api/ApiHelper'
import { DEFAULT_DATE_RANGE } from '../../components/ItemPriceRange/ItemPriceRange'
import AuctionHousePriceGraph from '../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'
import BazaarPriceGraph from '../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'
import RelatedItems from '../../components/RelatedItems/RelatedItems'
import Search from '../../components/Search/Search'
import { atobUnicode } from '../../utils/Base64Utils'
import { getCacheControlHeader } from '../../utils/CacheUtils'
import { convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import { parseItem, parseItemPrice } from '../../utils/Parser/APIResponseParser'
import { parseItemFilter } from '../../utils/Parser/URLParser'
import { getHeadElement, isClientSideRendering } from '../../utils/SSRUtils'

interface Props {
    item?: any
    prices?: any[]
    filter: any
    range: string
}

function ItemDetails(props: Props) {
    const router = useRouter()
    let tag = router.query.tag as string
    let [item, setItem] = useState<Item>(props.item ? parseItem(props.item) : null)
    let [prices] = useState<ItemPrice[]>(props.prices ? props.prices.map(parseItemPrice) : [])
    let [filter] = useState<ItemFilter>(props.filter ? parseItemFilter(props.filter) : null)
    let [avgPrice] = useState(getAvgPrice())

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }
        api.getItemDetails(tag)
            .then(detailedItem => {
                setItem(detailedItem)
            })
            .catch(() => {
                setItem({
                    tag: tag,
                    name: convertTagToName(tag),
                    iconUrl: api.getItemImageUrl({ tag })
                })
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag])

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

    function getAvgPrice() {
        let priceSum = 0

        props.prices.forEach(item => {
            priceSum += item.avg
        })

        return Math.round(priceSum / prices.length)
    }

    function getFiltersText() {
        if (!filter) {
            return ' '
        }
        return `${Object.keys(filter)
            .map(key => `➡️ ${key}: ${filter[key]}`)
            .join('\n')}`
    }

    return (
        <div className="page">
            {getHeadElement(
                `${getItem().name || convertTagToName(tag)} price`,
                `💰 Price: ${avgPrice ? numberWithThousandsSeparators(Math.round(avgPrice)) : '---'} Coins
                🕑 ${props.range ? `Range: ${props.range}` : null}
                
                 ${filter ? `Filters: \n${getFiltersText()}` : ''}`,
                getItem().iconUrl,
                [convertTagToName(getItem().tag)],
                `${getItem().name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
            )}
            <Container>
                <Search selected={getItem()} type="item" />
                {item.bazaar ? <BazaarPriceGraph item={getItem()} /> : <AuctionHousePriceGraph item={getItem()} />}
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ res, params, query }) => {
    res.setHeader('Cache-Control', getCacheControlHeader())

    let range = query.range || DEFAULT_DATE_RANGE

    let api = initAPI(true)
    let apiResponses = await Promise.all([
        api.getItemDetails(params.tag).catch(() => {
            return {
                tag: params.tag,
                name: convertTagToName(params.tag),
                iconUrl: api.getItemImageUrl({ tag: params.tag })
            } as Item
        }),
        api.getItemPrices(params.tag, range, query.itemFilter ? JSON.parse(atobUnicode(query.itemFilter)) : {}).catch(() => {
            return []
        })
    ])
    return {
        props: {
            item: apiResponses[0],
            prices: (apiResponses[1] as ItemPrice[]) || [],
            range: range || null,
            filter: query.itemFilter || null
        }
    }
}

export default ItemDetails
