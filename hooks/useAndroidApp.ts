'use client'
import { useSyncExternalStore } from 'react'
import { isAndroidApp } from '../utils/AndroidApp'

const subscribe = () => () => {}

export function useAndroidApp(androidRequest = false): boolean | null {
    return useSyncExternalStore<boolean | null>(subscribe, isAndroidApp, () => androidRequest ? null : false)
}
