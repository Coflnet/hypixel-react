import { initAPI } from '../../../api/ApiHelper'
import { getHeadMetadata, getCanonicalUrl } from '../../../utils/SSRUtils'
import { notFound } from 'next/navigation'
import PlayerDetails from '../../../components/PlayerDetails/PlayerDetails'
import { parseAuction, parsePlayer } from '../../../utils/Parser/APIResponseParser'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../../components/BottomBanner/BottomBanner'
import { Metadata } from 'next'

export default async function Page(props) {
    const params = await props.params
    let playerInfo = await getPlayerInfo(params.uuid)
    return (
        <>
            <Container>
                <PlayerDetails player={parsePlayer(playerInfo.player)} auctions={playerInfo.auctions.map(parseAuction)} />
            </Container>
            <BottomBanner />
        </>
    )
}

async function getPlayerInfo(uuid) {
    let api = initAPI(true)
    let playerName = ''
    try {
        playerName = await api.getPlayerName(uuid)
    } catch {
        notFound()
    }
    let auctions: any[] = []
    try {
        auctions = await api.getAuctions(uuid, 0)
    } catch (e) {
        console.error(`Error loading player auctions for player ${uuid}. ${JSON.stringify(e)}`)
    }

    return {
        auctions: (auctions as any[]) || [],
        player: {
            uuid: uuid,
            name: playerName
        }
    }
}

export async function generateMetadata(props): Promise<Metadata> {
    const params = await props.params
    let api = initAPI(true)
    let player = {
        name: '',
        iconUrl: ''
    } as any
    try {
        let name = await api.getPlayerName(params.uuid)
        player = parsePlayer({
            uuid: params.uuid,
            name
        })
    } catch (e) {
        console.error(`Error fetching player name ${params.uuid}. ${JSON.stringify(e)}`)
    }
    const metadata = getHeadMetadata(
        `${player?.name} Auctions and Bids | Hypixel SkyBlock AH history tracker`,
        `Auctions and bids for ${player?.name} in Hypixel Skyblock.`,
        player?.iconUrl?.split('?')[0],
        [player?.name || ''],
        `${player?.name} Auctions and Bids | Hypixel SkyBlock AH history tracker`,
        getCanonicalUrl(`/player/${params.uuid}`)
    )

    if (params.uuid === '17bdc3a6d75a44689c4fc1dbac8f09f5') {
        metadata.robots = {
            index: false,
            follow: true
        }
    }

    return metadata
}

export const revalidate = 0
