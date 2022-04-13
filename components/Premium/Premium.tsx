import React, { useEffect, useState } from 'react'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Button, Card, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import NavBar from '../NavBar/NavBar'
import PremiumFeatures from './PremiumFeatures/PremiumFeatures'
import api from '../../api/ApiHelper'
import moment from 'moment'
import { Base64 } from 'js-base64'
import { v4 as generateUUID } from 'uuid'
import { GoogleLogout } from 'react-google-login'
import { toast } from 'react-toastify'
import styles from './Premium.module.css'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import { CoflCoinsDisplay } from '../CoflCoins/CoflCoinsDisplay'
import { useCoflCoins } from '../../utils/Hooks'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'

let PREMIUM_PRICE_MONTH = 1800

function Premium() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState<boolean>()
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [isLoading, setIsLoading] = useState(false)
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false)
    let [coflCoins] = useCoflCoins()
    let [purchasePremiumDuration, setPurchasePremiumDuration] = useState(1)
    let [isLoggingIn, setIsLoggingIn] = useState(false)
    let [purchaseSuccessfulMonths, setPurchaseSuccessfulMonths] = useState<number>()
    let [isPurchasing, setIsPurchasing] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    useEffect(() => {
        if (!wasAlreadyLoggedIn && !isLoggedIn) {
            setHasPremium(false)
        }
        if (localStorage.getItem('googleId') !== null) {
            setIsLoggingIn(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function onPremiumBuy(productId) {
        setIsPurchasing(true)
        api.purchaseWithCoflcoins(productId, purchasePremiumDuration).then(() => {
            document.dispatchEvent(
                new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: coflCoins - PREMIUM_PRICE_MONTH * purchasePremiumDuration } })
            )
            setPurchaseSuccessfulMonths(purchasePremiumDuration)
            setIsPurchasing(false)
            toast.success('Purchase successful')
        })
    }

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
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
    }

    function getAccountString() {
        let googleId = localStorage.getItem('googleId')
        if (googleId) {
            let parts = googleId.split('.')
            if (parts.length > 2) {
                let obj = JSON.parse(Base64.atob(parts[1]))
                return `${obj.name} (${obj.email})`
            }
        }
        return ''
    }

    function onLogout() {
        setIsLoggedIn(false)
        setHasPremium(false)
        localStorage.removeItem('googleId')
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
        toast.warn('Successfully logged out')
    }

    function onDurationChange(number: NumberFormatValues) {
        setPurchasePremiumDuration(number.floatValue || 1)
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
            {isLoggedIn ? <p>Account: {getAccountString()}</p> : ''}
            {hasPremium ? (
                <div>
                    <OverlayTrigger
                        overlay={
                            <Tooltip id={generateUUID()}>
                                <span>{hasPremiumUntil?.toDateString()}</span>
                            </Tooltip>
                        }
                    >
                        <span>Your premium ends: {moment(hasPremiumUntil).fromNow()}</span>
                    </OverlayTrigger>
                </div>
            ) : (
                ''
            )}
            {isLoggedIn ? (
                <div style={{ marginTop: '20px' }}>
                    <GoogleLogout
                        clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                        buttonText="Logout"
                        onLogoutSuccess={onLogout}
                    />
                </div>
            ) : (
                ''
            )}
            {!isLoggingIn && !isLoggedIn ? <p>To use premium please login with Google</p> : ''}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} rerenderFlip={rerenderGoogleSignIn} />
            {isLoggingIn ? getLoadingElement() : ''}
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
            {isLoggedIn ? (
                <div>
                    <hr />
                    <h2>Purchase</h2>
                    <Card className="purchase-card">
                        <Card.Header>
                            <Card.Title>Buy premium for a certain duration with your CoflCoins. The premium activate shortly after your purchase.</Card.Title>
                        </Card.Header>
                        <div style={{ padding: '15px' }}>
                            {!purchaseSuccessfulMonths ? (
                                <div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label className={styles.label}>Purchase Duration:</label>
                                        <NumberFormat
                                            onValueChange={onDurationChange}
                                            className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                                            isAllowed={value => {
                                                return (value.floatValue || 0) <= 12
                                            }}
                                            customInput={Form.Control}
                                            defaultValue={purchasePremiumDuration}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            allowNegative={false}
                                            decimalScale={0}
                                            step={1}
                                            style={{ width: '100px', display: 'inline' }}
                                        />
                                        <span style={{ marginLeft: '20px' }}>Month(s)</span>
                                        <div style={{ float: 'right' }}>
                                            <CoflCoinsDisplay />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={styles.label}>Price:</label>
                                        <span>{numberWithThousandsSeperators(purchasePremiumDuration * PREMIUM_PRICE_MONTH)} Coins</span>
                                    </div>
                                    <hr />
                                    <Button
                                        style={{ marginTop: '10px' }}
                                        variant="success"
                                        onClick={() => {
                                            onPremiumBuy('premium')
                                        }}
                                        disabled={purchasePremiumDuration * PREMIUM_PRICE_MONTH > coflCoins || isPurchasing}
                                    >
                                        Confirm purchase
                                    </Button>
                                </div>
                            ) : (
                                <p style={{ color: 'lime' }}>
                                    You successfully bought {purchaseSuccessfulMonths} {purchaseSuccessfulMonths === 1 ? 'Month' : 'Months'} of Premium for{' '}
                                    {numberWithThousandsSeperators(purchasePremiumDuration * PREMIUM_PRICE_MONTH)} CoflCoins!
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                ''
            )}
        </div>
    )
}

export default Premium
