import '../styles/bootstrap-react.min.css'
import '../styles/bootstrap-dark-full.min.css'
import 'react-toastify/dist/ReactToastify.css'
import 'react-contexify/dist/ReactContexify.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import '../styles/globals.css'
import { useEffect } from 'react'
import Script from 'next/script'
import { MainApp } from '../components/MainApp/MainApp'
import NextNProgress from 'nextjs-progressbar'

function MyApp({ Component, pageProps }) {
    useEffect(() => {
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
            <Script async={true} src={'/preScript.js'} />
            <Script async={true} src={'/MinecraftColorCodes.3.7.js'} />
            <MainApp>
                <NextNProgress />
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
