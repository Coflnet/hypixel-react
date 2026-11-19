'use client'
import { useSyncExternalStore } from 'react'
import { AutoplayPolicy, getAutoplayPolicy } from '../utils/ClipAutoplay'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const TOUCH_FIRST_QUERY = '(hover: none) and (pointer: coarse)'

type NetworkInformation = EventTarget & { saveData?: boolean }

function getConnection(): NetworkInformation | undefined {
    return (navigator as Navigator & { connection?: NetworkInformation }).connection
}

function matches(query: string): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
}

function subscribe(onChange: () => void) {
    const lists = typeof window.matchMedia === 'function' ? [REDUCED_MOTION_QUERY, TOUCH_FIRST_QUERY].map(query => window.matchMedia(query)) : []
    const connection = getConnection()
    lists.forEach(list => list.addEventListener('change', onChange))
    connection?.addEventListener?.('change', onChange)
    return () => {
        lists.forEach(list => list.removeEventListener('change', onChange))
        connection?.removeEventListener?.('change', onChange)
    }
}

function getSnapshot(): AutoplayPolicy {
    return getAutoplayPolicy({
        reducedMotion: matches(REDUCED_MOTION_QUERY),
        saveData: getConnection()?.saveData === true,
        touchFirst: matches(TOUCH_FIRST_QUERY)
    })
}

function getServerSnapshot(): AutoplayPolicy {
    return 'unknown'
}

/** 'auto' when clips may play on their own; 'manual' with reduced motion, data saver or a touch-first device */
export function useAutoplayPolicy(): AutoplayPolicy {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function subscribeTouchFirst(onChange: () => void) {
    if (typeof window.matchMedia !== 'function') return () => {}
    const list = window.matchMedia(TOUCH_FIRST_QUERY)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
}

/** true on devices whose main pointer is a finger (no hover) */
export function useIsTouchFirst(): boolean {
    return useSyncExternalStore(
        subscribeTouchFirst,
        () => matches(TOUCH_FIRST_QUERY),
        () => false
    )
}
