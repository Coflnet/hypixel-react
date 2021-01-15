import React from 'react';
import SubscriptionList from '../../components/SubscriptionList/SubscriptionList';

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