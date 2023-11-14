'use client'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Button, Container } from 'react-bootstrap'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { useState } from 'react'
import TradeCreate from '../TradeCreate/TradeCreate'
import TradeList from '../TradeList/TradeList'

export default function TradingOverview() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [isCreateTradeOpen, setIsCreateTradeOpen] = useState(false)

    if (!isLoggedIn) {
        return (
            <Container>
                <p>You need to be logged in, to use the trading feature.</p>
                <GoogleSignIn
                    onAfterLogin={() => {
                        setIsLoggedIn(true)
                    }}
                />
            </Container>
        )
    }

    return (
        <>
            <Container>
                {isCreateTradeOpen ? (
                    <TradeCreate />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                        <Button
                            onClick={() => {
                                setIsCreateTradeOpen(true)
                            }}
                        >
                            Create Trade
                        </Button>
                    </div>
                )}
                <hr />
                <TradeList />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Trading')
