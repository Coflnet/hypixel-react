import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/ApiHelper';
import GoogleSignIn from '../../../components/GoogleSignIn/GoogleSignIn';
import { wasAlreadyLoggedIn } from '../../../utils/GoogleUtils';
import { getLoadingElement } from '../../../utils/LoadingUtils';

interface Props {
    playerUUID: string
}

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function ClaimAccount(props: Props) {

    let [verificationNumber, setVerificationNumber] = useState(0);
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [isLoading, setIsLoading] = useState(wasAlreadyLoggedInGoogle);

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
                    <h3>How do I claim my Minecraft Account?</h3>
                    <p>Put a bid or an auction ending with the number shown below in the auction house <b>within 10 minutes</b>. After a short period we will be able to verify that this account belongs to you.</p>
                    <h4>Your number: <b style={{ color: "lime" }}>{verificationNumber}</b></h4>
                    <hr />
                    <h3>Example</h3>
                    <p>You can verify your account by these actions (examples):</p>
                    <ul>
                        <li>Bid <b>{verificationNumber}</b> coins on an auction</li>
                        <li>Bid 8.439.<b>{verificationNumber}</b> coins on an auction.</li>
                        <li>Create an auction for <b>{verificationNumber}</b> coins</li>
                        <li>Create an auction for 53.<b>{verificationNumber}</b> coins</li>
                        <li>. . .</li>
                    </ul>
                    <hr />
                    <h3>Why?</h3>
                    <p>Connecting your Minecraft account allows us to improve your experience.
                        There are a lot of features in development where we need to know what your Minecraft account is.
                        Currently connecting your account only adds your Minecraft name to the link preview when you share your <Link to="/ref">referral link</Link>.
                        We don't store your name and publicly displaying your email isn't a good choice either.</p>
                </div> : isLoading ? getLoadingElement() :
                    <div>
                        <p>To claim your Minecraft Account please log in with Google:</p>
                    </div>
            }
            <GoogleSignIn onAfterLogin={onAfterLogin} />
        </div >
    );
}

export default ClaimAccount;
