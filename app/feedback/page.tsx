import React from 'react'
import { getHeadMetadata } from '../../utils/SSRUtils'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import NavBar from '../../components/NavBar/NavBar'
import RBButton from '../../components/ReactBootstrapWrapper/Button'

export default function Page() {
    return (
        <>
            <RBContainer>
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
                        <RBButton>Send feedback</RBButton>
                    </a>
                    <hr />
                    <h4>Contact: </h4>
                    <p>
                        <a href="mailto:support@coflnet.com">
                            <RBButton>support@coflnet.com</RBButton>
                        </a>
                    </p>
                    <p>
                        <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                            <RBButton>Discord</RBButton>
                        </a>
                    </p>
                </div>
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Feedback')
