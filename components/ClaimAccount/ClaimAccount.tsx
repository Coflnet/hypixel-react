'use client'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Card } from 'react-bootstrap'

function ClaimAccount() {
    const whyText = (
        <div>
            <Card style={{ marginBottom: '10px' }}>
                <Card.Header>Referrals</Card.Header>
                <Card.Body>
                    The referral bonus for inviting someone is only awarded after verifying with a minecraft account. You receive free test premium after you
                    verified your account. This is to prevent people from abusing the ref system by creating new emails.
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Flipping</Card.Header>
                <Card.Body>
                    As part of our fairness system unverified accounts receive flips delayed. Some parts (like the in game `/cofl profit`) use the list of
                    verified accounts to compute summaries over all your minecraft accounts.
                </Card.Body>
            </Card>
        </div>
    )

    return (
        <div className="claim-account">
            <div>
                <h3>How do I claim my Minecraft Account?</h3>
                <p>
                    <p>
                        To verify that this account is yours, please use your mod. The mod will give you a 3 digit number. Create or bid on an auction. After at
                        most 3 minutes your account will automatically be verified by our server. If your account hasn't been verified within 5 minutes please
                        try again.
                    </p>
                </p>
                <hr />
                <h3>Example</h3>
                <p>
                    In this example your number is <b>123</b>. You could verify your account by one of these actions:
                </p>
                <ul>
                    <li>
                        Bid <b>123</b> coins on an auction
                    </li>
                    <li>
                        Bid 8.439.<b>123</b> coins on an auction.
                    </li>
                    <li>
                        Create an auction for <b>123</b> coins
                    </li>
                    <li>
                        Create an auction for 53.<b>123</b> coins
                    </li>
                    <li>. . .</li>
                </ul>
                <hr />
                <h3>Why?</h3>
                {whyText}
            </div>
        </div>
    )
}

export default ClaimAccount
