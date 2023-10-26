import Link from 'next/link'
import Confetti from '../../components/Confetti/Confetti'
import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Button, Container } from 'react-bootstrap'

export default function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    <span style={{ color: 'lime' }}>Payment successful</span>
                </h2>
                <p>Your payment is being handled securely by our payment provider.</p>
                <p>
                    Your CoflCoins will be awarded as soon as the money transfer finished. This may take a few minutes up to a few days (depending on your
                    payment method).
                </p>
                <Link href="/premium" className="disableLinkStyle">
                    <Button>Return to the Premium page</Button>
                </Link>
            </Container>
            <Confetti recycle={false} />
        </>
    )
}

export const metadata = getHeadMetadata('Payment successful')
