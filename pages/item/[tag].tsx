import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Search from '../../components/Search/Search'
import PriceGraph from '../../components/PriceGraph/PriceGraph'
import { parseItem } from '../../utils/Parser/APIResponseParser'
import { convertTagToName } from '../../utils/Formatter'
import api from '../../api/ApiHelper'
import { Container } from 'react-bootstrap'
import { useRouter } from 'next/router'
import { getHeadElement, isClientSideRendering } from '../../utils/SSRUtils'

function ItemDetails() {
    const router = useRouter()
    let tag = router.query.tag as string
    let [item, setItem] = useState<Item>()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }
        api.getItemDetails(tag).then(detailedItem => {
            setItem(detailedItem)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag])

    let getItem = (): Item => {
        return (
            item ||
            parseItem({
                tag: tag,
                name: convertTagToName(tag)
            })
        )
    }

    return (
        <div className="page">
            {getHeadElement(
                `${getItem().name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`,
                `Auction Price tracker for ${getItem().name || convertTagToName(tag)} in Hypixel Skyblock`,
                getItem().iconUrl,
                [convertTagToName(getItem().tag)],
                `${getItem().name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
            )}
            <Container>
                <Search selected={getItem()} type="item" />
                <PriceGraph item={getItem()} />
            </Container>
        </div>
    )
}

export default ItemDetails
