import '../styles/bootstrap-react.min.css'
import '../styles/bootstrap-dark.min.css'
import 'react-toastify/dist/ReactToastify.css'
import 'react-contexify/ReactContexify.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import '../styles/globals.css'
import { MainApp } from '../components/MainApp/MainApp'
import { initCoflCoinManager } from '../utils/CoflCoinsUtils'

initCoflCoinManager()

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body>
                <MainApp>
                    <div className="page">{children}</div>
                </MainApp>
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
