'use client'
import { useSyncExternalStore } from 'react'
import { PLAY_SUBSCRIPTIONS_ENABLED } from '../utils/PlaySubscriptions'

const subscribe = () => () => {}

function getSnapshot(): boolean {
    if (process.env.NEXT_PUBLIC_TEST_RUNNER === 'true') {
        const override = (window as Window & { __playSubscriptionsEnabled?: boolean }).__playSubscriptionsEnabled
        if (override !== undefined) return override
    }
    return PLAY_SUBSCRIPTIONS_ENABLED
}

export function usePlaySubscriptionsEnabled(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, () => PLAY_SUBSCRIPTIONS_ENABLED)
}
