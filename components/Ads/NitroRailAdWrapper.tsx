'use client'

import dynamic from 'next/dynamic'

// Use dynamic import with ssr: false to prevent hydration mismatch
// The rail ads will only render on the client, which avoids server/client HTML differences
const NitroRailAd = dynamic(() => import('./NitroRailAd'), { ssr: false })

interface NitroRailAdWrapperProps {
    side: 'left' | 'right'
}

export default function NitroRailAdWrapper({ side }: NitroRailAdWrapperProps) {
    return <NitroRailAd side={side} />
}
