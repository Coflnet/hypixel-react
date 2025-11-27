'use client'

import NitroAdSlot from './NitroAdSlot'

interface NitroRailAdProps {
    side: 'left' | 'right'
}

/**
 * NitroRailAd - Renders a sticky-stack ad in a grid column
 * 
 * This component is designed to work with the CSS grid layout in .page.
 * The wrapper div with className is in the layout, this component just renders the ad.
 * 
 * Left rail: 160px wide, starts 1000px from top (CSS handles the offset)
 * Right rail: 300px wide, can fit larger ad sizes
 */
export default function NitroRailAd({ side }: NitroRailAdProps) {
    // Left rail config - 160px width
    const leftConfig = {
        format: 'sticky-stack',
        stickyStackLimit: 15,
        stickyStackSpace: 2.5,
        stickyStackOffset: 50, // Offset from top of viewport when sticky
        stickyStackResizable: true,
        sizes: [
            ['160', '600'],
            ['160', '300'],
            ['160', '250'],
        ],
        report: {
            enabled: true,
            wording: 'Report Ad',
            position: 'bottom-right'
        }
    }

    // Right rail config - 300px width for larger ads
    const rightConfig = {
        format: 'sticky-stack',
        stickyStackLimit: 15,
        stickyStackSpace: 2.5,
        stickyStackOffset: 50, // Offset from top of viewport when sticky
        stickyStackResizable: true,
        sizes: [
            ['300', '600'],
            ['300', '480'],
            ['300', '250'],
            ['160', '600'],
        ],
        report: {
            enabled: true,
            wording: 'Report Ad',
            position: 'bottom-right'
        }
    }

    const config = side === 'left' ? leftConfig : rightConfig

    return (
        <NitroAdSlot
            slotId={`rail-${side}`}
            config={config}
        />
    )
}
