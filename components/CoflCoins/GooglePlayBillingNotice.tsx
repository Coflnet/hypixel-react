import { Alert } from 'react-bootstrap'
import PremiumWebsiteAddress from '../Premium/PremiumWebsiteAddress'

export default function GooglePlayBillingNotice({ playApp }: { playApp: boolean }) {
    return (
        <Alert variant="info" style={{ marginBottom: '20px' }}>
            <Alert.Heading style={{ fontSize: '0.95rem', marginBottom: '8px' }}>💡 Limited to Google Play</Alert.Heading>
            <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                The Android app only supports Google Play Billing.{' '}
                {playApp ? (
                    <>PayPal, Stripe, and other payment methods are available on the website. <PremiumWebsiteAddress /></>
                ) : (
                    <>
                        For other payment methods like PayPal or Stripe, visit the{' '}
                        <a href="https://coflnet.com/premium" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600' }}>website</a>.
                    </>
                )}
            </p>
        </Alert>
    )
}
