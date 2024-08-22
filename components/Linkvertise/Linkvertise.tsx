'use client'
import { useState } from 'react'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { useRouter } from 'next/navigation'
import { AUTO_REDIRECT_FROM_LINKVERTISE_EXPLANATION, getSetting, setSetting } from '../../utils/SettingsUtils'
import { Container, Card, Form, Button } from 'react-bootstrap'

export default function LowSupply() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let [isRedirecting, setIsRedirecting] = useState(false)
    let [autoredirect, setAutoRedirect] = useState(!!getSetting(AUTO_REDIRECT_FROM_LINKVERTISE_EXPLANATION))
    let router = useRouter()

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)

            if (autoredirect) {
                loadRedirectLink()
            }
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
            <Container className="mt-4">
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>What is Linkvertise?</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            Linkvertise is a service we use to offer our users a way to access the Starter Premium plan for free by completing simple tasks
                            (mostly visiting websites of their partners). Instead of paying with money, you can unlock premium content by following a few steps
                            on the Linkvertise platform. This is a great way for you to enjoy additional features without any direct cost while supporting our
                            website.
                        </Card.Text>
                    </Card.Body>
                </Card>
                <Card className="mb-4">
                    <Card.Header>
                        <Card.Title>How Does It Work?</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            <ol>
                                <li>
                                    <strong>Click Button below to get redirected to Linkvertise</strong>
                                </li>
                                <li>
                                    <strong>Click on the orange "Get Website"</strong>
                                </li>
                                <li>
                                    <strong>Choose one of the presented tasks and complete it (by visiting that website)</strong>
                                </li>
                                <li>
                                    <strong>
                                        After you have completed the task, you get the option to be redirected back to our website and receive 1 hour of
                                        Starter Premium
                                    </strong>
                                </li>
                            </ol>
                        </Card.Text>
                    </Card.Body>
                </Card>
                <p>Thank you for your support and enjoy your premium experience!</p>
            </Container>
            <hr />
            {!isLoggedIn && !wasAlreadyLoggedIn && <p>To use Linkvertise, please login with Google: </p>}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            {isLoggedIn && (
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button onClick={loadRedirectLink}>Get redirected to Linkvertise</Button>
                    <Form.Group>
                        <Form.Label htmlFor="autoRedirect" style={{ marginRight: 5 }}>
                            Next time automatically redirect to Linkvertise
                        </Form.Label>
                        <Form.Check
                            id="autoRedirect"
                            inline
                            onChange={e => {
                                setSetting(AUTO_REDIRECT_FROM_LINKVERTISE_EXPLANATION, !autoredirect)
                                setAutoRedirect(!autoredirect)
                            }}
                            checked={autoredirect}
                            type="checkbox"
                        />
                    </Form.Group>
                </div>
            )}
            {isRedirecting && getLoadingElement(<span>Redirecting...</span>)}
        </>
    )
}
