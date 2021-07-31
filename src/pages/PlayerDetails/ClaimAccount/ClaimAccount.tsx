import React, { useState } from 'react';
import api from '../../../api/ApiHelper';
import GoogleSignIn from '../../../components/GoogleSignIn/GoogleSignIn';
import { getLoadingElement } from '../../../utils/LoadingUtils';

interface Props {
    playerUUID: string
}

function ClaimAccount(props: Props) {

    let [verificationNumber, setVerificationNumber] = useState(0);
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [isLoading, setIsLoading] = useState(false);

    function onAfterLogin() {
        setIsLoading(true);
        api.connectMinecraftAccount(props.playerUUID).then((verifyNumber) => {
            setVerificationNumber(verifyNumber);
            setIsLoggedIn(true);
            setIsLoading(false);
        });
    }

    return (
        <div className="claim-account">
            {isLoggedIn ?
                <div>
                    <h2>How do I claim my Minecraft Account?</h2>
                    <p>Put a bid or an auction ending with the number shown below in the auction house <b>within 10 minutes</b>. After a short period we will be able to verify that this account belongs to you.</p>
                    <h4>Your number: <b style={{ color: "lime" }}>{verificationNumber}</b></h4>
                    <hr />
                    <h2>Example</h2>
                    <p>You can verify your account by these actions (examples):</p>
                    <ul>
                        <li>Bid <b>{verificationNumber}</b> coins on an auction</li>
                        <li>Bid 8.439.<b>{verificationNumber}</b> coins on an auction.</li>
                        <li>Create an auction for <b>{verificationNumber}</b> coins</li>
                        <li>Create an auction for 53.<b>{verificationNumber}</b> coins</li>
                        <li>. . .</li>
                    </ul>
                </div> :
                <div>
                    <p>To claim your Minecraft Account please log in with google:</p>
                </div>
            }
            {
                isLoading ? getLoadingElement() : ""
            }
            <GoogleSignIn onAfterLogin={onAfterLogin} />
        </div >
    );
}

export default ClaimAccount;
