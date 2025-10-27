'use client'

import NitroAdSlot from '../Ads/NitroAdSlot'

export function BottomBanner() {
    return (
        <NitroAdSlot
            slotId="bottom-banner"
            config={{
                format: 'anchor-v2',
                anchor: 'bottom',
                anchorBgColor: 'rgb(0 0 0 / 80%)',
                anchorClose: true,
                anchorPersistClose: false,
                anchorStickyOffset: 0,
                mediaQuery: '(min-width: 0px)',
                report: {
                    enabled: true,
                    icon: true,
                    wording: 'Report Ad',
                    position: 'top-right'
                }
            }}
        />
    )
}
