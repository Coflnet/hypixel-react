import { notFound } from 'next/navigation'
import { cache } from 'react'
import { initAPI } from '../../../api/ApiHelper'
import { isDefinitePlayerMiss } from '../../../utils/GeneratedApiResponseUtils'
import { parseAuction } from '../../../utils/Parser/APIResponseParser'
import { getPlayerComponentEmbed } from '../../../utils/DiscordPageEmbeds'
import type { DiscordEmbedPayload } from '../../../utils/DiscordComponentEmbed'

// Data of the player page, shared by the page, its metadata and its Discord embed route

// cache() shares the player name and auctions between generateMetadata and the page
export const getPlayerInfo = cache(async (uuid: string) => {
    const api = initAPI(true)
    let playerName = ''
    try {
        playerName = await api.getPlayerName(uuid)
    } catch (e) {
        // only a definite miss is a 404, backend failures must error so crawlers retry
        if (isDefinitePlayerMiss(e)) {
            notFound()
        }
        throw e
    }
    let auctions: Auction[] = []
    let auctionsLoadError = false
    try {
        auctions = await api.getAuctions(uuid, 0)
    } catch (e) {
        auctionsLoadError = true
        console.error(`Error loading player auctions for player ${uuid}. ${JSON.stringify(e)}`)
    }

    return {
        auctions: auctions || [],
        // the page still renders without auctions, but an embed must not claim there are none
        auctionsLoadError,
        player: {
            uuid: uuid,
            // players without a known name are shown by their uuid
            name: playerName || uuid
        }
    }
})

/** The Discord embed of the player page; none when the auctions could not be loaded */
export async function getPlayerPageEmbed(uuid: string): Promise<DiscordEmbedPayload | null> {
    const info = await getPlayerInfo(uuid)
    if (info.auctionsLoadError) {
        return null
    }
    return getPlayerComponentEmbed(info.player, info.auctions.map(parseAuction), Date.now())
}
