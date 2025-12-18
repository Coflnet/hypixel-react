import { Container } from 'react-bootstrap'
import { parseItem } from '../../../../utils/Parser/APIResponseParser'
import Search from '../../../../components/Search/Search'
import { convertTagToName, getItemImageUrl } from '../../../../utils/Formatter'
import ArchivedAuctionsList from '../../../../components/ArchivedAuctions.tsx/ArchivedAuctions'
import { getHeadMetadata } from '../../../../utils/SSRUtils'
import { atobUnicode } from '../../../../utils/Base64Utils'
import { getApiItemItemTagDetails } from '../../../../api/_generated/skyApi'

export default async function Page(props) {
    const params = await props.params
    let tag = params.tag as string

    let item = parseItem({
        tag: tag,
        name: convertTagToName(tag),
        iconUrl: getItemImageUrl({ tag })
    })

    return (
        <>
            <Container>
                <Search selected={item} type="item" />
                <div style={{ paddingTop: '20px' }}>
                    <ArchivedAuctionsList item={item} />
                </div>
            </Container>
        </>
    )
}

export async function generateMetadata(props) {
    const searchParams = await props.searchParams
    const params = await props.params
    function getFiltersText(filter) {
        if (!filter) {
            return ' '
        }
        return `${Object.keys(filter)
            .map(key => `➡️ ${key}: ${filter[key]}`)
            .join('\n')}`
    }

    let tag = params?.tag as string
    let itemFilter = searchParams.filter ? JSON.parse(atobUnicode(searchParams.filter)) : null

    const itemDetailsResponse = await getApiItemItemTagDetails(tag)
    let item = parseItem(itemDetailsResponse.data)

    return getHeadMetadata(
        `${item.name || convertTagToName(tag)} archived auctions`,
        `${itemFilter ? `Filters: \n${getFiltersText(itemFilter)}` : ''}`,
        item.iconUrl,
        [item.name || convertTagToName(tag)],
        `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
    )
}
