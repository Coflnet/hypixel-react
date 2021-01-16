import React, { useState } from 'react';
import './SubscribeButton.css';
import { Button, FormControl, InputGroup, Modal } from 'react-bootstrap';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import api from '../../api/ApiHelper';
import { SubscriptionType } from '../../api/ApiTypes.d';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Props {
    topic: string
}

function SubscribeButton(props: Props) {

    let { trackEvent } = useMatomo();
    let [showDialog, setShowDialog] = useState(false);
    let [price, setPrice] = useState("");
    let [isPriceAbove, setIsPriceAbove] = useState(true);
    let [onlyInstantBuy, setOnlyInstantBuy] = useState(false);
    let [isLoggedIn, setIsLoggedIn] = useState(false);

    function onSubscribe() {
        trackEvent({ action: "subscriptions", category: "subscribed" });
        setShowDialog(false);
        api.subscribe(props.topic, parseInt(price), getSubscriptionTypes()).then(() => {
            toast.success("Subscription success!");
        }).catch(error => {
            toast.error(error);
        })
    }

    function getSubscriptionTypes(): SubscriptionType[] {
        let types: SubscriptionType[] = [];
        if (isPriceAbove) {
            types.push(SubscriptionType.PRICE_HIGHER_THAN);
        }
        if (!isPriceAbove) {
            types.push(SubscriptionType.PRICE_LOWER_THAN);
        }
        if (onlyInstantBuy) {
            types.push(SubscriptionType.BIN);
        }
        return types;
    }

    function onLogin() {
        setIsLoggedIn(true);
    }

    function isNotifyDisabled() {
        return price === undefined || price === "";
    }

    let bellIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
        </svg>
    );

    let dialog = (
        <div className="subscribe-dialog">
            <Modal show={showDialog} onHide={() => setShowDialog(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a Notification</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoggedIn ?
                        <div>
                            <InputGroup className="price-input">
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="inputGroup-sizing-sm">Item price</InputGroup.Text>
                                </InputGroup.Prepend>
                                <FormControl aria-label="Small" aria-describedby="inputGroup-sizing-sm" type="number" onChange={(e) => setPrice(e.target.value)} />
                            </InputGroup>
                            <h5>Notify me ... </h5>
                            <div className="input-data">
                                <input type="radio" id="priceAboveCheckbox" defaultChecked={true} name="priceState" onChange={(e) => setIsPriceAbove(true)} />
                                <label htmlFor="priceAboveCheckbox">if the price is above the selected value</label>
                            </div>
                            <div className="input-data">
                                <input type="radio" id="priceBelowCheckbox" name="priceState" onChange={(e) => setIsPriceAbove(false)} />
                                <label htmlFor="priceBelowCheckbox">if the price is below the selected value</label>
                            </div>
                            <div className="input-data">
                                <input type="checkbox" id="onlyIstantBuy" onClick={(e) => { setOnlyInstantBuy((e.target as HTMLInputElement).checked) }} />
                                <label htmlFor="onlyIstantBuy">only for instant buy</label>
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
            <Button onClick={() => setShowDialog(true)}>{bellIcon} Subscribe</Button>
        </div >
    );
}

export default SubscribeButton;
