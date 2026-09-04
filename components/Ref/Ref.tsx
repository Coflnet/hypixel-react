'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, Card } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import Navbar from '../../components/NavBar/NavBar'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getProperty } from '../../utils/PropertiesUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import styles from './Ref.module.css'
import Tooltip from '../Tooltip/Tooltip'
import ClaimAccountTutorial from '../ClaimAccount/ClaimAccountTutorial'
import { TEST_PREMIUM_DAYS } from '../../utils/PremiumTypeUtils'
import { useReferralRewardsEligibility } from '../../utils/Hooks'

function Ref() {
    let [refInfo, setRefInfo] = useState<RefInfo>()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let isEligible = useReferralRewardsEligibility()

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            api.getRefInfo().then(refInfo => {
                setRefInfo(refInfo)
            })
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
    }

    function getLink() {
        return getProperty('refLink') + '?refId=' + refInfo?.oldInfo.refId
    }

    if (isEligible !== true) {
        return (
            <div>
                <h2>
                    <Navbar />
                    Referral
                </h2>
                <hr />
                {isEligible === undefined ? (
                    getLoadingElement()
                ) : (
                    <Alert variant="info">SkyCofl referral rewards are currently available only to users in the United States.</Alert>
                )}
            </div>
        )
    }

    let claimAccountElement = (
        <Tooltip
            type="click"
            content={<Button>How do I verify my account?</Button>}
            tooltipContent={<ClaimAccountTutorial />}
            size="xl"
            tooltipTitle={<span>Claim Minecraft account</span>}
        />
    )

    return (
        <div>
            <h2>
                <Navbar />
                Referral
            </h2>
            <hr />
            <div>
                <Card style={{ marginBottom: '15px' }}>
                    <Card.Header>
                        <Card.Title>Referral System</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        {isLoggedIn && refInfo ? (
                            <div>
                                Your Ref-Link: <span style={{ fontStyle: 'italic', color: 'skyblue' }}>{getLink()}</span>
                                <span style={{ marginLeft: 15 }}>
                                    <CopyButton
                                        copyValue={getLink()}
                                        successMessage={
                                            <p>
                                                Copied ref link <br />
                                                <i>{getLink()}</i>
                                            </p>
                                        }
                                    />
                                </span>
                                <hr />
                            </div>
                        ) : null}
                        <p>Share your link with someone who might find SkyCofl useful.</p>
                        <p>What happens now:</p>
                        <ul>
                            <li>
                                The invited person gets <b>{TEST_PREMIUM_DAYS} days of Premium</b> after signing in and verifying a previously unlinked
                                Minecraft account.
                            </li>
                            <li>
                                You do not receive an automatic reward for sharing the link right now.
                            </li>
                        </ul>
                        <p>
                            If we enable a paid referral reward later, this page will show the exact offer before someone signs up. Only the invited person's
                            first eligible paid subscription could count. Expert Config purchases do not count, and a refunded or charged-back subscription
                            does not earn a reward.
                        </p>
                        {claimAccountElement}
                        {isLoggedIn && refInfo ? (
                            <div>
                                <hr />
                                <p>
                                    You can also share another SkyCofl page and keep the referral tracking. Add{' '}
                                    <b style={{ whiteSpace: 'nowrap' }}>?refId={refInfo?.oldInfo.refId}</b> to its link. For example:
                                </p>
                                <ul>
                                    {linkExample('https://sky.coflnet.com/item/JERRY_STAFF')}
                                    {linkExample('https://sky.coflnet.com/player/b876ec32e396476ba1158438d83c67d4')}
                                    {linkExample('https://sky.coflnet.com/flipper')}
                                    {linkExample('https://sky.coflnet.com/auction/6e4fbece3ece4dc4a4d2af46edbbb7db')}
                                </ul>
                            </div>
                        ) : null}
                        <div>
                            {!isLoggedIn ? (
                                <div>
                                    <hr />
                                    <p>To use the referral program, please login with Google</p>
                                </div>
                            ) : null}
                            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                            {!refInfo && isLoggedIn ? getLoadingElement() : ''}
                        </div>
                    </Card.Body>
                </Card>
                {isLoggedIn && refInfo ? (
                    <Card style={{ marginBottom: '15px' }}>
                        <Card.Header>Information</Card.Header>
                        <Card.Body>
                            <p>
                                <span className={styles.label}>Your Ref-Id:</span> <b>{refInfo?.oldInfo.refId}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Invited users who signed in:</span>
                                <b>{refInfo?.referedCount}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Invited users who verified Minecraft:</span> <b>{refInfo?.validatedMinecraft}</b>
                            </p>
                        </Card.Body>
                    </Card>
                ) : null}
                {refInfo?.oldInfo?.count !== undefined && refInfo?.oldInfo?.count > 0 ? (
                    <Card>
                        <Card.Header>
                            Information <span style={{ color: 'yellow' }}>(old Referral-System)</span>
                        </Card.Header>
                        <Card.Body>
                            <p>
                                <span className={styles.label}>Your Ref-Id:</span> <b>{refInfo?.oldInfo.refId}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Number of invited users (only after login):</span>
                                <b>{refInfo?.oldInfo.count}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Recieved Premium in hours:</span> <b>{refInfo?.oldInfo.receivedHours}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Referred Premium users:</span> <b>{refInfo?.oldInfo.bougthPremium}</b>
                            </p>
                        </Card.Body>
                    </Card>
                ) : null}
            </div>
        </div>
    )

    function linkExample(link: string) {
        let full = link + '?refId=' + refInfo?.oldInfo.refId
        return (
            <li>
                <Link href={full}>{full}</Link>
                <span style={{ marginLeft: 15 }}>
                    <CopyButton buttonWrapperClass="copy-button" copyValue={full} successMessage={<span>copied Link</span>} />
                </span>
            </li>
        )
    }
}
//
export default Ref
