'use client'

import { CSSProperties, useEffect, useRef } from 'react'
import { useShouldShowAds } from '../../hooks/useShouldShowAds'

interface NitroAdSlotProps {
    slotId: string
    config: Record<string, any>
    className?: string
    style?: CSSProperties
}

export default function NitroAdSlot({ slotId, config, className, style }: NitroAdSlotProps) {
    const shouldShowAds = useShouldShowAds()
    const configRef = useRef(config)
    const hasRequestedRef = useRef(false)

    useEffect(() => {
        configRef.current = config
    }, [config])

    useEffect(() => {
        if (!shouldShowAds) {
            // ensure ad is torn down if user becomes premium
            if (hasRequestedRef.current && typeof window !== 'undefined') {
                const nitro = (window as any).nitroAds
                if (nitro && typeof nitro.removeAd === 'function') {
                    try {
                        nitro.removeAd(slotId)
                    } catch (e) {}
                }
            }
            hasRequestedRef.current = false
            return
        }

        let isCancelled = false
        let attempt = 0
        const maxAttempts = 40
        let timeoutHandle: number | undefined

        const requestAd = () => {
            if (isCancelled || hasRequestedRef.current || !shouldShowAds) {
                return
            }
            if (typeof window === 'undefined') {
                return
            }
            const nitro = (window as any).nitroAds
            if (nitro && typeof nitro.createAd === 'function') {
                hasRequestedRef.current = true
                try {
                    nitro.createAd(slotId, configRef.current)
                } catch (e) {
                    // allow retry if nitro throws synchronously
                    hasRequestedRef.current = false
                }
                return
            }
            if (attempt++ < maxAttempts) {
                timeoutHandle = window.setTimeout(requestAd, Math.min(500, 100 + attempt * 50))
            }
        }

        requestAd()

        return () => {
            isCancelled = true
            if (timeoutHandle) {
                window.clearTimeout(timeoutHandle)
            }
            if (hasRequestedRef.current && typeof window !== 'undefined') {
                const nitro = (window as any).nitroAds
                if (nitro && typeof nitro.removeAd === 'function') {
                    try {
                        nitro.removeAd(slotId)
                    } catch (e) {}
                }
            }
            hasRequestedRef.current = false
        }
    }, [slotId, shouldShowAds])

    if (!shouldShowAds) {
        return null
    }

    return <div id={slotId} className={className} style={style} />
}
