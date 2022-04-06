import React, { useEffect, useState } from 'react'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Button, Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
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
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn()

function Premium() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState<boolean>()
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [isLoading, setIsLoading] = useState(false)
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false)
    let [coflCoins] = useCoflCoins()

    useEffect(() => {
        if (!wasAlreadyLoggedInGoogle && !isLoggedIn) {
            setHasPremium(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getPremiumElement(label: string, price: number, productId: string) {
        let formattedPrice = numberWithThousandsSeperators(Math.round(price))

        return (
            <Card className={styles.premiumProduct}>
                <Card.Header>
                    <h3 className={styles.premiumProductLabel}>{label}</h3>
                </Card.Header>
                <Card.Body>
                    <p className={styles.premiumPrice}>{formattedPrice} CoflCoins</p>
                    <hr />
                    <Button
                        variant="success"
                        disabled={price > coflCoins}
                        onClick={() => {
                            onPremiumBuy(productId)
                        }}
                        style={{ width: '100%' }}
                    >
                        Buy Premium for <p style={{ margin: '0' }}>{formattedPrice} Coflcoins</p>
                    </Button>
                </Card.Body>
            </Card>
        )
    }

    function onPremiumBuy(productId) {
        api.purchaseWithCoflcoins(productId).then(() => {
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
            setIsLoggedIn(true)
            loadHasPremiumUntil()
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        setHasPremium(false)
        wasAlreadyLoggedInGoogle = false
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
        wasAlreadyLoggedInGoogle = false
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
        toast.warn('Successfully logged out')
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
            {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>To use premium please login with Google</p> : ''}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} rerenderFlip={rerenderGoogleSignIn} />
            {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ''}
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
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ float: 'left', marginRight: '50px' }}>Purchase Premium </h2>
                        <CoflCoinsDisplay />
                    </div>
                    <div className={styles.premiumProducts}>
                        {getPremiumElement('1 Month', 1800, 'premium')}
                        {getPremiumElement('3 Month', 5400, 'premium_quarter_year')}
                        {getPremiumElement('6 Month', 10800, 'premium_half_year')}
                        {getPremiumElement('1 Year', 21600, 'premium_year')}
                    </div>
                </div>
            ) : (
                ''
            )}
        </div>
    )
}

export default Premium
