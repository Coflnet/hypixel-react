import React from 'react'
import Head from 'next/head'
import { Container } from 'react-bootstrap'
import SubscriptionList from '../components/SubscriptionList/SubscriptionList'
import NavBar from '../components/NavBar/NavBar'

function Subscriptions() {
    return (
        <div className="page">
            <Head>
                <title>Your Notifiers</title>
            </Head>
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
