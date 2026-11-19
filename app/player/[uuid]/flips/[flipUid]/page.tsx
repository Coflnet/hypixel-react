import { cache, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { initAPI } from '../../../../../api/ApiHelper'
import { parseFlipTrackingFlip, parseFlipTrackingResponse, parsePlayer } from '../../../../../utils/Parser/APIResponseParser'
import { removeMinecraftColorCoding } from '../../../../../utils/Formatter'
import { FlipTracking } from '../../../../../components/FlipTracking/FlipTracking'
import Search from '../../../../../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl, applyPlayerRobots } from '../../../../../utils/SSRUtils'
import { getFlipEmbedDescription, getFlipListEmbedDescription, getPlayerEmbedOptions, getPlayerHeadRenderUrl } from '../../../../../utils/EmbedUtils'
import { Container } from 'react-bootstrap'

export default async function Page(props) {
    const params = await props.params
    const flipData = await getFlipData(params.uuid, params.flipUid)

    const flipTrackingResponse = parseFlipTrackingResponse(flipData.flipTrackingResponse)
    const player = parsePlayer(flipData.player)
    const targetFlip = flipData.targetFlip ? parseFlipTrackingFlip(flipData.targetFlip) : null

    return (
        <>
            <Container>
                <Search
                    type="player"
                    currentElement={
                        <p>
                            <span style={{ fontSize: 'larger', marginRight: '20px' }}>Tracked flips of:</span>
                            <Link href={`/player/${player.uuid}`}>
                                <span style={{ cursor: 'pointer' }}>
                                    <Image
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={player.iconUrl || ''}
                                        height="32"
                                        width="32"
                                        alt=""
                                        style={{ marginRight: '10px' }}
                                    />
                                    <span>{player.name}</span>
                                </span>
                            </Link>
                        </p>
                    }
                />
                <Suspense>
                    <FlipTracking
                        totalProfit={flipTrackingResponse.totalProfit}
                        trackedFlips={flipTrackingResponse.flips}
                        highlightedFlipUid={targetFlip?.uId.toString(16)}
                        playerUUID={params.uuid}
                    />
                </Suspense>
            </Container>
        </>
    )
}

// cache() shares the tracked flips between generateMetadata and the page
const getFlipData = cache(async (uuid: string, flipUid: string) => {
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

export async function generateMetadata(props) {
    const params = await props.params
    const flipData = await getFlipData(params.uuid, params.flipUid)
    const player = parsePlayer(flipData.player)
    const canonicalUrl = getCanonicalUrl(`/player/${params.uuid}/flips/${params.flipUid}`)
    const metadata = flipData.targetFlip
        ? getTargetFlipMetadata(parseFlipTrackingFlip(flipData.targetFlip), player, canonicalUrl)
        : getHeadMetadata(
              `Tracked flips of ${player.name}`,
              getFlipListEmbedDescription(parseFlipTrackingResponse(flipData.flipTrackingResponse), player.name),
              getPlayerHeadRenderUrl(params.uuid),
              ['tracker'],
              `${player.name} | Tracked Flips`,
              canonicalUrl,
              getPlayerEmbedOptions(player.name)
          )
    return applyPlayerRobots(metadata, params.uuid)
}

function getTargetFlipMetadata(targetFlip: FlipTrackingFlip, player: Player, canonicalUrl: string) {
    const itemName = removeMinecraftColorCoding(targetFlip.item.name)
    return getHeadMetadata(
        `Tracked flips of ${player.name}`,
        getFlipEmbedDescription(targetFlip, player.name),
        targetFlip.item.iconUrl?.split('?')[0],
        ['tracker'],
        `${itemName} flip by ${player.name}`,
        canonicalUrl,
        { imageAlt: `${itemName} icon`, type: 'article' }
    )
}

export const revalidate = 0
