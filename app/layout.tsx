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

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="google-adsense-account" content="ca-pub-6429823223434612" />
            </head>
            <Script strategy="beforeInteractive" src={'/preScript.js'} />
            <body>
                <div className="page">
                    <Providers>
                        <MainApp>{children}</MainApp>
                        <AdScriptLoader />
                    </Providers>
                </div>
                <ConsentButton />
                <NitroCMPEnhancer />
            </body>
        </html>
    )
}

export default RootLayout

export const revalidate = 60
