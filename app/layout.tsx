import 'react-contexify/ReactContexify.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { Providers } from '../components/Providers/Providers'
import Script from 'next/script'
import { MainApp } from '../components/MainApp/MainApp'
import AdScriptLoader from '../components/AdScriptLoader'
import ConsentButton from '../components/ConsentButton'
import NitroCMPEnhancer from '../components/NitroCMPEnhancer'
import properties from '../properties'
import type { Viewport } from 'next'
import { THEME_COLOR } from '../utils/SSRUtils'

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" translate="no">
            <head>
                {/* Translators replacing React-owned text cause removeChild/insertBefore crashes. */}
                <meta name="google" content="notranslate" />
                <meta name="google-adsense-account" content="ca-pub-6429823223434612" />
                <link rel="preconnect" href="https://sky.coflnet.com" />
                <link rel="preconnect" href="https://mc-heads.net" />
                <link rel="dns-prefetch" href="https://sky.coflnet.com" />
                <link rel="dns-prefetch" href="https://mc-heads.net" />
            </head>
            <Script async={true} src={'/preScript.js'} strategy="afterInteractive" />
            <body>
                <div className="page">
                    <Providers adsEnabled={!properties.isTestRunner}>
                        <MainApp>{children}</MainApp>
                        <AdScriptLoader />
                    </Providers>
                </div>
                {!properties.isTestRunner ? (
                    <>
                        <ConsentButton />
                        <NitroCMPEnhancer />
                    </>
                ) : null}
            </body>
        </html>
    )
}

export default RootLayout

// theme-color: the accent stripe of Discord embeds and the mobile browser bar
export const viewport: Viewport = {
    themeColor: THEME_COLOR
}

export const revalidate = 60
