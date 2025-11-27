'use client'

import dynamic from 'next/dynamic'

// Dynamically import NitroRailAds with SSR disabled to prevent hydration mismatch
const NitroRailAds = dynamic(() => import('./NitroRailAds'), {
    ssr: false,
    loading: () => null
})

interface NitroRailAdsWrapperProps {
    side: 'left' | 'right'
}

export default function NitroRailAdsWrapper({ side }: NitroRailAdsWrapperProps) {
    return <NitroRailAds side={side} />
}
