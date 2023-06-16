'use client'

import { MatomoProvider, createInstance } from '@jonkoops/matomo-tracker-react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Script from 'next/script'
import SSRProvider from 'react-bootstrap/SSRProvider'
import { QueryParamProvider } from 'use-query-params'
import { MainApp } from '../MainApp/MainApp'
import NextAdapterApp from 'next-query-params/app'

const matomoTrackingInstance = createInstance({
    urlBase: 'https://track.coflnet.com',
    siteId: 1
})

export function Providers({ children }) {
    return (
        <SSRProvider>
            <Script async={true} src={'/preScript.js'} />
            <MatomoProvider value={matomoTrackingInstance}>
                <QueryParamProvider adapter={NextAdapterApp}>
                    <GoogleOAuthProvider clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com">
                        <MainApp>
                            <div className="page">{children}</div>
                        </MainApp>
                    </GoogleOAuthProvider>
                </QueryParamProvider>
            </MatomoProvider>
        </SSRProvider>
    )
}
