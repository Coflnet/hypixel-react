'use client'
import { MatomoProvider, createInstance } from '@jonkoops/matomo-tracker-react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query'

const matomoTrackingInstance = createInstance({
    urlBase: 'https://track.coflnet.com',
    siteId: 1
})

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

// https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
function getQueryClient() {
    if (isServer) {
        return makeQueryClient()
    } else {
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

export function Providers({ children }) {
    const queryClient = getQueryClient()
    return (
        <MatomoProvider value={matomoTrackingInstance}>
            <QueryClientProvider client={queryClient}>
                <GoogleOAuthProvider clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com">{children}</GoogleOAuthProvider>
            </QueryClientProvider>
        </MatomoProvider>
    )
}
