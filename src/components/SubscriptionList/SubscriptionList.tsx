import React, { useEffect, useState } from 'react';
import { Badge, Button, ListGroup } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d';
import { getLoadingElement } from '../../utils/LoadingUtils';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import './SubscriptionList.css'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter';
import NavBar from '../NavBar/NavBar';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { toast } from 'react-toastify';

interface Props {

}

let mounted = true;
let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function SubscriptionList(props: Props) {

    let [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    let [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        mounted = true;
    })

    useEffect(() => {
        return () => { mounted = false };
    }, []);

    function loadSubscriptions() {
        api.getSubscriptions().then(subscriptions => {
            if (!mounted) {
                return;
            }
            setSubscriptions(subscriptions);
        })
    }

    function onLogin() {
        let googleId = localStorage.getItem('googleId');
        if (googleId) {
            setIsLoggedIn(true);
            loadSubscriptions();
        }
    }

    function getSubTypesAsList(subTypes: SubscriptionType[], price: number): JSX.Element {
        return <ul>
            {
                subTypes.map(subType => {
                    let result;
                    switch (SubscriptionType[subType].toString()) {
                        case SubscriptionType.BIN.toString():
                            result = <li key="1">Notify only for instant buy</li>
                            break;
                        case SubscriptionType.PRICE_HIGHER_THAN.toString():
                            result = <li key="2">Notify if price is higher than <b>{numberWithThousandsSeperators(price)} Coins</b></li>
                            break;
                        case SubscriptionType.PRICE_LOWER_THAN.toString():
                            result = <li key="3">Notify if price is lower than <b>{numberWithThousandsSeperators(price)} Coins</b></li>
                            break;
                        case SubscriptionType.OUTBID.toString():
                            result = <li key="4">Notify if player outbid something</li>
                            break;
                        case SubscriptionType.SOLD.toString():
                            result = <li key="5">Notify if player sold something</li>
                            break;
                    }
                    return result;
                })
            }
        </ul>
    }

    function onDelete(subscription: Subscription) {
        api.unsubscribe(subscription).then((n) => {
            if (n === 0) {
                return;
            }
            let subs = subscriptions.filter(s => s !== subscription);
            setSubscriptions(subs);
            subscriptions = subs;

            toast.success(<span>Subscription deleted <Button style={{ float: "right", marginRight: "5px" }} variant="info" onClick={() => { resubscribe(subscription) }}>{repeatIcon} Undo</Button></span>)
        })
    }

    function resubscribe(subscription: Subscription) {
        api.subscribe(subscription.topicId, subscription.price, subscription.types).then(() => {
            loadSubscriptions();
        });
    }

    let repeatIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
            <path d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
        </svg>
    );

    let subscriptionsTableBody = subscriptions.map((subscription, i) =>
    (
        <ListGroup.Item key={i}>
            <h5><Badge style={{ marginRight: "5px" }} variant="primary">{i + 1}</Badge>{subscription.type === "item" ? convertTagToName(subscription.topicId) : subscription.topicId}</h5>
            {getSubTypesAsList(subscription.types, subscription.price)}
            <div style={{ position: "absolute", top: "0.75rem", right: "1.25rem" }} onClick={() => { onDelete(subscription) }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                </svg>
            </div>
        </ListGroup.Item>)
    )

    return (
        <div className="subscription-list">
            <h4>
                <NavBar />
                Your Subscriptions
            </h4>
            <hr />
            {isLoggedIn ?
                (subscriptions.length > 0 ?
                    <ListGroup style={{ marginTop: "20px" }}>
                        {subscriptionsTableBody}
                    </ListGroup>
                    : <p>You dont have any subscriptions</p>)
                : ""
            }
            {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ""}
            {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>To use subscriptions please login with Google:</p> : ""}
            <GoogleSignIn onAfterLogin={onLogin} />
        </div>
    );
}

export default SubscriptionList;