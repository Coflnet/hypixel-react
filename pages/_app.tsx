import { useEffect } from 'react'
import '../styles/globals.css'


import type { AppProps /*, AppContext */ } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

// This gets called on every request

export default MyApp;
