import React, { useState } from "react";
import GoogleSignIn from "../GoogleSignIn/GoogleSignIn";
import Payment from "../Payment/Payment";
import './Premium.css';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from "../../utils/LoadingUtils";
import { Card, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import NavBar from "../NavBar/NavBar";
import PremiumFeatures from "./PremiumFeatures/PremiumFeatures";
import { Link as LinkIcon } from '@material-ui/icons';
import api from "../../api/ApiHelper";
import moment from 'moment';
import { Base64 } from "js-base64";
import { v4 as generateUUID } from 'uuid';

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function Premium() {

    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [showFeatureDialog, setShowFeatureDialog] = useState(false);
    let [hasPremium, setHasPremium] = useState(false);
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>();

    function loadHasPremiumUntil(): Promise<void> {
        let googleId = localStorage.getItem('googleId');
        return api.hasPremium(googleId!).then((hasPremiumUntil) => {
            if (hasPremiumUntil) {
                setHasPremium(true);
            }
            setHasPremiumUntil(hasPremiumUntil)
        });
    }


    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setIsLoggedIn(true);
            loadHasPremiumUntil();
        }
    }

    function getAccountString() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            let parts = googleId.split('.');
            if (parts.length > 2) {
                let obj = JSON.parse(Base64.atob(parts[1]));
                return `${obj.name} (${obj.email})`
            }
        }
        return "";
    }

    function closeFeatureDialog() {
        setShowFeatureDialog(false);
    }

    let featureDialog = (
        <Modal show={showFeatureDialog} onHide={closeFeatureDialog}>
            <Modal.Header closeButton>
                <Modal.Title>Features</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <PremiumFeatures />
            </Modal.Body>
        </Modal>
    );

    return (
        <div className="premium">
            <h2>
                <NavBar />
                Premium
            </h2>
            <hr />
            {hasPremium ? <p style={{ color: "#00bc8c" }}>You have a premium account. Thank you for your support.</p> : <p style={{ color: "red" }}>You do no have a premium account</p>}
            {
                hasPremium ?
                    <div>
                        <p>Account: {getAccountString()}</p>
                        <OverlayTrigger
                            overlay={<Tooltip id={generateUUID()}>
                                <span>{hasPremiumUntil?.toDateString()}</span>
                            </Tooltip>}>
                            <span>Your premium ends: {moment(hasPremiumUntil).fromNow()}</span>
                        </OverlayTrigger>
                    </div> : ""
            }
            <hr />
            <Card className="premium-card">
                {hasPremium
                    ? <p>Thank you for your support. You have a Premium account. By buying another Premium-Plan you can extend your premium-time.
                    You can use the following premium-features:
                    </p>
                    : <p>Buy Premium to support us and get access to these exclusive features:</p>}
                <span style={{ cursor: "pointer", width: "fit-content", fontWeight: "bold", fontSize: "x-large" }} onClick={() => { setShowFeatureDialog(true) }}><LinkIcon /> Show features</span>
            </Card>
            <div>
                <p>To use premium please login with Google</p>
                <GoogleSignIn onAfterLogin={onLogin} />
                {isLoggedIn ? <Payment hasPremium={hasPremium} /> : ""}
                {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
                {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>To use subscriptions please login with Google:</p> : ""}
            </div>
            {featureDialog}
        </div>
    )
}

export default Premium;