import React, { useEffect, useState } from 'react'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Button, Card, Form, Modal, OverlayTrigger } from 'react-bootstrap'
import NavBar from '../NavBar/NavBar'
import PremiumFeatures from './PremiumFeatures/PremiumFeatures'
import api from '../../api/ApiHelper'
import moment from 'moment'
import styles from './Premium.module.css'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import CoflCoinsPurchase from '../CoflCoins/CoflCoinsPurchase'
import BuyPremium from './BuyPremium/BuyPremium'
import Tooltip from '../Tooltip/Tooltip'
import TransferCoflCoins from '../TransferCoflCoins/TransferCoflCoins'
import { CANCELLATION_RIGHT_CONFIRMED } from '../../utils/SettingsUtils'

function Premium() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState<boolean>()
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [isLoading, setIsLoading] = useState(false)
    let [isLoggingIn, setIsLoggingIn] = useState(false)
    let [showSendCoflCoins, setShowSendCoflCoins] = useState(false)
    let [cancellationRightLossConfirmed, setCancellationRightLossConfirmed] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    useEffect(() => {
        if (!wasAlreadyLoggedIn && !isLoggedIn) {
            setHasPremium(false)
        }
        if (localStorage.getItem('googleId') !== null) {
            setIsLoggingIn(true)
        }
        setIsSSR(false)
        setCancellationRightLossConfirmed(localStorage.getItem(CANCELLATION_RIGHT_CONFIRMED) === 'true')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function loadHasPremiumUntil(): Promise<void> {
        let googleId = localStorage.getItem('googleId')
        return api.hasPremium(googleId!).then(hasPremiumUntil => {
            let hasPremium = false
            if (hasPremiumUntil !== undefined && hasPremiumUntil.getTime() > new Date().getTime()) {
                hasPremium = true
            }
            setHasPremium(hasPremium)
            setHasPremiumUntil(hasPremiumUntil)
            setIsLoading(false)
        })
    }

    function onLogin() {
        let googleId = localStorage.getItem('googleId')
        if (googleId) {
            setIsLoading(true)
            setIsLoggingIn(false)
            setIsLoggedIn(true)
            loadHasPremiumUntil()
        }
    }

    function onLoginFail() {
        setIsLoggingIn(false)
        setIsLoggedIn(false)
        setHasPremium(false)
    }

    return (
        <div>
            <h2>
                <NavBar />
                Premium
            </h2>
            <hr />
            {isLoading ? (
                getLoadingElement()
            ) : hasPremium === undefined ? (
                ''
            ) : hasPremium ? (
                <p style={{ color: '#00bc8c' }}>You have a premium account. Thank you for your support.</p>
            ) : (
                <div>
                    <p style={{ color: 'red', margin: 0 }}>You do not have a premium account</p>
                </div>
            )}
            {isLoggedIn && !hasPremium ? (
                <p>
                    <a href="#buyPremium">I want Premium!</a>
                </p>
            ) : (
                ''
            )}
            <hr />
            <div style={{ marginBottom: '20px' }}>
                {hasPremium ? (
                    <div>
                        <Tooltip
                            type="hover"
                            content={<span>Your premium ends: {moment(hasPremiumUntil).fromNow()}</span>}
                            tooltipContent={<span>{hasPremiumUntil?.toDateString()}</span>}
                        />
                    </div>
                ) : null}
                {!isLoggingIn && !isLoggedIn ? <p>To use premium please login with Google</p> : ''}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                <div>{isLoggingIn ? getLoadingElement() : ''}</div>
            </div>
            {isLoggedIn ? (
                <div style={{ marginBottom: '20px' }}>
                    <BuyPremium />
                </div>
            ) : null}
            {isLoggedIn ? (
                <div style={{ marginBottom: '20px' }}>
                    <hr />
                    <h2>
                        CoflCoins
                        <Button
                            className={styles.sendCoflCoinsButton}
                            onClick={() => {
                                setShowSendCoflCoins(true)
                            }}
                        >
                            Send CoflCoins
                        </Button>
                        <Modal
                            size={'lg'}
                            show={showSendCoflCoins}
                            onHide={() => {
                                setShowSendCoflCoins(false)
                            }}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Send CoflCoins</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <TransferCoflCoins
                                    onFinish={() => {
                                        setShowSendCoflCoins(false)
                                    }}
                                />
                            </Modal.Body>
                        </Modal>
                    </h2>
                    {!cancellationRightLossConfirmed ? (
                        <p>
                            <Form.Check
                                id={'cancellationRightCheckbox'}
                                className={styles.cancellationRightCheckbox}
                                defaultChecked={isSSR ? false : localStorage.getItem(CANCELLATION_RIGHT_CONFIRMED) === 'true'}
                                onChange={e => {
                                    localStorage.setItem(CANCELLATION_RIGHT_CONFIRMED, e.target.checked.toString())
                                    setCancellationRightLossConfirmed(e.target.checked)
                                }}
                            />
                            <label htmlFor={'cancellationRightCheckbox'}>
                                By buying one of the following products, you confirm the immediate execution of the contract, hereby losing your cancellation
                                right.
                            </label>
                        </p>
                    ) : null}
                    <CoflCoinsPurchase disabled={!cancellationRightLossConfirmed} />
                </div>
            ) : null}
            <hr />
            <h2>Features</h2>
            <Card className={styles.premiumCard}>
                <Card.Header>
                    <Card.Title>
                        {hasPremium ? (
                            <p>
                                Thank you for your support. You have a Premium account. By buying another Premium-Plan you can extend your premium-time. You can
                                use the following premium-features:
                            </p>
                        ) : (
                            <p>Log in and buy Premium to support us and get access to these features</p>
                        )}
                    </Card.Title>
                </Card.Header>
                <div style={{ padding: '15px' }}>
                    <PremiumFeatures />
                </div>
            </Card>
        </div>
    )
}

export default Premium
