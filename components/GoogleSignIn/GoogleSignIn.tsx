import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { refreshTokenSetup } from '../../utils/GoogleUtils'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { useForceUpdate, useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { GoogleLogin } from '@react-oauth/google'

interface Props {
    onAfterLogin(): void
    onLoginFail?(): void
    rerenderFlip?: boolean
}

let gotResponse = false

function GoogleSignIn(props: Props) {
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
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

    const onLoginFail = () => {
        toast.error('Something went wrong, please try again.', { autoClose: 20000 })
    }

    const onLoginClick = () => {
        trackEvent({
            category: 'login',
            action: 'click'
        })
    }

    return (
        <div onClickCapture={onLoginClick}>
            <div style={{ width: '250px' }}>
                <GoogleLogin onSuccess={onLoginSucces} onError={onLoginFail} theme={'filled_blue'} size={'large'} auto_select />
            </div>
            <p>
                I have read and agree to the <a href="https://coflnet.com/privacy">Privacy Policy</a>
            </p>
        </div>
    )
}

export default GoogleSignIn
