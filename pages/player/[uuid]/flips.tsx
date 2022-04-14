import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../../../api/ApiHelper'
import { FlipTracking } from '../../../components/FlipTracking/FlipTracking'
import Search from '../../../components/Search/Search'
import { numberWithThousandsSeperators } from '../../../utils/Formatter'
import { parseFlipTrackingFlip, parseFlipTrackingResponse, parsePlayer } from '../../../utils/Parser/APIResponseParser'
import { getHeadElement } from '../../../utils/SSRUtils'

interface Props {
    flipTrackingResponse: any
    player: any
    targetFlip?: any
}

function Flipper(props: Props) {
    let flipTrackingResponse = parseFlipTrackingResponse(props.flipTrackingResponse)
    let player = parsePlayer(props.player)
    let targetFlip = props.targetFlip ? parseFlipTrackingFlip(props.targetFlip) : null

    function getEmbedDescription() {
        if (!flipTrackingResponse.flips || flipTrackingResponse.flips.length === 0) {
            return `There were no tracked flips found for ${player.name}`
        }

        let profitByFinder = {}
        flipTrackingResponse.flips.forEach(flip => {
            if (!flip.finder.label) {
                return
            }
            if (!profitByFinder[flip.finder.label]) {
                profitByFinder[flip.finder.label] = 0
            }
            profitByFinder[flip.finder.label] += flip.profit
        })

        let finderByGroupArray: any[] = []
        Object.keys(profitByFinder).forEach(key => {
            finderByGroupArray.push({
                label: key,
                profit: profitByFinder[key]
            })
        })
        finderByGroupArray = finderByGroupArray.sort((a, b) => b.profit - a.profit)

        let profitByFinderEmbed = ''
        finderByGroupArray.forEach(finderGroup => {
            if (finderGroup.profit > 0) {
                profitByFinderEmbed += `${finderGroup.label}: ${numberWithThousandsSeperators(finderGroup.profit)} Coins \n`
            }
        })

        let highestProfitFlipText = `Highest Profit Flip: ${numberWithThousandsSeperators(
            flipTrackingResponse.flips[0].profit
        )} Coins \n ${numberWithThousandsSeperators(flipTrackingResponse.flips[0].pricePaid)} Coins ➞ ${numberWithThousandsSeperators(
            flipTrackingResponse.flips[0].soldFor
        )} Coins (${flipTrackingResponse.flips[0].item.name})`

        return `Found Flips: ${flipTrackingResponse.flips.length} 
                Total Profit: ${numberWithThousandsSeperators(flipTrackingResponse.totalProfit)} Coins
                \n ${profitByFinderEmbed} 
                ${highestProfitFlipText}`
    }

    function getTargetFlipEmbedDescription(targetFlip: FlipTrackingFlip) {
        return `💰 Profit:  ${numberWithThousandsSeperators(targetFlip.profit)} Coins
        💸 Purchase: ${numberWithThousandsSeperators(targetFlip.pricePaid)} Coins
        📝Sold: ${numberWithThousandsSeperators(targetFlip.soldFor)} Coins
        😀 Player: ${player.name}`
    }

    function _getHeadElement() {
        if (targetFlip !== null) {
            return getHeadElement(
                `Flip: ${targetFlip?.item.name}`,
                getTargetFlipEmbedDescription(targetFlip!),
                targetFlip?.item.iconUrl?.split('?')[0],
                ['tracker'],
                `Flip: ${targetFlip?.item.name}`
            )
        } else {
            return getHeadElement(
                `Tracked flip of ${player.name}`,
                getEmbedDescription(),
                player.iconUrl?.split('?')[0],
                ['tracker'],
                `Tracked flips of ${player.name}`
            )
        }
    }

    return (
        <div className="page">
            {_getHeadElement()}
            <Container>
                <Search
                    type="player"
                    currentElement={
                        <p>
                            <span style={{ fontSize: 'larger', marginRight: '20px' }}>Tracked flips of:</span>
                            <img
                                crossOrigin="anonymous"
                                className="playerHeadIcon"
                                src={player.iconUrl}
                                height="32"
                                alt=""
                                style={{ marginRight: '10px' }}
                                loading="lazy"
                            />
                            <span>{player.name}</span>
                        </p>
                    }
                />
                <FlipTracking totalProfit={flipTrackingResponse.totalProfit} trackedFlips={flipTrackingResponse.flips} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ query }) => {
    let api = initAPI(true)
    let apiResponses = await Promise.all([api.getPlayerName(query.uuid), api.getTrackedFlipsForPlayer(query.uuid)].map(p => p.catch(e => null)))

    return {
        props: {
            player: {
                uuid: query.uuid,
                name: apiResponses[0]
            },
            flipTrackingResponse: apiResponses[1],
            targetFlip: query.targetFlip ? (apiResponses[1] as FlipTrackingResponse)?.flips?.find(f => f.uId.toString() === query.targetFlip) : null
        }
    }
}

export default Flipper
