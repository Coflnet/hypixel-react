import React, { ChangeEvent, useEffect, useState } from "react";
import GoogleSignIn from "../GoogleSignIn/GoogleSignIn";
import './Premium.css';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from "../../utils/LoadingUtils";
import { Button, Card, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import NavBar from "../NavBar/NavBar";
import PremiumFeatures from "./PremiumFeatures/PremiumFeatures";
import api from "../../api/ApiHelper";
import moment from 'moment';
import { Base64 } from "js-base64";
import { v4 as generateUUID } from 'uuid';
import { GoogleLogout } from 'react-google-login';
import { toast } from "react-toastify";
import { numberWithThousandsSeperators } from "../../utils/Formatter";
import { CoflCoinsDisplay } from "../CoflCoins/CoflCoinsDisplay";

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function Premium() {

    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [hasPremium, setHasPremium] = useState<boolean>();
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>();
    let [isLoading, setIsLoading] = useState(false);
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false);
    let [purchasePremiumDuration, setPurchasePremiumDuration] = useState(1);
    let [purchasePremiumDurationType, setPurchasePremiumDurationType] = useState("days");

    useEffect(() => {
        if (!wasAlreadyLoggedInGoogle && !isLoggedIn) {
            setHasPremium(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function loadHasPremiumUntil(): Promise<void> {
        let googleId = localStorage.getItem('googleId');
        return api.hasPremium(googleId!).then((hasPremiumUntil) => {
            let hasPremium = false;
            if (hasPremiumUntil !== undefined && hasPremiumUntil.getTime() > new Date().getTime()) {
                hasPremium = true;
            }
            setHasPremium(hasPremium);
            setHasPremiumUntil(hasPremiumUntil)
            setIsLoading(false);
        });
    }


    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setIsLoading(true);
            setIsLoggedIn(true);
            loadHasPremiumUntil();
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false);
        setHasPremium(false);
        wasAlreadyLoggedInGoogle = false;
        setRerenderGoogleSignIn(!rerenderGoogleSignIn);
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

    function onLogout() {
        setIsLoggedIn(false);
        setHasPremium(false);
        localStorage.removeItem("googleId");
        wasAlreadyLoggedInGoogle = false;
        setRerenderGoogleSignIn(!rerenderGoogleSignIn);
        toast.warn("Successfully logged out");
    }

    function onDurationChange(e: ChangeEvent<HTMLInputElement>) {
        setPurchasePremiumDuration(e.target.valueAsNumber);
    }

    function onDurationTypeChange(e: ChangeEvent<HTMLSelectElement>) {
        setPurchasePremiumDurationType(e.target.value);
    }

    function calculatePremiumPrice(duration: number, durationType: string): number | null {
        if (!duration || !durationType) {
            return null;
        }
        let durationMultiplier = 1;
        switch (durationType) {
            case "hours":
                durationMultiplier = 0.05;
                break;
            case "days":
                durationMultiplier = 1;
                break;
            case "months":
                durationMultiplier = 31;
                break;
            case "years":
                durationMultiplier = 365;
                break;
            default:
                durationMultiplier = 1;
                break;
        }
        return Math.round(duration * durationMultiplier * 1000);
    }

    function onPremiumBuy() {
        // TODO: How can I buy premium time with the new payment system
    }

    let coflPrice = calculatePremiumPrice(purchasePremiumDuration, purchasePremiumDurationType);
    let coflPriceElement = coflPrice ? numberWithThousandsSeperators(coflPrice) + " CoflCoins" : "---"

    return (
        <div className="premium">
            <h2>
                <NavBar />
                Premium
            </h2>
            <hr />
            {
                isLoading ? getLoadingElement() : hasPremium === undefined ? "" :
                    hasPremium
                        ? <p style={{ color: "#00bc8c" }}>You have a premium account. Thank you for your support.</p>
                        : <div>
                            <p style={{ color: "red", margin: 0 }}>You do not have a premium account</p>
                        </div>
            }
            {
                isLoggedIn && !hasPremium ?
                    <p><a href="#buyPremium">I want Premium!</a></p> :
                    ""
            }
            <hr />
            {
                isLoggedIn ? <p>
                    Account: {getAccountString()}
                </p> : ""
            }
            {
                hasPremium ?
                    <div>
                        <OverlayTrigger
                            overlay={<Tooltip id={generateUUID()}>
                                <span>{hasPremiumUntil?.toDateString()}</span>
                            </Tooltip>}>
                            <span>Your premium ends: {moment(hasPremiumUntil).fromNow()}</span>
                        </OverlayTrigger>
                    </div> : ""
            }
            {
                isLoggedIn ?
                    <div style={{ marginTop: "20px" }}>
                        <GoogleLogout
                            clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                            buttonText="Logout"
                            onLogoutSuccess={onLogout}
                        />
                    </div> : ""
            }
            {
                !wasAlreadyLoggedInGoogle && !isLoggedIn ?
                    <p>To use premium please login with Google</p> :
                    ""
            }
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} rerenderFlip={rerenderGoogleSignIn} />
            {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
            <hr />
            <h2>Features</h2>
            <Card className="premium-card">
                <Card.Header>
                    <Card.Title>
                        {hasPremium
                            ? <p>Thank you for your support. You have a Premium account. By buying another Premium-Plan you can extend your premium-time.
                                You can use the following premium-features:
                            </p>
                            : <p>Log in and buy Premium to support us and get access to these features</p>}
                    </Card.Title>
                </Card.Header>
                <div style={{ padding: "15px" }}>
                    <PremiumFeatures />
                </div>
            </Card>
            {
                isLoggedIn ? <div id="buyPremium">
                    <hr />
                    <h2>Purchase</h2>
                    <Card className="purchase-card">
                        <Card.Header>
                            <Card.Title>
                                Buy premium for a certain duration with your CoflCoins. The premium activate shortly after your purchase.
                            </Card.Title>
                        </Card.Header>
                        <div style={{ padding: "15px" }}>
                            <div>
                                <label className="label">Purchase Duration:</label>
                                <Form.Control type="number" min="1" step="1" value={purchasePremiumDuration || ""} style={{ width: "100px", display: "inline" }} onChange={onDurationChange}></Form.Control>
                                <Form.Control style={{ width: "100px", display: "inline" }} value={purchasePremiumDurationType} as="select" onChange={onDurationTypeChange}>
                                    <option key="hours" value="hours">hours</option>
                                    <option key="days" value="days">days</option>
                                    <option key="months" value="months">months</option>
                                    <option key="years" value="years">years</option>
                                </Form.Control>
                                <div style={{ float: "right" }}>
                                    <CoflCoinsDisplay />
                                </div>
                            </div>
                            <div style={{ marginTop: "20px" }}>
                                <label className="label">Price:</label>
                                <span>{coflPriceElement}</span>
                            </div>
                            <hr />
                            <Button style={{ marginTop: "10px" }} type="success" onClick={onPremiumBuy}>Confirm purchase</Button>
                        </div>
                    </Card>
                </div> : ""}
        </div>
    )
}

export default Premium;