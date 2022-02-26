import React, { useEffect, useState } from 'react'
import Search from '../../components/Search/Search'
import PriceGraph from '../../components/PriceGraph/PriceGraph'
import { parseItem } from '../../utils/Parser/APIResponseParser'
import { convertTagToName } from '../../utils/Formatter'
import api from '../../api/ApiHelper'
import { Container } from 'react-bootstrap'
import { useRouter } from 'next/router'
import { isClientSideRendering } from '../../utils/SSRUtils'

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
            document.title = `Auction Price tracker for ${detailedItem.name || convertTagToName(tag)} in hypixel skyblock`
            detailedItem.iconUrl = api.getItemImageUrl({ tag: tag })
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
            <Container>
                <Search selected={getItem()} type="item" />
                <PriceGraph item={getItem()} />
            </Container>
        </div>
    )
}

export default ItemDetails
