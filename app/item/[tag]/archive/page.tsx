import { Container } from 'react-bootstrap'
import { parseItem } from '../../../../utils/Parser/APIResponseParser'
import Search from '../../../../components/Search/Search'
import { convertTagToName } from '../../../../utils/Formatter'
import api, { initAPI } from '../../../../api/ApiHelper'
import { Archive } from '@mui/icons-material'
import ArchivedAuctionsList from '../../../../components/ArchivedAuctions.tsx/ArchivedAuctions'
import { getHeadMetadata } from '../../../../utils/SSRUtils'
import api from '../../../../api/ApiHelper'
import { atobUnicode } from '../../../../utils/Base64Utils'

export default async function Page({ searchParams, params }) {
    let tag = params.tag as string

    let item = parseItem({
        tag: tag,
        name: convertTagToName(tag),
        iconUrl: api.getItemImageUrl({ tag })
    })

    return (
        <>
            {}
            <Container>
                <Search selected={item} type="item" />
                <ArchivedAuctionsList item={item} />
            </Container>
        </>
    )
}

export async function generateMetadata({ params, searchParams }) {
    function getFiltersText(filter) {
        if (!filter) {
            return ' '
        }
        return `${Object.keys(filter)
            .map(key => `➡️ ${key}: ${filter[key]}`)
            .join('\n')}`
    }

    let tag = params?.tag as string
    let api = initAPI(true)
    let itemFilter = searchParams.filter ? JSON.parse(atobUnicode(searchParams.filter)) : null

    let item = await api.getItemDetails(tag)

    return getHeadMetadata(
        `${item.name || convertTagToName(tag)} archived auctions`,
        `${itemFilter ? `Filters: \n${getFiltersText(itemFilter)}` : ''}`,
        item.iconUrl,
        [item.name || convertTagToName(tag)],
        `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
    )
}
