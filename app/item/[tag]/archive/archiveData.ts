import { cache } from 'react'
import api, { initAPI } from '../../../../api/ApiHelper'
import { atobUnicode } from '../../../../utils/Base64Utils'
import { convertTagToName } from '../../../../utils/Formatter'
import { getKnownItemFilter } from '../../../../utils/KnownItemFilter'
import { getArchiveComponentEmbed } from '../../../../utils/DiscordPageEmbeds'
import type { DiscordEmbedPayload } from '../../../../utils/DiscordComponentEmbed'

// Data of the archived auctions page, shared by its metadata and its Discord embed route

// cache() shares the item details within one render or route request
export const getItemDetailsOrNull = cache(async (tag: string): Promise<Item | null> => {
    try {
        return await initAPI(true).getItemDetails(tag)
    } catch (e) {
        console.error(`Error loading item details for archive metadata ${tag}. ${e instanceof Error ? e.message : JSON.stringify(e)}`)
        return null
    }
})

export function parseArchiveFilter(filter?: string): ItemFilter | null {
    if (!filter) {
        return null
    }
    try {
        return JSON.parse(atobUnicode(filter))
    } catch {
        return null
    }
}

/** The archive filter reduced to keys the item has filter options for */
export function getKnownArchiveFilter(tag: string, filter?: string): Promise<ItemFilter | null> {
    return getKnownItemFilter(tag, parseArchiveFilter(filter))
}

/** The Discord embed of the archive page; none when the item is unknown */
export async function getArchivePageEmbed(tag: string, filter?: string): Promise<DiscordEmbedPayload | null> {
    const details = await getItemDetailsOrNull(tag)
    if (!details) {
        return null
    }
    return getArchiveComponentEmbed({
        tag,
        name: details.name || convertTagToName(tag),
        iconUrl: details.iconUrl || api.getItemImageUrl({ tag } as Item),
        tier: details.tier,
        filter: await getKnownArchiveFilter(tag, filter),
        filterParam: filter
    })
}
