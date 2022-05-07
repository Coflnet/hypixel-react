import moment from 'moment'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import Cookies from 'js-cookie'
import { GoogleLogout } from 'react-google-login'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import cacheUtils from '../../utils/CacheUtils'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import NavBar from '../NavBar/NavBar'
import Tooltip from '../Tooltip/Tooltip'
import styles from './AccountDetails.module.css'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { useCoflCoins } from '../../utils/Hooks'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import TransferCoflCoins from '../TransferCoflCoins/TransferCoflCoins'

function AccountDetails() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasWrongFormattedGoogleToken, setHasWrongFormattedGoogleToken] = useState(false)
    let [isLoading, setIsLoading] = useState(true)
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [showSendcoflcoins, setShowSendCoflcoins] = useState(false)
    let coflCoins = useCoflCoins()
    let { pushInstruction } = useMatomo()

    useEffect(() => {
        if (localStorage.getItem('googleId') === null) {
            setIsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getAccountElement(): JSX.Element {
        let googleId = localStorage.getItem('googleId')
        if (googleId) {
            try {
                let parts = googleId.split('.')
                let obj = JSON.parse(atob(parts[1]))
                let imageElement = obj.picture ? <img src={obj.picture} height={24} width={24} alt="" /> : <span />
                return (
                    <span>
                        {imageElement} {`${obj.name} (${obj.email})`}
                    </span>
                )
            } catch {
                setHasWrongFormattedGoogleToken(true)
            }
        }
        return <span />
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

    function onLogout() {
        setIsLoggedIn(false)
        setIsLoading(false)
        localStorage.removeItem('googleId')
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
        toast.warn('Successfully logged out')
    }

    function onLogin() {
        let googleId = localStorage.getItem('googleId')
        setIsLoading(true)
        if (googleId) {
            loadHasPremiumUntil()
            setIsLoggedIn(true)
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
    }

    function deleteCaches() {
        cacheUtils.clearAll()
        document.cookie = ''
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
    }

    function setTrackingAllowed(event: ChangeEvent<HTMLInputElement>) {
        let val = event.target.checked
        if (val) {
            pushInstruction('rememberConsentGiven')
            Cookies.set('nonEssentialCookiesAllowed', 'true')
        } else {
            pushInstruction('forgetConsentGiven')
            Cookies.set('nonEssentialCookiesAllowed', false)
        }
    }

    function isTrackingAllowed() {
        let cookie = Cookies.get('nonEssentialCookiesAllowed')
        return cookie === 'true'
    }

    function deleteGoogleToken() {
        localStorage.removeItem('googleId')
        setIsLoggedIn(false)
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
    }

    return (
        <>
            <h2 style={{ marginBottom: '30px' }}>
                <NavBar />
                Account details
            </h2>
            {!isLoading && isLoggedIn ? (
                <div>
                    {!hasWrongFormattedGoogleToken ? (
                        <p>
                            <span className={styles.label}>Account:</span> {getAccountElement()}
                        </p>
                    ) : (
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
                    )}
                    <p>
                        <span className={styles.label}>Premium-Status:</span> {hasPremium ? 'Premium' : 'No Premium'}
                    </p>
                    {hasPremium ? (
                        <div>
                            <Tooltip
                                type="hover"
                                content={
                                    <p>
                                        <span className={styles.label}>Your premium ends:</span> {moment(hasPremiumUntil).fromNow()}
                                    </p>
                                }
                                tooltipContent={<span>{hasPremiumUntil?.toDateString()}</span>}
                            />
                        </div>
                    ) : null}
                    <p>
                        <span className={styles.label}>CoflCoins:</span> {numberWithThousandsSeperators(coflCoins)}
                        <Button
                            className={styles.sendCoflCoinsButton}
                            onClick={() => {
                                setShowSendCoflcoins(true)
                            }}
                        >
                            Send CoflCoins
                        </Button>
                        <Modal
                            size={'lg'}
                            show={showSendcoflcoins}
                            onHide={() => {
                                setShowSendCoflcoins(false)
                            }}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Send CoflCoins</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <TransferCoflCoins
                                    onFinish={() => {
                                        setShowSendCoflcoins(false)
                                    }}
                                />
                            </Modal.Body>
                        </Modal>
                    </p>
                </div>
            ) : null}
            {isLoading ? getLoadingElement() : null}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} rerenderFlip={rerenderGoogleSignIn} />
            {isLoggedIn ? (
                <div style={{ marginTop: '20px' }}>
                    <GoogleLogout
                        clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                        buttonText="Logout"
                        onLogoutSuccess={onLogout}
                    />
                </div>
            ) : null}
            <hr />
            <h2 style={{ marginBottom: '30px' }}>Settings</h2>
            <p>
                <div style={{ display: 'inline-block' }}>
                    <span className={styles.label}>Allow cookies for analytics: </span>
                    <Form.Check onChange={setTrackingAllowed} defaultChecked={isTrackingAllowed()} type="checkbox" />
                </div>
            </p>
            <p>
                <span className={styles.label}>Login problems?</span>
                <div>
                    <Tooltip
                        type="hover"
                        content={
                            <Button variant="danger" onClick={deleteGoogleToken}>
                                Reset Google login
                            </Button>
                        }
                        tooltipContent={<span>Make sure your browser doesn't block popups. Otherwise use this button to reset your Google login</span>}
                    />
                </div>
            </p>
            <p>
                <span className={styles.label}>Delete Caches/Cookies and hard refresh:</span>
                <Button variant="danger" onClick={deleteCaches}>
                    Warning: Deleting your Caches/Cookies will delete all your settings and log you out.
                </Button>
            </p>
        </>
    )
}

export default AccountDetails
