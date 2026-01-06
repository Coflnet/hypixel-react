'use client'

import { useEffect, useState } from 'react'
import NitroAdSlot from './NitroAdSlot'

export default function NitroRailAd() {
    const [isBigScreen, setIsBigScreen] = useState(false)

    useEffect(() => {
        const checkScreen = () => {
            setIsBigScreen(window.matchMedia('(min-width: 1280px)').matches)
        }
        checkScreen()
        window.addEventListener('resize', checkScreen)
        return () => window.removeEventListener('resize', checkScreen)
    }, [])

    if (!isBigScreen) {
        return null
    }

    const commonConfig = {
        format: 'rail',
        railCollisionWhitelist: ['*'],
        railOffsetTop: 100,
        railOffsetBottom: 20,
        railStickyTop: 20,
        railDistance: 0,
        railSpacing: 10,
        railCloseColor: '#ffffff',
        sizes: [
            ['160', '600'],
            ['300', '600'],
            ['300', '480'],
            ['300', '250'],
        ],
        report: {
            enabled: true,
            wording: 'Report Ad',
            position: 'bottom-right'
        }
    }

    return (
        <>
            <NitroAdSlot
                slotId="rail-right"
                config={{
                    ...commonConfig,
                    rail: 'right'
                }}
            />
        </>
    )
}
