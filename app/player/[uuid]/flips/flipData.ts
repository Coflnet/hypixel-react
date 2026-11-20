import { cache } from 'react'
import { initAPI } from '../../../../api/ApiHelper'
import { parseFlipTrackingFlip, parseFlipTrackingResponse, parsePlayer } from '../../../../utils/Parser/APIResponseParser'
import { getFlipComponentEmbed, getFlipListComponentEmbed } from '../../../../utils/DiscordPageEmbeds'
import type { DiscordEmbedPayload } from '../../../../utils/DiscordComponentEmbed'

// Data of the tracked flips pages, shared by the pages, their metadata and their Discord embed route

// cache() shares the player name and tracked flips between generateMetadata and the page
export const getFlipData = cache(async (uuid: string) => {
    const api = initAPI(true)
    const apiResponses = await Promise.all([api.getPlayerName(uuid), api.getTrackedFlipsForPlayer(uuid)].map(p => p.catch(() => null)))

    return {
        player: {
            uuid: uuid,
            name: apiResponses[0] || uuid
        },
        flipTrackingResponse: apiResponses[1] || { flips: [], totalProfit: 0 },
        loadError: apiResponses[1] === null ? 'Could not load tracked flips. Please try again.' : undefined
    }
})

// cache() shares the tracked flips between generateMetadata and the page
export const getTargetFlipData = cache(async (uuid: string, flipUid: string) => {
    const api = initAPI(true)
    const apiResponses = await Promise.all([api.getPlayerName(uuid), api.getTrackedFlipsForPlayer(uuid)].map(p => p.catch(() => null)))

    return {
        player: {
            uuid: uuid,
            name: apiResponses[0] || uuid
        },
        flipTrackingResponse: apiResponses[1],
        targetFlip: (apiResponses[1] as FlipTrackingResponse)?.flips?.find(f => f.uId.toString(16) === flipUid) || null
    }
})

/** The Discord embed of a player's tracked flips; none when they could not be loaded (Discord would cache "no flips") */
export async function getFlipListPageEmbed(uuid: string): Promise<DiscordEmbedPayload | null> {
    const flipData = await getFlipData(uuid)
    if (flipData.loadError) {
        return null
    }
    return getFlipListComponentEmbed(parsePlayer(flipData.player), parseFlipTrackingResponse(flipData.flipTrackingResponse))
}

/** The Discord embed of one tracked flip, or of the flip list when the flip is not among the tracked ones */
export async function getFlipPageEmbed(uuid: string, flipUid: string): Promise<DiscordEmbedPayload | null> {
    const flipData = await getTargetFlipData(uuid, flipUid)
    const player = parsePlayer(flipData.player)
    if (flipData.targetFlip) {
        return getFlipComponentEmbed(player, parseFlipTrackingFlip(flipData.targetFlip))
    }
    return flipData.flipTrackingResponse ? getFlipListComponentEmbed(player, parseFlipTrackingResponse(flipData.flipTrackingResponse)) : null
}
