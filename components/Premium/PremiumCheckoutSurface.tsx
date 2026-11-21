'use client'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, Container } from 'react-bootstrap'
import { usePlaySubscriptionsEnabled } from '../../hooks/usePlaySubscriptionsEnabled'
import { usePlayApp } from '../../hooks/usePlayApp'
import { usePlaySubscriptionResult } from '../../hooks/usePlaySubscriptionResult'
import { useIsMounted } from '../../utils/Hooks'
import { getPlayPurchaseMode, getPlaySubscriptionLabel, PLAY_STORE_LISTING, PLAY_WEBSITE_CHROME_INTENT } from '../../utils/PlaySubscriptions'
import { parseTierFromUrl } from '../../utils/PremiumUpgradeUtils'
import NavBar from '../NavBar/NavBar'
import PlaySubscriptionPurchase from './PlaySubscriptionPurchase'
import styles from './PremiumCheckoutSurface.module.css'

export default function PremiumCheckoutSurface({ children, mayBePlayApp }: { children: ReactNode; mayBePlayApp: boolean }) {
    const enabled = usePlaySubscriptionsEnabled()
    const app = usePlayApp()
    const hydrated = useIsMounted()
    const params = useSearchParams()
    const mode = getPlayPurchaseMode(app, params?.get('playUpdate') === '1')
    const failure = usePlaySubscriptionResult(true)

    if (!enabled) return children
    const failureNotice = failure && (
        <Alert variant="warning">
            <Alert.Heading>{getPlaySubscriptionLabel(failure.slug)} subscription</Alert.Heading>
            {failure.error}
        </Alert>
    )
    if (mode === 'web') {
        return (
            <div className={!hydrated && mayBePlayApp ? styles.webCheckout : undefined} data-testid="premium-web-checkout">
                {failureNotice && <Container>{failureNotice}</Container>}
                {children}
            </div>
        )
    }

    return (
        <Container>
            <h2><NavBar /> Premium</h2>
            <hr />
            {failureNotice}
            {mode === 'update' ? (
                <Alert variant="info">
                    <div className="d-flex flex-wrap gap-3 mb-2">
                        <a href={PLAY_STORE_LISTING}>Update or install the app from Google Play</a>
                        <a href={PLAY_WEBSITE_CHROME_INTENT}>Pay on the website instead</a>
                    </div>
                    <p className="mb-0">If Chrome isn’t installed, open sky.coflnet.com/premium in your browser.</p>
                </Alert>
            ) : (
                <PlaySubscriptionPurchase requestedTier={parseTierFromUrl(params?.get('tier') ?? null)} forFriends={params?.get('slots') === 'true'} />
            )}
        </Container>
    )
}
