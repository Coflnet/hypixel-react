'use client'

import { useState } from 'react'
import { Container } from 'react-bootstrap'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import LowballOfferList from '../LowballOfferList/LowballOfferList'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'

export default function LowballOverview() {
    const wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    if (wasAlreadyLoggedIn && !isLoggedIn) {
        return (
            <>
                {getLoadingElement(<p>Restoring your session...</p>)}
                <GoogleSignIn
                    key="googleLogin"
                    onAfterLogin={() => {
                        setIsLoggedIn(true)
                    }}
                />
            </>
        )
    }

    return (
        <Container>
            <p>Browse current lowball offers by item tag. Sign in if you want to manage your own offers.</p>
            {!isLoggedIn ? (
                <GoogleSignIn
                    key="googleLogin"
                    onAfterLogin={() => {
                        setIsLoggedIn(true)
                    }}
                />
            ) : null}
            <LowballOfferList canLoadOwnOffers={isLoggedIn} showOwnOffersByDefault={isLoggedIn} />
        </Container>
    )
}