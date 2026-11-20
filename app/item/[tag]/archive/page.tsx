import { Container } from 'react-bootstrap'
import { parseItem } from '../../../../utils/Parser/APIResponseParser'
import Search from '../../../../components/Search/Search'
import { convertTagToName } from '../../../../utils/Formatter'
import api from '../../../../api/ApiHelper'
import ArchivedAuctionsList from '../../../../components/ArchivedAuctions.tsx/ArchivedAuctions'
import { getHeadMetadata, getArchiveCanonicalUrl } from '../../../../utils/SSRUtils'
import { getItemFilterEmbedText, joinEmbedParts } from '../../../../utils/EmbedUtils'
import { DiscordEmbedLink } from '../../../../components/DiscordEmbed/DiscordEmbedLink'
import { getItemDetailsOrNull, getKnownArchiveFilter } from './archiveData'

export default async function Page(props) {
    const params = await props.params
    const searchParams = await props.searchParams
    const tag = params.tag as string

    const item = parseItem({
        tag: tag,
        name: convertTagToName(tag),
        iconUrl: api.getItemImageUrl({ tag })
    })

    return (
        <>
            <DiscordEmbedLink segments={['item', tag, 'archive']} search={getFilterSearch(searchParams?.filter)} />
            <Container>
                <Search selected={item} type="item" />
                <div style={{ paddingTop: '20px' }}>
                    <ArchivedAuctionsList item={item} />
                </div>
            </Container>
        </>
    )
}

function getFilterSearch(filter?: string): string | undefined {
    return typeof filter === 'string' && filter ? `filter=${encodeURIComponent(filter)}` : undefined
}

export async function generateMetadata(props) {
    const searchParams = await props.searchParams
    const params = await props.params
    const tag = params?.tag as string
    const item = await getItemDetailsOrNull(tag)
    const itemName = item?.name || convertTagToName(tag)
    // only filter keys the item really has, so nothing but filters shows up in the embed
    const filter = await getKnownArchiveFilter(tag, searchParams.filter)

    return getHeadMetadata(
        `${itemName} archived auctions`,
        joinEmbedParts([`Archived auctions of ${itemName} in Hypixel SkyBlock`, getItemFilterEmbedText(filter)]),
        item?.iconUrl || api.getItemImageUrl({ tag } as Item),
        [itemName],
        `${itemName} | Archived Auctions`,
        getArchiveCanonicalUrl(tag, searchParams.filter),
        // item icons are 16x16 to 64x64 depending on the item, so no size is claimed
        { imageAlt: `${itemName} icon` }
    )
}
