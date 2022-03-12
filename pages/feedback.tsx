import Head from 'next/head'
import React, { useEffect } from 'react'
import { Button, Container } from 'react-bootstrap'
import NavBar from '../components/NavBar/NavBar'
function Feedback() {
    return (
        <div className="page">
            <Head>
                <title>Feedback</title>
            </Head>
            <Container>
                <h2>
                    <NavBar />
                    Feedback
                </h2>
                <hr />
                <div>
                    <p>
                        Hey, we are only a small group of developers. We develop this app in our spare time and try to create a useful application for all the
                        Skyblock players.
                    </p>
                    <p>
                        Therefore, your feedback would be appreciated. If you find something that bothers you or if you have an idea for an improvement please
                        tell us.{' '}
                    </p>
                    <p>We will try to use your feedback to improve the experience for all the Skyblock players who use this application.</p>
                    <p>Thank you very much.</p>
                    <a href="mailto:support@coflnet.com">
                        <Button>Send feedback</Button>
                    </a>
                    <hr />
                    <h4>Contact: </h4>
                    <p>
                        <a href="mailto:support@coflnet.com">
                            <Button>support@coflnet.com</Button>
                        </a>
                    </p>
                    <p>
                        <a href="https://discord.gg/wvKXfTgCfb">
                            <Button>Discord</Button>
                        </a>
                    </p>
                </div>
            </Container>
        </div>
    )
}

export default Feedback
