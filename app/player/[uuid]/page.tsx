import { getHeadMetadata, getCanonicalUrl, applyPlayerRobots } from '../../../utils/SSRUtils'
import { unstable_rethrow } from 'next/navigation'
import PlayerDetails from '../../../components/PlayerDetails/PlayerDetails'
import { parseAuction, parsePlayer } from '../../../utils/Parser/APIResponseParser'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../../components/BottomBanner/BottomBanner'
import { Metadata } from 'next'
import { getPlayerEmbedDescription, getPlayerEmbedOptions, getPlayerHeadRenderUrl } from '../../../utils/EmbedUtils'
import { DiscordEmbedLink } from '../../../components/DiscordEmbed/DiscordEmbedLink'
import { getPlayerInfo } from './playerData'

export default async function Page(props) {
    const params = await props.params
    const playerInfo = await getPlayerInfo(params.uuid)
    const auctions = playerInfo.auctions.map(parseAuction)
    const renderedAt = Date.now()
    return (
        <>
            <DiscordEmbedLink segments={['player', params.uuid]} />
            <Container>
                {/* without server data the list loads the auctions itself instead of claiming there are none */}
                <PlayerDetails
                    player={parsePlayer(playerInfo.player)}
                    auctions={playerInfo.auctionsLoadError ? undefined : auctions}
                    renderedAt={renderedAt}
                />
            </Container>
            <BottomBanner />
        </>
    )
}

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
