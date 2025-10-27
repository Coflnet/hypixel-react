'use client'

import { CSSProperties, useRef, useEffect, useState } from 'react'
import { useAds } from '../Providers/AdsProvider'
import { useNitroAds } from '../../hooks/useNitroAds'

interface NitroAdSlotProps {
    slotId: string
    config: Record<string, any>
    className?: string
    style?: CSSProperties
}

export default function NitroAdSlot({ slotId, config, className, style }: NitroAdSlotProps) {
    const { shouldShowAds } = useAds()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [hasError, setHasError] = useState(false)
    
    // Hook handles all the ad lifecycle logic
    useNitroAds(slotId, config, shouldShowAds)

    // Set up the ad container outside of React's control
    useEffect(() => {
        if (!shouldShowAds || !wrapperRef.current) return

        const adSlot = document.createElement('div')
        adSlot.id = slotId
        
        wrapperRef.current.innerHTML = ''
        wrapperRef.current.appendChild(adSlot)

        return () => {
            // Clean up the ad slot when unmounting
            try {
                if (wrapperRef.current) {
                    wrapperRef.current.innerHTML = ''
                }
            } catch (e) {
                console.warn('Error cleaning up ad slot:', e)
            }
        }
    }, [slotId, shouldShowAds])

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            // Check if the error is related to DOM manipulation by ads
            if (event.error?.name === 'NotFoundError' && 
                (event.error?.message?.includes('removeChild') || 
                 event.error?.message?.includes('not a child'))) {
                // Prevent the error from propagating and breaking the app
                event.preventDefault()
                event.stopPropagation()
                setHasError(true)
                console.warn('Ad-related DOM error suppressed to prevent app crash')
                return false
            }
        }

        window.addEventListener('error', handleError, true)
        return () => window.removeEventListener('error', handleError, true)
    }, [])

    if (!shouldShowAds || hasError) {
        return null
    }

    // Using a wrapper with ref to manually manage the inner content
    // This prevents React from trying to reconcile changes made by ad scripts
    return (
        <div 
            ref={wrapperRef}
            className={className} 
            style={style}
            suppressHydrationWarning
        />
    )
}
