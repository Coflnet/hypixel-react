import Link from 'next/link'
import React from 'react'
import { Button, Container } from 'react-bootstrap'
import NavBar from '../components/NavBar/NavBar'
import { getHeadElement } from '../utils/SSRUtils'

function Success() {
    return (
        <div className="page">
            {getHeadElement('Payment successful')}
            <Container>
                <h2 style={{ color: 'lime' }}>
                    <NavBar />
                    Payment successful
                </h2>
                <p>Your payment is being handled securely by our payment provider.</p>
                <p>
                    It may take <b>a few minutes</b> until your CoflCoins are credited.
                </p>
                <Link href="/premium" className="disableLinkStyle">
                    <a>
                        <Button>Return to the Premium page</Button>
                    </a>
                </Link>
            </Container>
        </div>
    )
}

export default Success
