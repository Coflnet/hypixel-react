import React, { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import Navbar from '../../components/NavBar/NavBar';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import './Ref.css';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { Card } from 'react-bootstrap';
import CopySymbol from '../CopySymbol/CopySymbol';
import { getProperty } from '../../utils/PropertiesUtils';
import { toast } from 'react-toastify';

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

    function onCopy() {

        window.navigator.clipboard.writeText(getLink());
        toast.success(<p>Copied ref link <br /><i>{getLink()}</i></p>)
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
                    <Card>
                        <Card.Header>Referral-Link</Card.Header>
                        <Card.Body>
                            <p>Your Ref-Link: <span style={{fontStyle: "italic", color: "skyblue"}}>{getLink()}</span>
                                <span style={{marginLeft: 15}}>
                                    {
                                        window.navigator && refInfo ? <CopySymbol onCopyClick={onCopy} /> : ""
                                    }
                                </span>
                            </p>
                            <hr/>
                            <p>Share your Ref-Link with people which might find skyblock ah history useful. If the invited person logs in with google you and the invited person both get <b>1 free day of premium</b>.</p>
                            <p>The link above gets to a welcome page for invited users. If you want to share another page on our website and still profit from the Refferal-Program you can add <b style={{whiteSpace: "nowrap"}}>?refId={refInfo?.refId}</b> to the link</p>
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
