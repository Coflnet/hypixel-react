import React, { useEffect, useState } from 'react'
import { GoogleLogin } from 'react-google-login'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { refreshTokenSetup } from '../../utils/GoogleUtils'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { useForceUpdate, useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { Form } from 'react-bootstrap'

interface Props {
    onAfterLogin(): void
    onLoginFail?(): void
    rerenderFlip?: boolean
}

let gotResponse = false

function GoogleSignIn(props: Props) {
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false)
    let { trackEvent } = useMatomo()
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        if (wasAlreadyLoggedIn) {
            setTimeout(() => {
                if (!gotResponse) {
                    toast.error('We had problems authenticating your account with google. Please try to log in again.')
                    setIsLoggedIn(false)
                    if (props.onLoginFail) {
                        props.onLoginFail()
                    }
                    localStorage.removeItem('googleId')
                }
            }, 15000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (wasAlreadyLoggedIn) {
            setIsLoggedIn(true)
        }
    }, [wasAlreadyLoggedIn])

    useEffect(() => {
        forceUpdate()
        setIsLoggedIn(localStorage.getItem('googleId') !== null)
        setPrivacyPolicyAccepted(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.rerenderFlip])

    const onLoginSucces = (response: any) => {
        gotResponse = true
        localStorage.setItem('googleId', response.tokenId)
        setIsLoggedIn(true)
        api.setGoogle(response.tokenId)
            .then(() => {
                ;(window as any).googleAuthObj = response
                let refId = (window as any).refId
                if (refId) {
                    api.setRef(refId)
                }
                refreshTokenSetup(response)
                document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.GOOGLE_LOGIN))
                props.onAfterLogin()
            })
            .catch(() => {
                toast.error('An error occoured while trying to sign in with Google')
                setIsLoggedIn(false)
                localStorage.removeItem('googleId')
            })
    }

    const onLoginFail = (response: { error: string; details: string }) => {
        gotResponse = true
        switch (response.error) {
            case 'access_denied':
            case 'popup_closed_by_user':
                toast.warn('You canceled the login')
                break
            case 'idpiframe_initialization_failed':
                toast.error('Cookies for accounts.google.com have to be enabled to login', { autoClose: 20000 })
                toast.success('Common fix: if there is an eye icon with a line through in your url bar, click it', { delay: 1000, autoClose: 20000 })
                break
            default:
                toast.error('Something went wrong, please try again.', { autoClose: 20000 })
                break
        }
        trackEvent({
            category: 'login',
            action: 'error/' + response.error
        })
    }

    const onLoginClick = () => {
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

    return (
        <div style={style} onClickCapture={onLoginClick}>
            <GoogleLogin
                clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                buttonText="Login"
                disabled={!privacyPolicyAccepted}
                onSuccess={onLoginSucces}
                onFailure={onLoginFail}
                isSignedIn={isClientSideRendering() ? localStorage.getItem('googleId') !== null : false}
                theme="dark"
                cookiePolicy={'single_host_origin'}
            />
            <p>
                <Form.Check
                    style={{ position: 'relative !important' }}
                    onChange={e => {
                        setPrivacyPolicyAccepted(e.target.checked)
                    }}
                />
                <span>
                    I have read and agree to the <a href="https://coflnet.com/privacy">Privacy Policy</a>
                </span>
            </p>
        </div>
    )
}

export default GoogleSignIn
