import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d';
import './SubscriptionList.css'

interface Props {

}

let mounted = true;

function SubscriptionList(props: Props) {

    let [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    useEffect(() => {
        loadSubscriptions();
        return () => { mounted = false };
    });

    function loadSubscriptions() {
        api.getSubscriptions().then(subscriptions => {
            if (!mounted) {
                return;
            }
            setSubscriptions(subscriptions);
        })
    }

    function getSubTypesAsList(subTypes: SubscriptionType[]): JSX.Element {
        return <ul>
            {
                subTypes.map(subType => {
                    let result;
                    switch (subType) {
                        case SubscriptionType.BIN:
                            result = <li>Notify only for instant buy</li>
                            break;
                        case SubscriptionType.PRICE_HIGHER_THAN:
                            result = <li>Notify if price is higher</li>
                            break;
                        case SubscriptionType.PRICE_LOWER_THAN:
                            result = <li>Notify if price is lower</li>
                            break;
                    }
                    return result;
                })
            }
        </ul>
    }

    let subscriptionsTableBody = subscriptions.map((subscription, i) =>
    (
        <tr>
            <td>{i + 1}</td>
            <td>{subscription.topicId}</td>
            <td>{subscription.price}</td>
            <td>{getSubTypesAsList(subscription.types)}</td>
        </tr>)
    )

    return (
        <div>
            <Table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Subscription</th>
                        <th>Price</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {subscriptionsTableBody}
                </tbody>
            </Table>
        </div>
    );
}

export default SubscriptionList;