import React from 'react'
import Head from 'next/head'
import { Container } from 'react-bootstrap'
import SubscriptionList from '../components/SubscriptionList/SubscriptionList'
import NavBar from '../components/NavBar/NavBar'
import { getHeadElement } from '../utils/SSRUtils'

function Subscriptions() {
    return (
        <div className="page">
            {getHeadElement('Notifiers')}
            <Container>
                <h2>
                    <NavBar />
                    Your Notifiers
                </h2>
                <hr />
                <SubscriptionList />
            </Container>
        </div>
    )
}

export default Subscriptions
