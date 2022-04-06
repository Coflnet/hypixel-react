import React, { useEffect, useState } from 'react'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import Payment from '../Payment/Payment'
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

function Premium() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState<boolean>()
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [isLoading, setIsLoading] = useState(false)
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn();

    useEffect(() => {
        if (!wasAlreadyLoggedIn && !isLoggedIn) {
            setHasPremium(false)
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
            setIsLoggedIn(true)
            loadHasPremiumUntil()
        }
    }

    function onLoginFail() {
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

    return (
        <div className="premium">
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
            {!wasAlreadyLoggedIn && !isLoggedIn ? <p>To use premium please login with Google</p> : ''}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} rerenderFlip={rerenderGoogleSignIn} />
            {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            <hr />
            <Card className={styles.premiumCard}>
                <Card.Header>
                    <Card.Title>Features</Card.Title>
                    <Card.Subtitle>
                        {hasPremium ? (
                            <p>
                                Thank you for your support. You have a Premium account. By buying another Premium-Plan you can extend your premium-time. You can
                                use the following premium-features:
                            </p>
                        ) : (
                            <p>Log in and buy Premium to support us and get access to these features</p>
                        )}
                    </Card.Subtitle>
                </Card.Header>
                <div style={{ padding: '15px' }}>
                    <PremiumFeatures />
                </div>
            </Card>
            <hr />
            <div id="buyPremium">{isLoggedIn ? <Payment hasPremium={hasPremium || false} /> : ''}</div>
        </div>
    )
}

export default Premium
