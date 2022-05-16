import React from 'react'
import { Button, Container, Card } from 'react-bootstrap'
import Link from 'next/link'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import Search from '../components/Search/Search'
import { Help as HelpIcon } from '@mui/icons-material'
import { getHeadElement } from '../utils/SSRUtils'
import Tooltip from '../components/Tooltip/Tooltip'

function Refed() {
    return (
        <div className="page">
            {getHeadElement()}
            <Container>
                <Search />
                <Card>
                    <Card.Header>
                        <Card.Title>Invitation</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p>You were invited to use this application because someone thought it would be interesting and helpful to you.</p>
                        <p>
                            After you are logged in with Google you can verify your Minecraft account{' '}
                            <Tooltip
                                content={
                                    <span>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={
                                    <p>
                                        To connect your Minecraft account, search and click yourself in the search bar. Afterwards click "Your? Claim account."
                                        to get a full explanation.{' '}
                                    </p>
                                }
                            />{' '}
                            to get 1 hour of <Link href="/premium">premium</Link> for free to test our service including our{' '}
                            <Link href="/flipper">auction flipper</Link>.
                        </p>
                        <p>
                            We also provide a mod to use the flipper ingame. You can download it in the <b>#mod-releases</b> channel on our{' '}
                            <a href="https://discord.gg/wvKXfTgCfb">
                                <span style={{ color: '#7289da' }}>Discord</span>
                            </a>
                            . For help check out the <b>#faq</b> channel or ask in <b>#support</b>.
                        </p>
                        <hr />
                        <p>Login with Google:</p>
                        <GoogleSignIn onAfterLogin={() => {}} />
                        <p>
                            We use Google accounts because they are more secure than requiring a separate login. We use your Google Id and email. (i.e. to know
                            what settings you made and contact you in case we need to)
                        </p>

                        <Link href="/">
                            <a className="disableLinkStyle">
                                <Button>Go to main page</Button>
                            </a>
                        </Link>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default Refed
