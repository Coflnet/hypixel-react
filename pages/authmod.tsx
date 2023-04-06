import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, Container } from 'react-bootstrap'
import api from '../api/ApiHelper'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import NavBar from '../components/NavBar/NavBar'
import { useWasAlreadyLoggedIn } from '../utils/Hooks'
import { getLoadingElement } from '../utils/LoadingUtils'
import { getURLSearchParam } from '../utils/Parser/URLParser'
import { getHeadElement } from '../utils/SSRUtils'

function AuthMod() {
    let [conId] = useState(getURLSearchParam('conId'))
    let [isAuthenticated, setIsAuthenticated] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasAuthenticationFailed, setHasAuthenticationFailed] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    useEffect(() => {
        setIsSSR(false)
    }, [])

    useEffect(() => {
        if (wasAlreadyLoggedIn && !isLoggedIn) {
            setIsLoggedIn(true)
        }
    }, [wasAlreadyLoggedIn])

    function onLogin() {
        setIsLoggedIn(true)

        if (conId) {
            authenticateModConnection()
        }
    }

    function authenticateModConnection() {
        setIsAuthenticated(false)
        setHasAuthenticationFailed(false)
        api.authenticateModConnection(conId)
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
        <div className="page">
            {getHeadElement('Authenticate Mod')}
            <Container>
                <h2>
                    <NavBar />
                    Authorize Mod
                </h2>
                <hr />
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
                        {isLoggedIn && !isAuthenticated && !hasAuthenticationFailed && conId !== null
                            ? getLoadingElement(<p>Authorizing connection...</p>)
                            : null}
                        {!isLoggedIn && !hasAuthenticationFailed && conId !== null ? <p>Please log in to authenticate for the mod usage</p> : null}
                        {hasAuthenticationFailed ? (
                            <p>
                                Authentication failed. <Button onClick={authenticateModConnection}>Try again</Button>
                            </p>
                        ) : null}
                        {conId === null ? <p>This is an invalid link. There is no connection id present.</p> : null}
                    </div>
                ) : null}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            </Container>
        </div>
    );
}

export default AuthMod
