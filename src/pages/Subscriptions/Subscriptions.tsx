import React from 'react';
import { Container } from 'react-bootstrap';
import SubscriptionList from '../../components/SubscriptionList/SubscriptionList';
import './Subscriptions.css'

interface Props {

}

function Subscriptions(props: Props) {

    return (
        <div className="subscriptions-page">
            <Container>
                <SubscriptionList />
            </Container>
        </div>
    );
}

export default Subscriptions;