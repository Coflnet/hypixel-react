import '../styles/bootstrap-react.min.css'
import '../styles/bootstrap-dark-full.min.css'
import 'react-toastify/dist/ReactToastify.css'
import "react-contexify/ReactContexify.css"
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import '../styles/globals.css'
import { useEffect } from 'react'
import Script from 'next/script'
import { MainApp } from '../components/MainApp/MainApp'
import NextNProgress from 'nextjs-progressbar'
import { initCoflCoinManager } from '../utils/CoflCoinsUtils'
import { createInstance, MatomoProvider } from '@jonkoops/matomo-tracker-react'
import { GoogleOAuthProvider } from '@react-oauth/google'

interface ErrorLog {
    error: ErrorEvent
    timestamp: Date
}

const matomoTrackingInstance = createInstance({
    urlBase: 'https://track.coflnet.com',
    siteId: 1
})

export const errorLog: ErrorLog[] = []

initCoflCoinManager()

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        window.addEventListener('error', function (event) {
            errorLog.push({
                error: event,
                timestamp: new Date()
            })

            if (event.error.name === 'ChunkLoadError') {
                let chunkErrorLocalStorage = window.localStorage.getItem('chunkErrorReload')
                if (chunkErrorLocalStorage && parseInt(chunkErrorLocalStorage) + 5000 > new Date().getTime()) {
                    alert('There is something wrong with the website-chunks. Please try Control + F5 to hard refresh the page.')
                    return
                }
                window.localStorage.setItem('chunkErrorReload', new Date().getTime().toString())
                caches
                    .keys()
                    .then(keys => {
                        keys.forEach(key => {
                            caches.delete(key)
                        })
                    })
                    .catch(() => {})
                location.reload()
            }
        })
    }, [])

    return (
        <>
            <Script async={true} src={'/preScript.js'} />
            <MatomoProvider value={matomoTrackingInstance}>
                <GoogleOAuthProvider clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com">
                    <MainApp>
                        <NextNProgress />
                        <Component {...pageProps} />
                    </MainApp>
                </GoogleOAuthProvider>
            </MatomoProvider>
        </>
    )
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// MyApp.getInitialProps = async (appContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   return { ...appProps }
// }

export default MyApp
