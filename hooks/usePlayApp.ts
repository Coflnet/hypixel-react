'use client'
import { createContext, useContext, useSyncExternalStore } from 'react'
import { isAndroidApp } from '../utils/AndroidApp'
import { usePlaySubscriptionsEnabled } from './usePlaySubscriptionsEnabled'

const subscribe = () => () => {}
const isNotApp = () => false

export const PlayWebsiteCheckoutContext = createContext(false)

function isApp() {
    return window.matchMedia('(display-mode: standalone)').matches || isAndroidApp()
}

export function usePlayApp(): boolean {
    const enabled = usePlaySubscriptionsEnabled()
    const app = useSyncExternalStore(subscribe, enabled ? isApp : isNotApp, isNotApp)
    const websiteCheckout = useContext(PlayWebsiteCheckoutContext)
    return enabled && app && !websiteCheckout
}
