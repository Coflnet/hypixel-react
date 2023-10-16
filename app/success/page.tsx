import Link from 'next/link'
import Confetti from '../../components/Confetti/Confetti'
import { getHeadMetadata } from '../../utils/SSRUtils'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import RBButton from '../../components/ReactBootstrapWrapper/Button'
import NavBar from '../../components/NavBar/NavBar'

export default function Page() {
    return (
        <>
            <RBContainer>
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
                    <RBButton>Return to the Premium page</RBButton>
                </Link>
            </RBContainer>
            <Confetti recycle={false} />
        </>
    )
}

export const metadata = getHeadMetadata('Payment successful')
