import Head from 'next/head'
import React, { useEffect } from 'react'
import { Container } from 'react-bootstrap'
import RefComponent from '../components/Ref/Ref'

function Ref() {
    return (
        <div className="page">
            <Head>
                <title>Referral</title>
            </Head>
            <Container>
                <RefComponent />
            </Container>
        </div>
    )
}

export default Ref
