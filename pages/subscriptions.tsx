import React from 'react';
import { Container } from 'react-bootstrap';
import SubscriptionList from '../components/SubscriptionList/SubscriptionList';
import NavBar from '../components/NavBar/NavBar';

function Subscriptions() {

    return (
        <div className="subscriptions-page">
            <Container>
                <h2>
                    <NavBar />
                    Your Notifiers
                </h2>
                <hr />
                <SubscriptionList />
            </Container>
        </div>
    );
}

export default Subscriptions;