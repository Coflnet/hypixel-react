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
        return getProperty("refLink") + "?" + refInfo?.refId;
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
                        </Card.Body>
                    </Card>
                </div>}
            <div>
                <GoogleSignIn onAfterLogin={onLogin} />
                {!isLoggedIn ? <p>To use the referral program please login with Google</p> : ""}
                {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
            </div>

        </div>
    )
}

export default Ref;