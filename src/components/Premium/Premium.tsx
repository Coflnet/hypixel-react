import React, { useState } from "react";
import GoogleSignIn from "../GoogleSignIn/GoogleSignIn";
import Payment from "../Payment/Payment";
import './Premium.css';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from "../../utils/LoadingUtils";
import { Card } from "react-bootstrap";
import NavBar from "../NavBar/NavBar";

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function Premium() {

    let [googleId, setGoogleId] = useState("");
    let [isLoggedIn, setIsLoggedIn] = useState(false);

    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setGoogleId(googleId);
            setIsLoggedIn(true);
        }
    }

    return (
        <div className="premium">
            <h4>
                <NavBar />
                Premium
            </h4>
            <Card className="premium-card">
                <p>Premium users get access to the following features:</p>
                <ul>
                    <li>more than 3 subscriptions</li>
                </ul>
            </Card>
            <div>
                <GoogleSignIn onAfterLogin={onLogin} />
                {isLoggedIn ? <Payment /> : ""}
                {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
                {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>To use subscriptions please login with Google:</p> : ""}
            </div>
        </div>
    )
}

export default Premium;