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

interface Props {
    item?: any
    mean?: number
}

function ItemDetails(props: Props) {
    const router = useRouter()
    let tag = router.query.tag as string
    let [item, setItem] = useState<Item>(props.item ? parseItem(props.item) : null)

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
        if (!router.query.itemFilter) {
            return ''
        }
        let filter = JSON.parse(atobUnicode(router.query.itemFilter.toString()))
        return ` FILTERS ➡️ ${Object.keys(filter)
            .map(key => `${key}: ${filter[key]}`)
            .toString()}`
    }

    return (
        <div className="page">
            {getHeadElement(
                `${getItem().name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`,
                `Price for ${getItem().name || convertTagToName(tag)} in Hypixel Skyblock is ${numberWithThousandsSeperators(
                    Math.floor(props.mean || 0)
                )} Coins on average.${getFiltersText()} | Hypixel SkyBlock AH history tracker`,
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

export const getStaticProps = async ({ params }) => {
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
            mean: (apiResponses[1] as ItemPriceSummary).mean
        },
        revalidate: 60
    }
}

export async function getStaticPaths() {
    return { paths: [], fallback: 'blocking' }
}

export default ItemDetails
