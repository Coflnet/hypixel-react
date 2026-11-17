'use client'
import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
}

function getSnapshot() {
    return document.visibilityState !== 'hidden'
}

function getServerSnapshot() {
    return true
}

/** false while the browser tab is hidden */
export function usePageVisible(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
