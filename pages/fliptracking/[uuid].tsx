import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { FlipTracking } from '../../components/FlipTracking/FlipTracking'
import Search from '../../components/Search/Search'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import { parseFlipTrackingResponse } from '../../utils/Parser/APIResponseParser'
import { getHeadElement } from '../../utils/SSRUtils'

interface Props {
    flipTrackingResponse: any
    playerName: string
}

function Flipper(props: Props) {
    let flipTrackingResponse = parseFlipTrackingResponse(props.flipTrackingResponse)

    return (
        <div className="page">
            {getHeadElement(
                `Tracked flips of ${props.playerName}`,
                `${props.playerName} has ${flipTrackingResponse.flips.length} flips, resulting in a total profit of ${numberWithThousandsSeperators(
                    flipTrackingResponse.totalProfit
                )} Coins`,
                undefined,
                ['tracker']
            )}
            <Container>
                <Search />
                <h2>Flip-Tracker</h2>
                <hr />
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
            playerName: apiResponses[0],
            flipTrackingResponse: apiResponses[1]
        }
    }
}

export default Flipper
