import React, { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import NumberFormat from 'react-number-format'
import { useCoflCoins } from '../../utils/Hooks'
import { PlayerFilterElement } from '../FilterElement/FilterElements/PlayerFilterElement'
import TransferCoflCoinsSummary from './TransferCoflCoinsSummary'
import { numberWithThousandsSeperators } from '../../utils/Formatter'

interface Props {
    onFinish()
}

function TransferCoflCoins(props: Props) {
    let [minecraftPlayer, setMinecraftPlayer] = useState<Player>()
    let [email, setEmail] = useState('')
    let [coflCoinsToSend, setCoflCoinsToSend] = useState(0)
    let coflCoinsBalance = useCoflCoins()
    let [showSummary, setShowSummary] = useState(false)

    function onContinue() {
        setShowSummary(true)
    }

    return (
        <>
            <div style={{ display: showSummary ? 'none' : 'initial' }}>
                <p>There are 2 ways to send CoflCoins to another person:</p>
                <ul>
                    <li>
                        <b>By Email:</b> Enter the email of the Google account of the receiver
                    </li>
                    <li>
                        <b>By Minecraft name:</b> Search the players Minecraft name (only works if they linked their Minecraft account on the website)
                    </li>
                </ul>
                <p>Info: We set a limit, so you can only send CoflCoins 42 times a month, to prevent abuse.</p>
                <hr />
                <div style={{ padding: '0 50px 0 50px' }}>
                    <div>
                        {minecraftPlayer === undefined ? (
                            <div style={{ marginBottom: '20px' }}>
                                By Email
                                <Form.Control
                                    placeholder="Enter Email..."
                                    onChange={e => {
                                        setEmail(e.target.value)
                                    }}
                                />
                            </div>
                        ) : null}
                        {email === '' ? (
                            <div style={{ marginBottom: '20px' }}>
                                By Minecraft name
                                <PlayerFilterElement
                                    defaultValue=""
                                    onChange={p => {
                                        setMinecraftPlayer(p as Player)
                                    }}
                                    returnType={'player'}
                                    placeholder="Enter Minecraft name..."
                                />
                            </div>
                        ) : null}
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        Amount of CoflCoins{' '}
                        <NumberFormat
                            id="coflcoins-to-send"
                            onValueChange={n => {
                                setCoflCoinsToSend(n.floatValue)
                            }}
                            isAllowed={value => {
                                return value.floatValue <= coflCoinsBalance
                            }}
                            customInput={Form.Control}
                            defaultValue={0}
                            thousandSeparator="."
                            decimalSeparator=","
                            allowNegative={false}
                            decimalScale={1}
                        />
                    </div>
                    <span>Your current Balance: {numberWithThousandsSeperators(coflCoinsBalance)}</span>
                    <Button
                        variant="success"
                        style={{ float: 'right' }}
                        onClick={onContinue}
                        disabled={coflCoinsToSend <= 0 || (email === '' && minecraftPlayer === undefined)}
                    >
                        Continue
                    </Button>
                </div>
            </div>
            {showSummary ? (
                <TransferCoflCoinsSummary
                    receiverType={minecraftPlayer !== undefined ? 'mcId' : 'email'}
                    coflCoins={coflCoinsToSend}
                    email={email}
                    player={minecraftPlayer}
                    onBack={() => {
                        setShowSummary(false)
                    }}
                    onFinish={props.onFinish}
                />
            ) : null}
        </>
    )
}

export default TransferCoflCoins
