import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { Container } from 'react-bootstrap'
import PaymentStatusRefresh from '../../components/Premium/PaymentStatusRefresh'
import PaymentConfirmation from '../../components/Premium/PaymentConfirmation/PaymentConfirmation'

export default function Page() {
    return (
        <>
            <PaymentStatusRefresh />
            <Container>
                <PaymentConfirmation />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Thank you for your purchase',
    'Thank you for your purchase! Your purchase is added to your SkyCofl account as soon as your payment provider confirms the payment.',
    undefined,
    undefined,
    'Thank you for your purchase',
    getCanonicalUrl('/success')
)
