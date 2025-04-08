'use client'
import { MatomoProvider, createInstance } from '@jonkoops/matomo-tracker-react'
import { GoogleOAuthProvider } from '@react-oauth/google'

const matomoTrackingInstance = createInstance({
    urlBase: 'https://track.coflnet.com',
    siteId: 1
})

export function Providers({ children }) {
    return (
        <MatomoProvider value={matomoTrackingInstance}>
            <GoogleOAuthProvider clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com">{children}</GoogleOAuthProvider>
        </MatomoProvider>
    )
}
