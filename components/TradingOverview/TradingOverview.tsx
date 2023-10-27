'use client'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Container } from 'react-bootstrap'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import api from '../../api/ApiHelper'
import { parsePlayer } from '../../utils/Parser/APIResponseParser'
import { useState } from 'react'
import TradeInventory from '../PlayerInventory/PlayerInventory'
import TradeCreate from '../TradeCreate/TradeCreate'

interface TradeOffer {
    player: Player
    offer: Item[]
    request: Item[]
}

export default function TradingOverview() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)

    return (
        <>
            <Container>
                {isLoggedIn ? <TradeCreate /> : <p>You need to be logged in, to use the trading feature.</p>}
                <GoogleSignIn
                    onAfterLogin={() => {
                        setIsLoggedIn(true)
                    }}
                />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Trading')
