import React, { useState } from 'react'
import api from '../../api/ApiHelper'
import Navbar from '../../components/NavBar/NavBar'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Card } from 'react-bootstrap'
import { getProperty } from '../../utils/PropertiesUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import Link from 'next/link'
import styles from './Ref.module.css'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { numberWithThousandsSeperators } from '../../utils/Formatter'

interface Props {}

function Ref(props: Props) {
    let [refInfo, setRefInfo] = useState<RefInfo>()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    function onLogin() {
        let googleId = localStorage.getItem('googleId')
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

    return (
        <div>
            <h2>
                <Navbar />
                Referral
            </h2>
            <hr />
            <div>
                <Card style={{ marginBottom: '15px' }}>
                    <Card.Header>Referral system</Card.Header>
                    <Card.Body>
                        {isLoggedIn ? (
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
                        <p>Share your Ref-Link with people which might find Cofnet useful.</p>
                        <p>Rewards per invited person:</p>
                        <ul>
                            <li>
                                You receive <b>100 CoflCoins</b>
                            </li>
                            <li>
                                The invited person gets <b>1 day of premium</b> to test our services
                            </li>
                            <li>
                                The first time a invited person buys CoflCoins, you get <b>25%</b> of the purchased amount
                            </li>
                        </ul>
                        <p>
                            <span style={{ color: 'yellow' }}>
                                The rewards are only given out after the invited person logged in with their Google account and verified their Minecraft
                                account.
                            </span>
                        </p>
                        {isLoggedIn ? (
                            <div>
                                <hr />
                                <p>
                                    The default referral page contains some facts about this site. You are also able to share another page and still get the
                                    Referral-Bonus. All you have to do is adding <b style={{ whiteSpace: 'nowrap' }}>?refId={refInfo?.oldInfo.refId}</b> to any
                                    link. For example
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
                                    <p>To use the referral program please login with Google</p>
                                </div>
                            ) : null}
                            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                            {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
                        </div>
                    </Card.Body>
                </Card>
                {isLoggedIn ? (
                    <Card style={{ marginBottom: '15px' }}>
                        <Card.Header>Information</Card.Header>
                        <Card.Body>
                            <p>
                                <span className={styles.label}>Your Ref-Id:</span> <b>{refInfo?.oldInfo.refId}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Number of invited users (only after login):</span>
                                <b>{refInfo?.referedCount}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Referred user coins purchases:</span>{' '}
                                <b>{numberWithThousandsSeperators(refInfo?.purchasedCoins)}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Number of validated MC-Accounts:</span> <b>{refInfo?.validatedMinecraft}</b>
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
