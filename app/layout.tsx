import 'react-toastify/dist/ReactToastify.css'
import 'react-contexify/ReactContexify.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { Providers } from '../components/Providers/Providers'
import Script from 'next/script'
import { MainApp } from '../components/MainApp/MainApp'

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <Script async={true} src={'/preScript.js'} />
            <body>
                <div className="page">
                    <Providers>
                        <MainApp>{children}</MainApp>
                    </Providers>
                </div>
            </body>
        </html>
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

export default RootLayout

export const revalidate = 0
