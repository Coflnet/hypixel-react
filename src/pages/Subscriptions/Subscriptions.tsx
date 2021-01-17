import React from 'react';
import SubscriptionList from '../../components/SubscriptionList/SubscriptionList';
import './Subscriptions.css'

interface Props {

}

function Subscriptions(props: Props) {

    return (
        <div className="subscriptions-page">
            <SubscriptionList />
        </div>
    );
}

export default Subscriptions;