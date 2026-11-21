'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Alert, Container } from 'react-bootstrap'
import { usePlaySubscriptionsEnabled } from '../../hooks/usePlaySubscriptionsEnabled'
import { PlayWebsiteCheckoutContext, usePlayApp } from '../../hooks/usePlayApp'
import { usePlaySubscriptionResult } from '../../hooks/usePlaySubscriptionResult'
import { getPlayPurchaseMode, getPlaySubscriptionLabel, PLAY_STORE_LISTING, PLAY_WEBSITE_FALLBACK } from '../../utils/PlaySubscriptions'
import { parseTierFromUrl } from '../../utils/PremiumUpgradeUtils'
import NavBar from '../NavBar/NavBar'
import PlaySubscriptionPurchase from './PlaySubscriptionPurchase'
import styles from './PremiumCheckoutSurface.module.css'

export default function PremiumCheckoutSurface({ children }: { children: ReactNode }) {
    const enabled = usePlaySubscriptionsEnabled()
    const app = usePlayApp()
    const params = useSearchParams()
    const mode = getPlayPurchaseMode(app, params?.get('playUpdate') === '1', params?.get('web') === '1')
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
            <PlayWebsiteCheckoutContext.Provider value={app}>
                <div className={app ? undefined : styles.webCheckout} data-testid="premium-web-checkout">
                    {failureNotice && <Container>{failureNotice}</Container>}
                    {children}
                </div>
            </PlayWebsiteCheckoutContext.Provider>
        )
    }

    return (
        <Container>
            <h2><NavBar /> Premium</h2>
            <hr />
            {failureNotice}
            {mode === 'update' ? (
                <Alert variant="info" className="d-flex flex-wrap gap-3">
                    <a href={PLAY_STORE_LISTING}>Update or install the app from Google Play</a>
                    <Link href={PLAY_WEBSITE_FALLBACK}>Pay on the website instead</Link>
                </Alert>
            ) : (
                <PlaySubscriptionPurchase requestedTier={parseTierFromUrl(params?.get('tier') ?? null)} forFriends={params?.get('slots') === 'true'} />
            )}
        </Container>
    )
}
