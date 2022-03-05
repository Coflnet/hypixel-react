import '../styles/bootstrap-react.min.css'
import '../styles/bootstrap-dark-full.min.css'
import '../styles/globals.css'
import 'react-toastify/dist/ReactToastify.css'
import 'react-contexify/dist/ReactContexify.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import { useEffect } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import { MainApp } from '../components/MainApp/MainApp'

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').then(
                    function (registration) {
                        console.log('Service Worker registration successful with scope: ', registration.scope)
                    },
                    function (err) {
                        console.log('Service Worker registration failed: ', err)
                    }
                )
            })
        }

        window.addEventListener('error', function (event) {
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
            <Head key="indexHead">
                <link rel="dns-prefetch" href="https://js.stripe.com"></link>
                <link rel="manifest" href="/manifest.json" />
                <title>Skyblock Auction House History</title>
                <meta name="description" content="Browse over 100 million auctions, and the bazzar of Hypixel SkyBlock" />
                <meta
                    httpEquiv="origin-trial"
                    content="AiID47XFUe5A23XpsQ09uZGmLNbzoXyVeFRskSRUJ3Bk030Fau5WH1MF941KwfH+RLTVYzrcssvGIYPuOi/kkwQAAABkeyJvcmlnaW4iOiJodHRwczovL2NvZmxuZXQuY29tOjQ0MyIsImZlYXR1cmUiOiJEaWdpdGFsR29vZHMiLCJleHBpcnkiOjE2Mzk1MjYzOTksImlzU3ViZG9tYWluIjp0cnVlfQ=="
                ></meta>
            </Head>
            <Script async={true} src={'/preScript.js'} />
            <Script async={true} src={'/MinecraftColorCodes.3.7.js'} />
            <MainApp>
                <Component {...pageProps} />
            </MainApp>
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
