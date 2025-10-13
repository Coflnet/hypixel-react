'use client'

import { useEffect, useRef, useCallback } from 'react'

interface NitroAdsWindow extends Window {
    nitroAds?: {
        createAd: (slotId: string, config: Record<string, any>) => void
        removeAd: (slotId: string) => void
    }
}

declare const window: NitroAdsWindow

/**
 * Hook to manage NitroAds lifecycle for a specific ad slot
 * Handles ad creation with retry logic and cleanup
 */
export function useNitroAds(slotId: string, config: Record<string, any>, enabled: boolean) {
    const configRef = useRef(config)
    const hasRequestedRef = useRef(false)
    const retryTimeoutRef = useRef<number | undefined>(undefined)

    // Keep config ref updated without triggering effects
    configRef.current = config

    const removeAd = useCallback(() => {
        if (typeof window === 'undefined' || !hasRequestedRef.current) {
            return
        }

        const nitro = window.nitroAds
        if (nitro && typeof nitro.removeAd === 'function') {
            try {
                nitro.removeAd(slotId)
            } catch (e) {
                console.warn('Failed to remove NitroAd:', e)
            }
        }
        hasRequestedRef.current = false
    }, [slotId])

    const createAd = useCallback(() => {
        if (typeof window === 'undefined' || hasRequestedRef.current) {
            return true // Already created
        }

        const nitro = window.nitroAds
        if (nitro && typeof nitro.createAd === 'function') {
            try {
                nitro.createAd(slotId, configRef.current)
                hasRequestedRef.current = true
                return true
            } catch (e) {
                console.warn('Failed to create NitroAd:', e)
                return false
            }
        }
        return false // Not ready yet
    }, [slotId])

    useEffect(() => {
        if (!enabled) {
            removeAd()
            return
        }

        let attempt = 0
        const maxAttempts = 40
        let cancelled = false

        const tryCreateAd = () => {
            if (cancelled) return

            const created = createAd()
            
            if (!created && attempt < maxAttempts) {
                attempt++
                const delay = Math.min(500, 100 + attempt * 50)
                retryTimeoutRef.current = window.setTimeout(tryCreateAd, delay)
            }
        }

        tryCreateAd()

        return () => {
            cancelled = true
            if (retryTimeoutRef.current) {
                window.clearTimeout(retryTimeoutRef.current)
            }
            removeAd()
        }
    }, [slotId, enabled, createAd, removeAd])
}
