'use client'
import { useState } from 'react'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { useRouter } from 'next/navigation'

export default function LowSupply() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let [isRedirecting, setIsRedirecting] = useState(false)
    let router = useRouter()

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            loadRedirectLink()
        }
    }

    function loadRedirectLink() {
        setIsRedirecting(true)
        api.getLinkvertiseLink()
            .then(link => {
                router.push(link)
            })
            .finally(() => {
                setIsRedirecting(false)
            })
    }

    function onLoginFail() {
        setIsLoggedIn(false)
    }

    return (
        <>
            {!isLoggedIn && !wasAlreadyLoggedIn && <p>To use Linkvertise, please login with Google: </p>}
            {isRedirecting && getLoadingElement(<span>Redirecting...</span>)}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
        </>
    )
}
