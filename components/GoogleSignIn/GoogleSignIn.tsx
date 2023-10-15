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

interface Props {
    onAfterLogin?(): void
    onLoginFail?(): void
    onManualLoginClick?(): void
    rerenderFlip?: boolean
}

let gotResponse = false

function GoogleSignIn(props: Props) {
    let [wasAlreadyLoggedInThisSession, setWasAlreadyLoggedInThisSession] = useState(
        isClientSideRendering() ? isValidTokenAvailable(localStorage.getItem('googleId')) : false
    )

    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let { trackEvent } = useMatomo()
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        setIsSSR(false)
        if (wasAlreadyLoggedInThisSession) {
            onLoginSucces(localStorage.getItem('googleId')!)
            setTimeout(() => {
                if (!gotResponse) {
                    toast.error('We had problems authenticating your account with google. Please try to log in again.')
                    setIsLoggedIn(false)
                    if (props.onLoginFail) {
                        props.onLoginFail()
                    }
                    sessionStorage.removeItem('googleId')
                }
            }, 15000)
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
        gotResponse = true
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
                }
                setIsLoggedIn(false)
                setWasAlreadyLoggedInThisSession(false)
                sessionStorage.removeItem('googleId')
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

    return (
        <div style={style} onClickCapture={onLoginClick}>
            {!wasAlreadyLoggedInThisSession ? (
                <>
                    <div className={styles.googleButton}>
                        <GoogleLogin
                            onSuccess={response => {
                                let userObject = JSON.parse(atobUnicode(response.credential!.split('.')[1]))
                                setSetting(GOOGLE_PROFILE_PICTURE_URL, userObject.picture)
                                setSetting(GOOGLE_EMAIL, userObject.email)
                                setSetting(GOOGLE_NAME, userObject.name)
                                onLoginSucces(response.credential!)
                            }}
                            onError={onLoginFail}
                            theme={'filled_blue'}
                            size={'large'}
                            useOneTap
                            auto_select
                        />
                    </div>
                    <p>
                        I have read and agree to the <a href="https://coflnet.com/privacy">Privacy Policy</a>
                    </p>
                </>
            ) : null}
        </div>
    )
}

export default GoogleSignIn

export function isValidTokenAvailable(token?: string | null) {
    if (!token || token === 'null') {
        return
    }
    let details = JSON.parse(atob(token.split('.')[1]))
    let expirationDate = new Date(parseInt(details.exp) * 1000)
    let result = expirationDate.getTime() - 10000 > new Date().getTime()
    return result
}
