'use client'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { useForceUpdate } from '../../utils/Hooks'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { GoogleLogin } from '@react-oauth/google'
import styles from './GoogleSignIn.module.css'
import { GOOGLE_EMAIL, GOOGLE_NAME, GOOGLE_PROFILE_PICTURE_URL, setSetting } from '../../utils/SettingsUtils'
import { atobUnicode } from '../../utils/Base64Utils'
import { Modal } from 'react-bootstrap'

interface Props {
    onAfterLogin?(): void
    onLoginFail?(): void
    onManualLoginClick?(): void
    rerenderFlip?: number
}

function GoogleSignIn(props: Props) {
    let [wasAlreadyLoggedInThisSession, setWasAlreadyLoggedInThisSession] = useState(
        isClientSideRendering() ? isValidTokenAvailable(localStorage.getItem('googleId')) : false
    )

    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let [isLoginNotShowing, setIsLoginNotShowing] = useState(false)
    let [showButtonNotRenderingModal, setShowButtonNotRenderingModal] = useState(false)
    let { trackEvent } = useMatomo()
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        setIsSSR(false)
        if (wasAlreadyLoggedInThisSession) {
            let token = localStorage.getItem('googleId')!
            let userObject = JSON.parse(atobUnicode(token.split('.')[1]))
            setSetting(GOOGLE_EMAIL, userObject.email)
            onLoginSucces(token)
        } else {
            setTimeout(() => {
                let isShown = false
                document.querySelectorAll('iframe').forEach(e => {
                    if (e.src && e.src.includes('accounts.google.com')) {
                        isShown = true
                    }
                })
                if (!isShown) {
                    setIsLoggedIn(false)
                    setIsLoginNotShowing(true)
                    sessionStorage.removeItem('googleId')
                    localStorage.removeItem('googleId')
                }
            }, 5000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (wasAlreadyLoggedInThisSession) {
            setIsLoggedIn(true)
        }
    }, [wasAlreadyLoggedInThisSession])

    useEffect(() => {
        forceUpdate()
        setIsLoggedIn(sessionStorage.getItem('googleId') !== null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.rerenderFlip])

    function onLoginSucces(token: string) {
        setIsLoggedIn(true)
        api.loginWithToken(token)
            .then(token => {
                localStorage.setItem('googleId', token)
                sessionStorage.setItem('googleId', token)
                let refId = (window as any).refId
                if (refId) {
                    api.setRef(refId)
                }
                document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.GOOGLE_LOGIN))
                if (props.onAfterLogin) {
                    props.onAfterLogin()
                }
            })
            .catch(error => {
                // dont show the error message for the invalid token error
                // the google sign component sometimes sends an outdated token, causing this error
                if (error.slug !== 'invalid_token') {
                    toast.error(`An error occoured while trying to sign in with Google. ${error ? error.slug || JSON.stringify(error) : null}`)
                } else {
                    console.warn('setGoogle: Invalid token error', error)
                    sessionStorage.removeItem('googleId')
                    localStorage.removeItem('googleId')
                }
                setIsLoggedIn(false)
                setWasAlreadyLoggedInThisSession(false)
                sessionStorage.removeItem('googleId')
                localStorage.removeItem('googleId')
            })
    }

    function onLoginFail() {
        toast.error('Something went wrong, please try again.', { autoClose: 20000 })
    }

    function onLoginClick() {
        if (props.onManualLoginClick) {
            props.onManualLoginClick()
        }
        trackEvent({
            category: 'login',
            action: 'click'
        })
    }

    let style: React.CSSProperties = isLoggedIn
        ? {
              visibility: 'collapse',
              height: 0
          }
        : {}

    if (isSSR) {
        return null
    }

    let buttonNotRenderingModal = (
        <Modal
            show={showButtonNotRenderingModal}
            onHide={() => {
                setShowButtonNotRenderingModal(false)
            }}
        >
            <Modal.Header>
                <Modal.Title>Google Login button not showing up?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>This is most likely caused by either an external software like an anti virus or your browser/extension blocking it.</p>
                <hr />
                <p>Known issues:</p>
                <ul>
                    <li>Kaspersky's "Secure Browse" feature seems to block the Google login.</li>
                    <li>Opera GX seems to sometimes blocks the login button. The specific setting or reason on when it blocks it is unknown.</li>
                </ul>
            </Modal.Body>
        </Modal>
    )

    return (
        <div style={style} onClickCapture={onLoginClick}>
            {!wasAlreadyLoggedInThisSession ? (
                <>
                    <div className={styles.googleButton}>
                        {!isSSR ? (
                            <GoogleLogin
                                onSuccess={response => {
                                    try {
                                        let userObject = JSON.parse(atobUnicode(response.credential!.split('.')[1]))
                                        setSetting(GOOGLE_PROFILE_PICTURE_URL, userObject.picture)
                                        setSetting(GOOGLE_EMAIL, userObject.email)
                                        setSetting(GOOGLE_NAME, userObject.name)
                                    } catch {
                                        toast.warn('Parsing issue with the google token. There might be issues when displaying details on the account page!')
                                    }
                                    onLoginSucces(response.credential!)
                                }}
                                onError={onLoginFail}
                                theme={'filled_blue'}
                                size={'large'}
                                useOneTap
                                auto_select
                            />
                        ) : null}
                    </div>
                    <p>
                        I have read and agree to the <a href="https://coflnet.com/privacy">Privacy Policy</a>
                    </p>
                    {isLoginNotShowing ? (
                        <p>
                            Login button not showing? Click{' '}
                            <span
                                style={{ color: '#007bff', cursor: 'pointer' }}
                                onClick={() => {
                                    setShowButtonNotRenderingModal(true)
                                }}
                            >
                                here
                            </span>
                            .
                        </p>
                    ) : null}
                </>
            ) : null}
            {buttonNotRenderingModal}
        </div>
    )
}

export default GoogleSignIn

export function isValidTokenAvailable(token?: string | null) {
    if (!token || token === 'null') {
        return
    }
    try {
        let details = JSON.parse(atobUnicode(token.split('.')[1]))
        let expirationDate = new Date(parseInt(details.exp) * 1000)
        return expirationDate.getTime() - 10000 > new Date().getTime()
    } catch (e) {
        toast.warn("Parsing issue with the google token. Can't automatically login!")
        return false
    }
}
