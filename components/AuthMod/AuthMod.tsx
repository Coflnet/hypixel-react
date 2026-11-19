'use client'

import { useEffect, useState } from 'react'
import { getURLSearchParam } from '../../utils/Parser/URLParser'
import api from '../../api/ApiHelper'
import Link from 'next/link'
import { Button } from 'react-bootstrap'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { CredentialResponse, GoogleLogin } from '@react-oauth/google'

export default function AuthMod() {
    const [conId] = useState(getURLSearchParam('conId'))
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasAuthenticationFailed, setHasAuthenticationFailed] = useState(false)
    const [isSSR, setIsSSR] = useState(true)

    useEffect(() => {
        setIsSSR(false)
    }, [])

    function onLogin(response: CredentialResponse) {
        setIsLoggedIn(true)

        if (conId) {
            authenticateModConnection(response.credential!)
        }
    }

    function authenticateModConnection(googleToken: string) {
        setIsAuthenticated(false)
        setHasAuthenticationFailed(false)
        api.authenticateModConnection(conId!, googleToken)
            .then(() => {
                setIsAuthenticated(true)
            })
            .catch(() => {
                setHasAuthenticationFailed(true)
            })
    }

    function onLoginFail() {
        setIsLoggedIn(false)
    }
    return (
        <>
            {!isSSR ? (
                <div>
                    {isLoggedIn && isAuthenticated && conId !== null ? (
                        <div>
                            <p style={{ color: '#40ff00' }}>Your Connection is now authorized</p>
                            <hr />
                            <p>Now that the mod is connected with the website you can change the filters/settings here:</p>
                            <Link href="/flipper" className="disableLinkStyle">
                                <Button>To the Flipper</Button>
                            </Link>
                        </div>
                    ) : null}
                    {isLoggedIn && !isAuthenticated && !hasAuthenticationFailed && conId !== null ? getLoadingElement(<p>Authorizing connection...</p>) : null}
                    {hasAuthenticationFailed ? (
                        <p>
                            Authentication failed.{' '}
                            <Button
                                onClick={() => {
                                    setIsLoggedIn(false)
                                }}
                            >
                                Try again
                            </Button>
                        </p>
                    ) : null}
                    {conId === null ? <p>This is an invalid link. There is no connection id present.</p> : null}
                </div>
            ) : null}
            {!isLoggedIn ? (
                <>
                    <p>Please log in to authenticate for the mod usage:</p>
                    <div style={{ width: '250px', colorScheme: 'light', marginBottom: '15px' }}>
                        <GoogleLogin
                            onSuccess={onLogin}
                            onError={() => {
                                onLoginFail()
                            }}
                            theme={'filled_blue'}
                            size={'large'}
                        />
                    </div>
                </>
            ) : null}
        </>
    )
}
