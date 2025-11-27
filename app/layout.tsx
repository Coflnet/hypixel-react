import 'react-contexify/ReactContexify.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import 'react-loading-skeleton/dist/skeleton.css'
import '../styles/globals.css'
import { Providers } from '../components/Providers/Providers'
import Script from 'next/script'
import { MainApp } from '../components/MainApp/MainApp'
import AdScriptLoader from '../components/AdScriptLoader'
import ConsentButton from '../components/ConsentButton'
import NitroCMPEnhancer from '../components/NitroCMPEnhancer'
import NitroRailAdsWrapper from '../components/Ads/NitroRailAdsWrapper'

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="google-adsense-account" content="ca-pub-6429823223434612" />
            </head>
            <Script async={true} src={'/preScript.js'} />
            <body>
                <Providers>
                    <div className="page">
                        {/* Grid column 1: Main content */}
                        <div className="page-content">
                            <MainApp>{children}</MainApp>
                        </div>
                        
                        {/* Grid column 2: Right ad rail */}
                        <div className="page-rail-right">
                            <NitroRailAdsWrapper side="right" />
                        </div>
                    </div>
                    <AdScriptLoader />
                </Providers>
                <ConsentButton />
                <NitroCMPEnhancer />
            </body>
        </html>
    )
}

export default RootLayout

export const revalidate = 60
