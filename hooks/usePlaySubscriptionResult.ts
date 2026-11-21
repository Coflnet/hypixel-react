'use client'
import { useSyncExternalStore } from 'react'
import { getPlaySubscriptionResult } from '../utils/PlaySubscriptions'
import { usePlaySubscriptionsEnabled } from './usePlaySubscriptionsEnabled'

function subscribe(onChange: () => void) {
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
}

export function usePlaySubscriptionResult(failed: boolean) {
    const enabled = usePlaySubscriptionsEnabled()
    const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
    return enabled ? getPlaySubscriptionResult(hash, failed) : null
}
