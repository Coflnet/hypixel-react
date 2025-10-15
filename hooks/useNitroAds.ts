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

        // First, try to use NitroAds API to remove the ad
        const nitro = window.nitroAds
        if (nitro && typeof nitro.removeAd === 'function') {
            try {
                nitro.removeAd(slotId)
            } catch (e) {
                console.warn('Failed to remove NitroAd via API:', e)
            }
        }
        
        // This prevents React from trying to manipulate nodes that may have been modified by ad scripts
        try {
            const adContainer = document.getElementById(slotId)
            if (adContainer) {
                const safeRemoveChildren = () => {
                    try {
                        // Use innerHTML = '' as the safest way to clear content
                        // This doesn't throw errors if the DOM structure is unexpected
                        adContainer.innerHTML = ''
                    } catch (innerError) {
                        // If even innerHTML fails, try manual removal with error handling
                        while (adContainer.firstChild) {
                            try {
                                adContainer.removeChild(adContainer.firstChild)
                            } catch (removeError) {
                                // Node might have been removed by ad script, continue to next
                                break
                            }
                        }
                    }
                }
                safeRemoveChildren()
            }
        } catch (e) {
            console.debug('Ad container cleanup skipped (already removed):', slotId)
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
            // Delay cleanup slightly to allow navigation to complete
            // This prevents React from trying to remove nodes during navigation
            setTimeout(() => {
                removeAd()
            }, 0)
        }
    }, [slotId, enabled, createAd, removeAd])
}
