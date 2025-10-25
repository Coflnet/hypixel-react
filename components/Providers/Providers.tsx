'use client'
import { MatomoProvider, createInstance } from '@jonkoops/matomo-tracker-react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '../../utils/QueryUtils'
import { FavoritesProvider } from '../Favorites/FavoritesContext'
import { AdsProvider } from './AdsProvider'
import { FlipSettingsProvider } from './FlipSettingsProvider'

const matomoTrackingInstance = createInstance({
    urlBase: 'https://track.coflnet.com',
    siteId: 1
})

export function Providers({ children }) {
    const queryClient = getQueryClient()
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
