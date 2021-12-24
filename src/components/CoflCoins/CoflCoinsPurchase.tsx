import React, { useState } from 'react';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import Payment from '../Payment/Payment';

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

export default function CoflCoinsPurchase() {

    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [hasPremium, setHasPremium] = useState<boolean>();

    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setIsLoggedIn(true);
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false);
        setHasPremium(false);
        wasAlreadyLoggedInGoogle = false;
    }

    return (
        <div className="cofl-coins-purchase">
            {
                !wasAlreadyLoggedInGoogle && !isLoggedIn ?
                    <p>To buy and use CoflCoins you need to be logged in with Google</p> :
                    ""
            }
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            {isLoggedIn ? <Payment hasPremium={hasPremium || false} /> : ""}
        </div>
    )
}