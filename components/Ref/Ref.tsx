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
        return getProperty('refLink') + '?refId=' + refInfo?.refId
    }

    return (
        <div>
            <h2>
                <Navbar />
                Referral
            </h2>
            <hr />
            {!isLoggedIn ? (
                <div></div>
            ) : (
                <div>
                    <Card style={{ marginBottom: '15px' }}>
                        <Card.Header>Referral-Link</Card.Header>
                        <Card.Body>
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
                            </div>
                            <hr />
                            <p>Share your Ref-Link with people which might find Cofnet useful.</p>
                            <p>Rewards per invited person:</p>
                            <ul>
                                <li>
                                    You receive <b>100 CoflCoins</b>
                                </li>
                                <li>
                                    The invited person on gets <b>1 day of premium</b> to test our services
                                </li>
                                <li>
                                    The first time a invited person buys CofCoins, you get <b>25%</b> of the purchased amount
                                </li>
                            </ul>
                            <p>
                                <span style={{ color: 'yellow' }}>
                                    The rewards are only given out after the invited person logged in with their Google account and verified their
                                    Minecraft account.
                                </span>
                            </p>
                            <hr />
                            <p>
                                The default referral page contains some facts about this site. You are also able to share another page and still get the
                                Referral-Bonus. All you have to do is adding <b style={{ whiteSpace: 'nowrap' }}>?refId={refInfo?.refId}</b> to any link. For
                                example
                            </p>
                            <ul>
                                {linkExample('https://sky.coflnet.com/item/JERRY_STAFF')}
                                {linkExample('https://sky.coflnet.com/player/b876ec32e396476ba1158438d83c67d4')}
                                {linkExample('https://sky.coflnet.com/flipper')}
                                {linkExample('https://sky.coflnet.com/auction/6e4fbece3ece4dc4a4d2af46edbbb7db')}
                            </ul>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Header>Information</Card.Header>
                        <Card.Body>
                            <p>
                                <span className={styles.label}>Your Ref-Id:</span> <b>{refInfo?.refId}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Number of invited users (only after login):</span>
                                <b>{refInfo?.count}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Recieved Premium in hours:</span> <b>{refInfo?.receivedHours}</b>
                            </p>
                            <p>
                                <span className={styles.label}>Referred premium users:</span> <b>{refInfo?.bougthPremium}</b>
                            </p>
                        </Card.Body>
                    </Card>
                </div>
            )}
            <div>
                {!isLoggedIn ? <p>To use the referral program please login with Google</p> : ''}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            </div>
        </div>
    )

    function linkExample(link: string) {
        let full = link + '?refId=' + refInfo?.refId
        return (
            <li>
                <Link href={full}>{full}</Link>
                <CopyButton buttonWrapperClass="copy-button" copyValue={full} successMessage={<span>copied Link</span>} />
            </li>
        )
    }
}
//
export default Ref
