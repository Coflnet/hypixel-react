'use client'
import { useEffect } from 'react'
import { MatomoProvider, createInstance } from '@jonkoops/matomo-tracker-react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '../../utils/QueryUtils'
import { FavoritesProvider } from '../Favorites/FavoritesContext'
import { AdsProvider } from './AdsProvider'
import { FlipSettingsProvider } from './FlipSettingsProvider'

function hasGlobalPrivacyControl() {
    return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
}

const matomoTrackingInstance = createInstance({
    urlBase: 'https://track.coflnet.com',
    siteId: 1,
    configurations: {
        // Cookie tracking remains disabled until the CMP signals full consent.
        requireCookieConsent: true
    }
})

export function Providers({ children }) {
    const queryClient = getQueryClient()
    useEffect(() => {
        if (hasGlobalPrivacyControl()) {
            document.cookie = 'nonEssentialCookiesAllowed=false; max-age=31536000; path=/; SameSite=Lax'
            document.cookie = 'CCPAOPTOUT=1; max-age=31536000; path=/; SameSite=Lax'
            ;(window as any)._paq?.push(['forgetCookieConsentGiven'])
            ;(window as any)._paq?.push(['optUserOut'])
            return
        }

        // re-apply a previously given full-cookie consent on page load
        if (document.cookie.split('; ').includes('nonEssentialCookiesAllowed=true')) {
            ;(window as any)._paq?.push(['setCookieConsentGiven'])
        }
    }, [])
    return (
        <MatomoProvider value={matomoTrackingInstance}>
            <QueryClientProvider client={queryClient}>
                <GoogleOAuthProvider clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com">
                    <FavoritesProvider>
                        <AdsProvider>
                            <FlipSettingsProvider>{children}</FlipSettingsProvider>
                        </AdsProvider>
                    </FavoritesProvider>
                </GoogleOAuthProvider>
            </QueryClientProvider>
        </MatomoProvider>
    )
}
