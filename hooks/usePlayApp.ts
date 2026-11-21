'use client'
import { useSyncExternalStore } from 'react'
import { isAndroidApp } from '../utils/AndroidApp'
import { usePlaySubscriptionsEnabled } from './usePlaySubscriptionsEnabled'

const subscribe = () => () => {}
const isNotApp = () => false

export function usePlayApp(): boolean {
    const enabled = usePlaySubscriptionsEnabled()
    return useSyncExternalStore(subscribe, enabled ? isAndroidApp : isNotApp, isNotApp)
}
