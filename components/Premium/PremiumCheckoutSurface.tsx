'use client'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, Container } from 'react-bootstrap'
import { usePlaySubscriptionsEnabled } from '../../hooks/usePlaySubscriptionsEnabled'
import { useAndroidApp } from '../../hooks/useAndroidApp'
import { getPlayPurchaseMode, PLAY_STORE_LISTING } from '../../utils/PlaySubscriptions'
import { parseTierFromUrl } from '../../utils/PremiumUpgradeUtils'
import NavBar from '../NavBar/NavBar'
import PlaySubscriptionPurchase from './PlaySubscriptionPurchase'

export default function PremiumCheckoutSurface({ children, androidRequest }: { children: ReactNode; androidRequest: boolean }) {
    const enabled = usePlaySubscriptionsEnabled()
    const androidApp = useAndroidApp(androidRequest)
    const params = useSearchParams()
    const mode = getPlayPurchaseMode(enabled, androidApp === true, params?.get('playUpdate') === '1')

    if (enabled && androidApp === null && mode === 'web') return null
    if (mode === 'web') return children

    return (
        <Container>
            <h2><NavBar /> Premium</h2>
            <hr />
            {mode === 'update' ? (
                <Alert variant="info">
                    Update the app from Google Play to subscribe. <a href={PLAY_STORE_LISTING}>Open Google Play</a>
                </Alert>
            ) : (
                <PlaySubscriptionPurchase requestedTier={parseTierFromUrl(params?.get('tier') ?? null)} forFriends={params?.get('slots') === 'true'} />
            )}
        </Container>
    )
}
