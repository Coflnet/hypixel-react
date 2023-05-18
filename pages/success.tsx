import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Button, Container } from 'react-bootstrap'
import NavBar from '../components/NavBar/NavBar'
import { getHeadElement, isClientSideRendering } from '../utils/SSRUtils'
import ReactConfetti from 'react-confetti'

function Success() {
    let [isSSR, setIsSSR] = useState(true)

    useEffect(() => {
        setIsSSR(false)
    }, [])
    return (
        <div className="page">
            {getHeadElement('Payment successful')}
            <Container>
                <h2>
                    <NavBar />
                    <span style={{ color: 'lime' }}>Payment successful</span>
                </h2>
                <p>Your payment is being handled securely by our payment provider.</p>
                <p>
                    It may take <b>a few minutes</b> until your CoflCoins are credited.
                </p>
                <Link href="/premium" className="disableLinkStyle">
                    <Button>Return to the Premium page</Button>
                </Link>
            </Container>
            {!isSSR ? <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={false} /> : null}
        </div>
    )
}

export default Success
