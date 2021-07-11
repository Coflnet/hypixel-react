import React, { useState } from 'react';
import api from '../../api/ApiHelper';
import Navbar from '../../components/NavBar/NavBar';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { Card } from 'react-bootstrap';
import { getProperty } from '../../utils/PropertiesUtils';
import { CopyButton } from '../CopyButton/CopyButton';
import './Ref.css';

interface Props {
}

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function Ref(props: Props) {

    let [refInfo, setRefInfo] = useState<RefInfo>();
    let [isLoggedIn, setIsLoggedIn] = useState(false);

    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setIsLoggedIn(true);
            api.getRefInfo().then(refInfo => {
                setRefInfo(refInfo);
            })
        }
    }

    function getLink() {
        return getProperty("refLink") + "?refId=" + refInfo?.refId;
    }

    return (
        <div className="ref">
            <h2>
                <Navbar />
                Referral
            </h2>
            <hr />
            {!isLoggedIn ?
                <div></div> :
                <div>
                    <Card style={{ marginBottom: "15px" }}>
                        <Card.Header>Referral-Link</Card.Header>
                        <Card.Body>
                            <div>Your Ref-Link: <span style={{ fontStyle: "italic", color: "skyblue" }}>{getLink()}</span>
                                <span style={{ marginLeft: 15 }}>
                                    <CopyButton copyValue={getLink()} successMessage={<p>Copied ref link <br /><i>{getLink()}</i></p>} />
                                </span>
                            </div>
                            <hr/>
                            <p>Share your Ref-Link with people which might find skyblock ah history useful. If the invited person logs in with google you and the invited person both get <b>1 free day of premium</b>.</p>
                            <p>The default referral page contains some facts about this site. You are also able to share another page and still get the Referral-Bonus. All you have to do is adding <b style={{whiteSpace: "nowrap"}}>?refId={refInfo?.refId}</b> to any link</p>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Header>Information</Card.Header>
                        <Card.Body>
                            <p><span className="label">Your Ref-Id:</span> <b>{refInfo?.refId}</b></p>
                            <p><span className="label">Number of invited users (only after login):</span><b>{refInfo?.count}</b></p>
                            <p><span className="label">Recieved Premium in hours:</span> <b>{refInfo?.receivedHours}</b></p>
                            <p><span className="label">Referred premium users:</span> <b>{refInfo?.bougthPremium}</b></p>
                        </Card.Body>
                    </Card>
                </div>}
            <div>
                {!isLoggedIn ? <p>To use the referral program please login with Google</p> : ""}
                <GoogleSignIn onAfterLogin={onLogin} />
                {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
            </div>

        </div>
    )
}

export default Ref;
