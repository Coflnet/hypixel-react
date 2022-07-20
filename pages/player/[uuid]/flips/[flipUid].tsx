import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../../../../api/ApiHelper'
import { FlipTracking } from '../../../../components/FlipTracking/FlipTracking'
import Search from '../../../../components/Search/Search'
import { numberWithThousandsSeperators } from '../../../../utils/Formatter'
import { parseFlipTrackingFlip, parseFlipTrackingResponse, parsePlayer } from '../../../../utils/Parser/APIResponseParser'
import { getHeadElement } from '../../../../utils/SSRUtils'
import moment from 'moment'
import Link from 'next/link'

interface Props {
    flipTrackingResponse: any
    player: any
    targetFlip: any
}

function Flipper(props: Props) {
    let flipTrackingResponse = parseFlipTrackingResponse(props.flipTrackingResponse)
    let player = parsePlayer(props.player)
    let targetFlip = parseFlipTrackingFlip(props.targetFlip)

    function getTargetFlipEmbedDescription(targetFlip: FlipTrackingFlip) {
        return `${targetFlip.profit > 0 ? '📈 Profit' : '📉 Loss'}:  ${numberWithThousandsSeperators(targetFlip.profit)} Coins
        💸 Purchase: ${numberWithThousandsSeperators(targetFlip.pricePaid)} Coins
        💰 Sold: ${numberWithThousandsSeperators(targetFlip.soldFor)} Coins
        🕑 Sold at ${moment(targetFlip.sellTime).format('MMMM Do YYYY, h:mm:ss a')}
        ${targetFlip.profit > 0 ? '😀' : '😭'} IGN: ${player.name}`
    }

    return (
        <div className="page">
            {getHeadElement(
                `Tracked flips of ${player.name}`,
                getTargetFlipEmbedDescription(targetFlip!),
                targetFlip?.item.iconUrl?.split('?')[0],
                ['tracker'],
                `Flip: ${targetFlip?.item.name}`
            )}
            <Container>
                <Search
                    type="player"
                    currentElement={
                        <p>
                            <span style={{ fontSize: 'larger', marginRight: '20px' }}>Tracked flips of:</span>
                            <Link href={`/player/${player.uuid}`}>
                                <span style={{ cursor: 'pointer' }}>
                                    <img
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={player.iconUrl}
                                        height="32"
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
            </Container>
        </div>
    )
}

export const getStaticProps = async ({ params }) => {
    let api = initAPI(true)
    let apiResponses = await Promise.all([api.getPlayerName(params.uuid), api.getTrackedFlipsForPlayer(params.uuid)].map(p => p.catch(e => null)))

    return {
        props: {
            player: {
                uuid: params.uuid,
                name: apiResponses[0]
            },
            flipTrackingResponse: apiResponses[1],
            targetFlip: (apiResponses[1] as FlipTrackingResponse)?.flips?.find(f => f.uId.toString(16) === params.flipUid)
        },
        revalidate: 60
    }
}

export async function getStaticPaths() {
    return { paths: [], fallback: 'blocking' }
}

export default Flipper
