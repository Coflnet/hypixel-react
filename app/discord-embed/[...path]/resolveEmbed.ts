import type { DiscordEmbedPayload } from '../../../utils/DiscordComponentEmbed'
import { isValidFlipUid, isValidItemTag, isValidPlayerUuid, searchParamsToObject } from '../../../utils/DiscordEmbedLink'
import { getPlayerPageEmbed } from '../../player/[uuid]/playerData'
import { getFlipListPageEmbed, getFlipPageEmbed } from '../../player/[uuid]/flips/flipData'
import { getAuctionPageEmbed, isValidAuctionIdFormat } from '../../auction/[auctionUUID]/auctionData'
import { getItemPageEmbed } from '../../item/[tag]/itemData'
import { getArchivePageEmbed } from '../../item/[tag]/archive/archiveData'

/*
 Maps /discord-embed/<page path> back to the page: /discord-embed/player/<uuid>/flips is the embed of /player/<uuid>/flips.
 Route params arrive percent-decoded and the API clients put path params into backend URLs unescaped, so every segment
 is validated before a loader runs (..%2F would otherwise walk the backend path, %3F/%23 would add a query or fragment).
 Unknown paths, invalid segments and pages without an embed resolve to null.
*/

type Resolved = Promise<DiscordEmbedPayload | null>

const NONE: Resolved = Promise.resolve(null)
const MAX_SEGMENTS = 4

function resolvePlayer(uuid: string, section?: string, flipUid?: string): Resolved {
    if (!isValidPlayerUuid(uuid)) {
        return NONE
    }
    if (!section) {
        return getPlayerPageEmbed(uuid)
    }
    if (section !== 'flips') {
        return NONE
    }
    if (flipUid === undefined) {
        return getFlipListPageEmbed(uuid)
    }
    return isValidFlipUid(flipUid) ? getFlipPageEmbed(uuid, flipUid) : NONE
}

function resolveItem(tag: string, section: string | undefined, search: URLSearchParams): Resolved {
    if (!isValidItemTag(tag)) {
        return NONE
    }
    if (!section) {
        return getItemPageEmbed(tag, searchParamsToObject(search))
    }
    return section === 'archive' ? getArchivePageEmbed(tag, search.get('filter') || undefined) : NONE
}

function resolveAuction(auctionId: string, section?: string): Resolved {
    return !section && isValidAuctionIdFormat(auctionId) ? getAuctionPageEmbed(auctionId) : NONE
}

export function resolveDiscordEmbed(path: string[], search: URLSearchParams): Resolved {
    const [page, id, section, subId] = path
    if (!id || path.length > MAX_SEGMENTS) {
        return NONE
    }
    if (page === 'player') {
        return resolvePlayer(id, section, subId)
    }
    if (page === 'auction') {
        return resolveAuction(id, section)
    }
    return page === 'item' && !subId ? resolveItem(id, section, search) : NONE
}
