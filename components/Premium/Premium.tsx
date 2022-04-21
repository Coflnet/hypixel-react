import React, { useEffect, useState } from 'react'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import NavBar from '../NavBar/NavBar'
import PremiumFeatures from './PremiumFeatures/PremiumFeatures'
import api from '../../api/ApiHelper'
import moment from 'moment'
import { Base64 } from 'js-base64'
import { v4 as generateUUID } from 'uuid'
import { GoogleLogout } from 'react-google-login'
import { toast } from 'react-toastify'
import styles from './Premium.module.css'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import CoflCoinsPurchase from '../CoflCoins/CoflCoinsPurchase'
import BuyPremium from './BuyPremium/BuyPremium'
import { CopyButton } from '../CopyButton/CopyButton'

function Premium() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState<boolean>()
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [isLoading, setIsLoading] = useState(false)
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false)
    let [isLoggingIn, setIsLoggingIn] = useState(false)
    let [hasWrongFormattedGoogleToken, setHasWrongFormattedGoogleToken] = useState(false)
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
            try {
                let parts = googleId.split('.')
                let obj = JSON.parse(Base64.atob(parts[1]))
                let imageElement = obj.picture ? <img src={obj.picture} height={24} width={24} alt="" /> : <span />
                return <span style={{ marginLeft: "10px" }}>{imageElement} {`${obj.name} (${obj.email})`}</span>;
            } catch {
                setHasWrongFormattedGoogleToken(true)
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
                {isLoggedIn && !hasWrongFormattedGoogleToken ? <p>Account: {getAccountString()}</p> : ''}
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
                {isLoggedIn && hasWrongFormattedGoogleToken ? (
                    <div>
                        <hr />
                        <p>
                            Some problem occured while processing your Google login. Everything should still work as expected, but we cant display certain
                            information like your username or profile picture.
                        </p>
                        <p style={{ color: 'red', fontWeight: 'bold' }}>
                            IMPORTANT: Do not give out the following information to a untrusted third party. This token could be used to access your google
                            account!
                        </p>
                        <p>
                            Your Goolge token:{' '}
                            <CopyButton
                                copyValue={localStorage.getItem('googleId')}
                                successMessage={
                                    <div>
                                        Copied your Google token.
                                        <br />
                                        <b>Be careful who you trust with this!</b>
                                    </div>
                                }
                            />
                        </p>
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
                    <h2>CoflCoins</h2>
                    <p>By buying one of the following products, you confirm the immediate execution of the contract, hereby losing your cancellation right.</p>
                    <CoflCoinsPurchase />
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
