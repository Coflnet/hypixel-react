import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from 'react-bootstrap'
import { initAPI } from '../../../../../api/ApiHelper'
import { parseFlipTrackingFlip, parseFlipTrackingResponse, parsePlayer } from '../../../../../utils/Parser/APIResponseParser'
import { numberWithThousandsSeparators, removeMinecraftColorCoding } from '../../../../../utils/Formatter'
import { FlipTracking } from '../../../../../components/FlipTracking/FlipTracking'
import Search from '../../../../../components/Search/Search'
import { getHeadMetadata } from '../../../../../utils/SSRUtils'
import { getEmbedDescription } from '../page'
import RBContainer from '../../../../../components/ReactBootstrapWrapper/Container'

export default async function Page({ params }) {
    let flipData = await getFlipData(params.uuid, params.flipUid)

    let flipTrackingResponse = parseFlipTrackingResponse(flipData.flipTrackingResponse)
    let player = parsePlayer(flipData.player)
    let targetFlip = flipData.targetFlip ? parseFlipTrackingFlip(flipData.targetFlip) : null

    return (
        <>
            <RBContainer>
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
                <FlipTracking
                    totalProfit={flipTrackingResponse.totalProfit}
                    trackedFlips={flipTrackingResponse.flips}
                    highlightedFlipUid={targetFlip?.uId.toString(16)}
                />
            </RBContainer>
        </>
    )
}

async function getFlipData(uuid: string, flipUid: string) {
    let api = initAPI(true)
    let apiResponses = await Promise.all([api.getPlayerName(uuid), api.getTrackedFlipsForPlayer(uuid)].map(p => p.catch(e => null)))

    return {
        player: {
            uuid: uuid,
            name: apiResponses[0]
        },
        flipTrackingResponse: apiResponses[1],
        targetFlip: (apiResponses[1] as FlipTrackingResponse)?.flips?.find(f => f.uId.toString(16) === flipUid) || null
    }
}

export async function generateMetadata({ params }) {
    function getTargetFlipEmbedDescription(targetFlip: FlipTrackingFlip) {
        return `${targetFlip.profit > 0 ? '📈 Profit' : '📉 Loss'}:  ${numberWithThousandsSeparators(targetFlip.profit)} Coins ${
            targetFlip.profit > 0 ? `(${numberWithThousandsSeparators(Math.round((targetFlip.profit / targetFlip.pricePaid) * 98))}%)` : ''
        }
        💸 Purchase: ${numberWithThousandsSeparators(targetFlip.pricePaid)} Coins
        💰 Sold: ${numberWithThousandsSeparators(targetFlip.soldFor)} Coins
        🕑 Sold at ${moment(targetFlip.sellTime).format('MMMM Do YYYY, h:mm:ss a')}
        ${targetFlip.profit > 0 ? '😀' : '😭'} IGN: ${player.name}`
    }

    let flipData = await getFlipData(params.uuid, params.flipUid)
    let player = parsePlayer(flipData.player)
    let targetFlip = flipData.targetFlip ? parseFlipTrackingFlip(flipData.targetFlip) : null
    return flipData.targetFlip
        ? getHeadMetadata(
              `Tracked flips of ${player.name}`,
              getTargetFlipEmbedDescription(targetFlip!),
              targetFlip?.item.iconUrl?.split('?')[0],
              ['tracker'],
              `Flip: ${removeMinecraftColorCoding(targetFlip?.item.name)}`
          )
        : getHeadMetadata(
              `Tracked flips of ${player.name}`,
              getEmbedDescription(parseFlipTrackingResponse(flipData.flipTrackingResponse), player),
              player.iconUrl?.split('?')[0],
              ['tracker'],
              `Tracked flips of ${player.name}`
          )
}
