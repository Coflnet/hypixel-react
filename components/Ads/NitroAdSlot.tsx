'use client'

import { CSSProperties } from 'react'
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
    
    // Hook handles all the ad lifecycle logic
    useNitroAds(slotId, config, shouldShowAds)

    if (!shouldShowAds) {
        return null
    }

    return <div id={slotId} className={className} style={style} />
}
