import Link from 'next/link'
import React from 'react'
import { Card, Container } from 'react-bootstrap'
import Search from '../components/Search/Search'
import { getHeadElement } from '../utils/SSRUtils'

function ApiInfo() {
    return (
        <div className="page">
            {getHeadElement('API')}
            <Container>
                <Search />
                <hr />
                <Card>
                    <Card.Header>
                        <Card.Title>An app you use gets the data from us</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p>
                            If you want to make another app yourself take a look at the API docs at{' '}
                            <a href="https://sky.coflnet.com/api" target="_blank">
                                https://sky.coflnet.com/api
                            </a>{' '}
                            (If you do please link this page as well).
                        </p>

                        <p>Besides providing the data for other projects we also have some useful features:</p>

                        <ul>
                            <li>
                                <Link href="/flipper">An AH flipper</Link>
                            </li>
                            <li>
                                <Link href="/">An AH Browser</Link>
                            </li>
                        </ul>

                        <p>These folks use our API:</p>
                        <ul>
                            <li>
                                <a
                                    href="https://discord.com/api/oauth2/authorize?client_id=854722092037701643&permissions=2147601408&scope=bot"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Hypixel Skyblock Community Discord
                                </a>
                            </li>
                            <li>
                                <a href="https://frogpixel.bubbleapps.io/version-test/" target="_blank" rel="noreferrer">
                                    Item Calculator by Froggily
                                </a>
                            </li>
                            <li>
                                <a href="https://skyhelper.altpapier.dev/" target="_blank" rel="noreferrer">
                                    SkyHelper Discord Bot
                                </a>
                            </li>
                            <li>
                                <a href="https://discord.gg/uK9csKB9qJ" target="_blank" rel="noreferrer">
                                    The Exotics Mod
                                </a>
                            </li>

                            <li>You use the API as well? Tell use and get listed here :)</li>
                        </ul>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default ApiInfo
