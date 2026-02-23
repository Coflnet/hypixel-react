'use client'

import NitroAdSlot from '../Ads/NitroAdSlot'


interface ListItemAdElementProps {
    slotId: string,
    sizes: [number, number][]
}

export default function ListItemAdElement(props: ListItemAdElementProps) {

    return (
        <NitroAdSlot
            slotId={props.slotId}
            config={{
                format: 'display',
                mediaQuery: '(min-width: 0px)',
                sizes: props.sizes,
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
