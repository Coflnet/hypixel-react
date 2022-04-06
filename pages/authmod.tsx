import Link from 'next/link'
import React, { useState } from 'react'
import { Button, Container } from 'react-bootstrap'
import api from '../api/ApiHelper'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import NavBar from '../components/NavBar/NavBar'
import { wasAlreadyLoggedIn } from '../utils/GoogleUtils'
import { getLoadingElement } from '../utils/LoadingUtils'
import { getURLSearchParam } from '../utils/Parser/URLParser'
import { getHeadElement } from '../utils/SSRUtils'

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn()

function AuthMod() {
    let [conId] = useState(getURLSearchParam('conId'))
    let [isAuthenticated, setIsAuthenticated] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(wasAlreadyLoggedInGoogle)

    function onLogin() {
        setIsLoggedIn(true)

        if (conId) {
            api.authenticateModConnection(conId).then(() => {
                setIsAuthenticated(true)
            })
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        wasAlreadyLoggedInGoogle = false
    }

    return (
        <div className="page">
            {getHeadElement('Authenticate Mod')}
            <Container>
                <h2>
                    <NavBar />
                    Authorize Mod
                </h2>
                <hr />
                <div>
                    {!isLoggedIn ? (
                        ''
                    ) : isAuthenticated ? (
                        <div>
                            <p style={{ color: '#40ff00' }}>Your Connection is now authorized</p>
                            <hr />
                            <p>Now that the mod is connected with the website you can change the filters/settings here:</p>
                            <Link href="/flipper">
                                <a className="disableLinkStyle">
                                    <Button>To the Flipper</Button>
                                </a>
                            </Link>
                        </div>
                    ) : (
                        getLoadingElement(<p>Authorizing connection...</p>)
                    )}
                    {!isLoggedIn ? <p>Please log in to authenticate for the mod usage</p>: ''}
                </div>
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            </Container>
        </div>
    )
}

export default AuthMod
