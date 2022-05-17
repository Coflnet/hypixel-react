import React, { useEffect, useState } from 'react'
import Search from '../../components/Search/Search'
import { parseItem } from '../../utils/Parser/APIResponseParser'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter'
import api, { initAPI } from '../../api/ApiHelper'
import { Container } from 'react-bootstrap'
import { useRouter } from 'next/router'
import { getHeadElement, isClientSideRendering } from '../../utils/SSRUtils'
import AuctionHousePriceGraph from '../../components/PriceGraph/AuctionHousePriceGraph/AuctionHousePriceGraph'
import BazaarPriceGraph from '../../components/PriceGraph/BazaarPriceGraph/BazaarPriceGraph'
import { atobUnicode } from '../../utils/Base64Utils'
import { parseItemFilter } from '../../utils/Parser/URLParser'

interface Props {
    item?: any
    mean?: number
    filter: any
}

function ItemDetails(props: Props) {
    const router = useRouter()
    let tag = router.query.tag as string
    let [item, setItem] = useState<Item>(props.item ? parseItem(props.item) : null)
    let [filter, setFilter] = useState<ItemFilter>(props.filter ? parseItemFilter(props.filter) : null)

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

    function getFiltersText() {
        if (!filter) {
            return ''
        }
        return `${Object.keys(filter)
            .map(key => `➡️ ${key}: ${filter[key]}`)
            .join('\n')}`
    }

    return (
        <div className="page">
            {getHeadElement(
                `${getItem().name || convertTagToName(tag)} price`,
                `💰 Price: ${props.mean ? numberWithThousandsSeperators(Math.round(props.mean)) : '---'} Coins
                
                 Filters:
                 ${getFiltersText()}`,
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
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=60, stale-while-revalidate=59')

    let api = initAPI(true)
    let apiResponses = await Promise.all([
        api.getItemDetails(params.tag).catch(() => {
            return {
                tag: params.tag,
                name: convertTagToName(params.tag),
                iconUrl: api.getItemImageUrl({ tag: params.tag })
            } as Item
        }),
        api.getItemPriceSummary(params.tag, params.itemFilter ? JSON.parse(atobUnicode(params.itemFilter)) : {}).catch(() => {
            return {}
        })
    ])
    return {
        props: {
            item: apiResponses[0],
            mean: (apiResponses[1] as ItemPriceSummary).mean,
            filter: query.itemFilter || null
        }
    }
}

export default ItemDetails
