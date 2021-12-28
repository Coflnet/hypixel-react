import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/ApiHelper';
import './Snipers.css';
import { ArrowDownward as ArrowDownwardIcon } from '@material-ui/icons';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { Link } from 'react-router-dom';
import { useCoflCoins } from '../../utils/Hooks';
import { CoflCoinsDisplay } from '../CoflCoins/CoflCoinsDisplay';
import { numberWithThousandsSeperators } from '../../utils/Formatter';

export function Snipers() {

    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [hasPremium, setHasPremium] = useState<boolean>();
    let [isLoading, setIsLoading] = useState(false);
    let [coflCoins] = useCoflCoins();

    function getSniperElement(label: string, defaultPrice: number, estimatedSpeed: number, cpu: string, network: string, productId: string) {

        let price = hasPremium ? defaultPrice * 0.8 : defaultPrice;

        let formattedPrice = numberWithThousandsSeperators(Math.round(price));
        let formattedDefaultPrice = numberWithThousandsSeperators(Math.round(defaultPrice));

        return <Card className="sniper-product">
            <Card.Header>
                <h3 className="sniper-product-label">{label}</h3>
            </Card.Header>
            <Card.Body>

                {
                    hasPremium ? (
                        <div>
                            <p className="sniper-price" style={{ textDecoration: "line-through", textDecorationColor: "red" }}>{formattedDefaultPrice} CoflCoins</p>

                            <b><p style={{ textAlign: "center", marginTop: "10px", marginBottom: "10px" }}><ArrowDownwardIcon /> <span style={{ color: "lime" }}>-20%</span></p></b>

                            <p className="sniper-price" >{formattedPrice} CoflCoins</p>
                        </div>
                    ) : <p className="sniper-price" >{formattedPrice} CoflCoins</p>
                }
                <hr />
                <p>{estimatedSpeed}s on average per auction house scan</p>
                <hr />
                <p>{cpu}</p>
                <hr />
                <p>{network}</p>
                <hr />
                <p><b>Duration: 1 hour</b></p>
                <hr />
                <Button variant="success" disabled={price > coflCoins} onClick={() => { onSniperBuy(productId) }} style={{ width: "100%" }}>Buy Sniper (1h) for <p style={{ margin: "0" }}>{formattedPrice} Coflcoins</p></Button>
            </Card.Body >
        </Card >
    }

    function onSniperBuy(productId: string) {
        api.purchaseWithCoflcoins(productId).then(() => {
            toast.success(<span><h4>Purchase successfull</h4><p>You now get flips found by the sniper</p></span>)
        })
    }

    function loadHasPremiumUntil(): Promise<void> {
        let googleId = localStorage.getItem('googleId');
        return api.hasPremium(googleId!).then((hasPremiumUntil) => {
            let hasPremium = false;
            if (hasPremiumUntil !== undefined && hasPremiumUntil.getTime() > new Date().getTime()) {
                hasPremium = true;
            }
            setHasPremium(hasPremium);
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
    }

    return (
        <div className="snipers">
            {
                !wasAlreadyLoggedIn() && !isLoggedIn ?
                    <p>You need to be logged in to purchase Snipers:</p> :
                    ""
            }
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            {
                isLoggedIn ?
                    (
                        hasPremium ?
                            <p>You have premium and therefore get a <span className="discount-label">20% discount</span> on every Sniper. Thank you for your support.</p> :
                            <p>Premium users get a <span className="discount-label">20% discount</span> on every Sniper. Buy premium <Link to="/premium">here</Link>.</p>
                    ) : ""
            }
            <hr />
            {
                isLoggedIn && !isLoading ?
                    <div style={{ marginBottom: "20px" }}>
                        <CoflCoinsDisplay />
                    </div> :
                    ""
            }
            {isLoggedIn && !isLoading ?
                <div>
                    <div className="sniper-products">
                        {getSniperElement("Normal", 212, 1.09, "4 core cpu", "50Gbit Download", "sniper-small")}
                        {getSniperElement("Faster", 322, 0.63, "8 core cpu", "50Gbit Download", "sniper-medium")}
                        {getSniperElement("Allrounder", 360, 0.58, "8 core cpu", "50Gbit Download", "sniper-big")}
                        {getSniperElement("Ultra Fast", 634, 0.48, "30 core cpu", "50Gbit Download", "sniper-ultra")}
                        {getSniperElement("Cloud-Sniper", 1342, 0.01, "60 core cpu", "50Gbit Download", "sniper-cloud")}
                    </div>
                    <p style={{ marginTop: "20px" }}>*The sniper gets activated immediantly after the purchase!</p>
                </div> :
                getLoadingElement()
            }
        </div>
    )
}