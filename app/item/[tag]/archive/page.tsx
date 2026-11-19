import { Container } from 'react-bootstrap'
import { parseItem } from '../../../../utils/Parser/APIResponseParser'
import Search from '../../../../components/Search/Search'
import { convertTagToName } from '../../../../utils/Formatter'
import api, { initAPI } from '../../../../api/ApiHelper'
import ArchivedAuctionsList from '../../../../components/ArchivedAuctions.tsx/ArchivedAuctions'
import { getHeadMetadata, getArchiveCanonicalUrl } from '../../../../utils/SSRUtils'
import { atobUnicode } from '../../../../utils/Base64Utils'
import { getItemFilterEmbedText, joinEmbedParts } from '../../../../utils/EmbedUtils'

export default async function Page(props) {
    const params = await props.params
    const tag = params.tag as string

    const item = parseItem({
        tag: tag,
        name: convertTagToName(tag),
        iconUrl: api.getItemImageUrl({ tag })
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
    const tag = params?.tag as string
    const item = await getItemDetailsOrNull(tag)
    const itemName = item?.name || convertTagToName(tag)

    return getHeadMetadata(
        `${itemName} archived auctions`,
        joinEmbedParts([`Archived auctions of ${itemName} in Hypixel SkyBlock`, getItemFilterEmbedText(parseFilter(searchParams.filter))]),
        item?.iconUrl || api.getItemImageUrl({ tag } as Item),
        [itemName],
        `${itemName} | Archived Auctions`,
        getArchiveCanonicalUrl(tag, searchParams.filter),
        // item icons are 16x16 to 64x64 depending on the item, so no size is claimed
        { imageAlt: `${itemName} icon` }
    )
}

async function getItemDetailsOrNull(tag: string): Promise<Item | null> {
    try {
        return await initAPI(true).getItemDetails(tag)
    } catch (e) {
        console.error(`Error loading item details for archive metadata ${tag}. ${e instanceof Error ? e.message : JSON.stringify(e)}`)
        return null
    }
}

function parseFilter(filter?: string): ItemFilter | null {
    if (!filter) {
        return null
    }
    try {
        return JSON.parse(atobUnicode(filter))
    } catch {
        return null
    }
}
