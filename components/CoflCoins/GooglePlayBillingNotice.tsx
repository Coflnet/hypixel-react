import { Alert } from 'react-bootstrap'

export const PREMIUM_WEBSITE_URL = 'https://coflnet.com/premium'

export default function GooglePlayBillingNotice() {
    return (
        <Alert variant="info" style={{ marginBottom: '20px' }}>
            <Alert.Heading style={{ fontSize: '0.95rem', marginBottom: '8px' }}>💡 Limited to Google Play</Alert.Heading>
            <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                The Android app only supports Google Play Billing. For other payment methods like PayPal or Stripe, visit the{' '}
                <a href={PREMIUM_WEBSITE_URL} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600' }}>
                    website
                </a>.
            </p>
        </Alert>
    )
}
