'use client'

import { useEffect, useState } from 'react'
import NitroAdSlot from './NitroAdSlot'

interface NitroRailAdsProps {
    side: 'left' | 'right'
}

/**
 * NitroRailAds - Manually renders multiple ads to fill the rail height
 * 
 * This component creates multiple ad slots with proper spacing to fill the
 * available height. Each ad slot is placed with configurable spacing.
 * 
 * Left rail: 160px wide ads
 * Right rail: 300px wide ads
 * 
 * Spacing: 600px between ads
 * Top padding: 300px for right rail (left rail uses CSS padding-top)
 * Margin: 5px around each ad
 */
export default function NitroRailAds({ side }: NitroRailAdsProps) {
    const [adCount, setAdCount] = useState(0)
    
    // Calculate how many ads can fit based on document height
    useEffect(() => {
        const calculateAdCount = () => {
            // Get the full document height
            const docHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight
            )
            
            // Ad dimensions and spacing
            const adHeight = 600 // Standard tall ad height
            const spacing = 600 // Space between ads
            const topPadding = side === 'right' ? 300 : 0 // Right rail starts 300px from top, left uses CSS
            
            // Calculate available height for ads
            const availableHeight = docHeight - topPadding
            
            // Calculate how many ads fit (ad + spacing, except last ad doesn't need trailing space)
            const count = Math.max(1, Math.floor((availableHeight + spacing) / (adHeight + spacing)))
            
            // Limit to reasonable number
            setAdCount(Math.min(count, 15))
        }
        
        // Initial calculation
        calculateAdCount()
        
        // Recalculate on resize and after DOM changes
        const resizeObserver = new ResizeObserver(() => {
            calculateAdCount()
        })
        
        resizeObserver.observe(document.body)
        
        // Also recalculate after a delay to catch dynamic content
        const timeoutId = setTimeout(calculateAdCount, 2000)
        
        return () => {
            resizeObserver.disconnect()
            clearTimeout(timeoutId)
        }
    }, [side])

    // Left rail config - 160px width
    const leftConfig = {
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

    // Don't render until we know how many ads to show
    if (adCount === 0) {
        return null
    }

    return (
        <div className={`rail-ads-container rail-ads-${side}`}>
            {Array.from({ length: adCount }, (_, index) => (
                <div key={`${side}-${index}`} className="rail-ad-slot">
                    <NitroAdSlot
                        slotId={`rail-${side}-${index}`}
                        config={config}
                    />
                </div>
            ))}
        </div>
    )
}
