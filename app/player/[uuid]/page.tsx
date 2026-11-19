import { initAPI } from '../../../api/ApiHelper'
import { getHeadMetadata, getCanonicalUrl, applyPlayerRobots } from '../../../utils/SSRUtils'
import { notFound, unstable_rethrow } from 'next/navigation'
import { cache } from 'react'
import PlayerDetails from '../../../components/PlayerDetails/PlayerDetails'
import { parseAuction, parsePlayer } from '../../../utils/Parser/APIResponseParser'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../../components/BottomBanner/BottomBanner'
import { Metadata } from 'next'
import { isDefinitePlayerMiss } from '../../../utils/GeneratedApiResponseUtils'
import { getPlayerEmbedDescription, getPlayerEmbedOptions, getPlayerHeadRenderUrl } from '../../../utils/EmbedUtils'

export default async function Page(props) {
    const params = await props.params
    const playerInfo = await getPlayerInfo(params.uuid)
    return (
        <>
            <Container>
                <PlayerDetails player={parsePlayer(playerInfo.player)} auctions={playerInfo.auctions.map(parseAuction)} renderedAt={Date.now()} />
            </Container>
            <BottomBanner />
        </>
    )
}

// cache() shares the player name and auctions between generateMetadata and the page
const getPlayerInfo = cache(async (uuid: string) => {
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
    try {
        auctions = await api.getAuctions(uuid, 0)
    } catch (e) {
        console.error(`Error loading player auctions for player ${uuid}. ${JSON.stringify(e)}`)
    }

    return {
        auctions: auctions || [],
        player: {
            uuid: uuid,
            // players without a known name are shown by their uuid
            name: playerName || uuid
        }
    }
})

export async function generateMetadata(props): Promise<Metadata> {
    const params = await props.params
    const playerInfo = await getPlayerInfoForMetadata(params.uuid)
    const name = playerInfo?.player.name || params.uuid
    const metadata = getHeadMetadata(
        `${name} Auctions and Bids | Hypixel SkyBlock AH history tracker`,
        getPlayerEmbedDescription(name, playerInfo?.auctions.map(parseAuction), Date.now()),
        getPlayerHeadRenderUrl(params.uuid),
        [name],
        `${name} | SkyBlock Auctions`,
        getCanonicalUrl(`/player/${params.uuid}`),
        getPlayerEmbedOptions(name)
    )

    return applyPlayerRobots(metadata, params.uuid)
}

async function getPlayerInfoForMetadata(uuid: string) {
    try {
        return await getPlayerInfo(uuid)
    } catch (e) {
        // a 404 must still reach Next, any other failure falls back to the generic embed
        unstable_rethrow(e)
        console.error(`Error loading player info for metadata ${uuid}. ${JSON.stringify(e)}`)
        return null
    }
}

export const revalidate = 0
