import Head from 'next/head'
import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import Premium from '../components/Premium/Premium'

function PremiumPage() {
    return (
        <div className="premium-page">
            <Head>
                <title>Premium</title>
            </Head>
            <Container>
                <Premium />
            </Container>
        </div>
    )
}

export default PremiumPage
