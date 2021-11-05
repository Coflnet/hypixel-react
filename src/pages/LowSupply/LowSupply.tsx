import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import './LowSupply.css'
import NavBar from '../../components/NavBar/NavBar';
import LowSupplyList from '../../components/LowSupplyList/LowSupplyList';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import GoogleSignIn from '../../components/GoogleSignIn/GoogleSignIn';
import { getLoadingElement } from '../../utils/LoadingUtils';
import api from '../../api/ApiHelper';

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();
function LowSupply() {

    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [hasPremium, setHasPremium] = useState(false);

    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setIsLoggedIn(true);
            loadHasPremium();
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false);
        wasAlreadyLoggedInGoogle = false;
    }


    let loadHasPremium = () => {
        let googleId = localStorage.getItem("googleId");
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil > new Date()) {
                setHasPremium(true);
            }
        });
    }

    return (
        <div className="low-supply-page">
            <Container>
                <h2>
                    <NavBar />
                    Low supply items
                </h2>
                <hr />
                {
                    isLoggedIn && hasPremium ?
                        <div>
                            <p>These are low supply items. Strong price fluctuation may occur.</p>
                            <LowSupplyList />
                        </div> : null
                }
                {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
                {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>You need to be logged in and have premium to see this page.</p> : ""}
                {isLoggedIn && !hasPremium ? <p>You need to have premium to see this page.</p> : ""}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            </Container>
        </div>
    );
}

export default LowSupply;