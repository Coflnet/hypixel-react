import React, { useState } from 'react';
import './SubscribeButton.css';
import { Button, FormControl, InputGroup, Modal } from 'react-bootstrap';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import api from '../../api/ApiHelper';
import { SubscriptionType } from '../../api/ApiTypes.d';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useHistory } from "react-router-dom";
import askForNotificationPermissons from '../../utils/NotificationPermisson';
import { NotificationsOutlined as NotificationIcon } from '@material-ui/icons';

interface Props {
    topic: string
    type: "player" | "item" | "auction",
    hideText?: boolean
}

function SubscribeButton(props: Props) {

    let { trackEvent } = useMatomo();
    let history = useHistory();
    let [showDialog, setShowDialog] = useState(false);
    let [price, setPrice] = useState("");
    let [isPriceAbove, setIsPriceAbove] = useState(true);
    let [onlyInstantBuy, setOnlyInstantBuy] = useState(false);
    let [gotOutbid, setGotOutbid] = useState(false);
    let [isSold, setIsSold] = useState(false);
    let [isLoggedIn, setIsLoggedIn] = useState(false);

    function onSubscribe() {
        trackEvent({ action: "subscribed", category: "subscriptions" });
        setShowDialog(false);
        api.subscribe(props.topic, getSubscriptionTypes(), price ? parseInt(price) : undefined).then(() => {
            toast.success("Subscription success!", {
                onClick: () => {
                    history.push({
                        pathname: "/subscriptions"
                    })
                }
            });
        }).catch(error => {
            toast.error(error.Message, {
                onClick: () => {
                    history.push({
                        pathname: "/subscriptions"
                    })
                }
            });
        })
    }

    function getSubscriptionTypes(): SubscriptionType[] {
        let types: SubscriptionType[] = [];
        if (props.type === "item") {
            if (isPriceAbove) {
                types.push(SubscriptionType.PRICE_HIGHER_THAN);
            }
            if (!isPriceAbove) {
                types.push(SubscriptionType.PRICE_LOWER_THAN);
            }
            if (onlyInstantBuy) {
                types.push(SubscriptionType.BIN);
            }
        }
        if (props.type === "player") {
            if (gotOutbid) {
                types.push(SubscriptionType.OUTBID);
            }
            if (isSold) {
                types.push(SubscriptionType.SOLD);
            }
        }
        if (props.type === "auction") {
            types.push(SubscriptionType.AUCTION);
        }
        return types;
    }

    function onLogin() {
        setIsLoggedIn(true);
        askForNotificationPermissons().then(token => {
            api.setToken(token).then(() => {
                if (props.type === "auction") {
                    onSubscribe();
                    setShowDialog(false);
                }
            });
        });
    }

    function isNotifyDisabled() {
        if (props.type === "item") {
            return price === undefined || price === "";
        }
        if (props.type === "player") {
            return !gotOutbid && !isSold;
        }
    }

    function closeDialog() {
        trackEvent({ action: "subscription dialog closed", category: "subscriptions" });
        setShowDialog(false)
    }

    function openDialog() {
        trackEvent({ action: "subscription dialog opened", category: "subscriptions" });
        setShowDialog(true)
    }

    let dialog = (
        <div className="subscribe-dialog">
            <Modal show={showDialog} onHide={closeDialog}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a Notification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoggedIn ?
                        <div>
                            {props.type === "item" ?
                                <InputGroup className="price-input">
                                    <InputGroup.Prepend>
                                        <InputGroup.Text id="inputGroup-sizing-sm">Item price</InputGroup.Text>
                                    </InputGroup.Prepend>
                                    <FormControl aria-label="Small" aria-describedby="inputGroup-sizing-sm" type="number" onChange={(e) => setPrice(e.target.value)} />
                                </InputGroup>
                                : ""}
                            <h5>Notify me ... </h5>
                            <div className="item-forms">
                                {props.type === "item" ?
                                    <div>
                                        <div className="input-data">
                                            <input type="radio" id="priceAboveCheckbox" defaultChecked={isPriceAbove} name="priceState" onChange={(e) => setIsPriceAbove(true)} />
                                            <label htmlFor="priceAboveCheckbox">if the price is above the selected value</label>
                                        </div>
                                        <div className="input-data">
                                            <input type="radio" id="priceBelowCheckbox" name="priceState" defaultChecked={!isPriceAbove} onChange={(e) => setIsPriceAbove(false)} />
                                            <label htmlFor="priceBelowCheckbox">if the price is below the selected value</label>
                                        </div>
                                        <div className="input-data">
                                            <input type="checkbox" id="onlyIstantBuy" defaultChecked={onlyInstantBuy} onClick={(e) => { setOnlyInstantBuy((e.target as HTMLInputElement).checked) }} />
                                            <label htmlFor="onlyIstantBuy">only for instant buy</label>
                                        </div>
                                    </div>
                                    : ""}
                            </div>
                            <div className="player-forms">
                                {props.type === "player" ?
                                    <div>
                                        <div className="input-data">
                                            <input type="checkbox" id="outbidCheckbox" defaultChecked={gotOutbid} onChange={(e) => setGotOutbid((e.target as HTMLInputElement).checked)} />
                                            <label htmlFor="outbidCheckbox">if player gets outbid</label>
                                        </div>
                                        <div className="input-data">
                                            <input type="checkbox" id="isSoldCheckbox" defaultChecked={isSold} onChange={(e) => setIsSold((e.target as HTMLInputElement).checked)} />
                                            <label htmlFor="isSoldCheckbox">if an auction of the player has ended</label>
                                        </div>
                                    </div>
                                    : ""}
                            </div>
                            <Button block onClick={onSubscribe} disabled={isNotifyDisabled()} className="notifyButton">Notify me</Button>
                        </div> :
                        <p>To use subscriptions, please login with Google: </p>
                    }
                    <GoogleSignIn onAfterLogin={onLogin} />
                </Modal.Body>
            </Modal>
        </div>
    );

    return (
        <div className="subscribe-button">
            {dialog}
            <Button style={{ width: "max-content" }} onClick={openDialog}><NotificationIcon /> {props.hideText ? "" : " Subscribe"}</Button>
        </div >
    );
}

export default SubscribeButton;
