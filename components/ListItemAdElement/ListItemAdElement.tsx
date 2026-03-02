'use client'

import NitroAdSlot from '../Ads/NitroAdSlot'
import ListItemAdElementAdBlockBackup from './ListItemAdElementAdBlockBackup'

interface ListItemAdElementProps {
    slotId: string,
    sizes: [number, number][]
}

export default function ListItemAdElement(props: ListItemAdElementProps) {
    return (
        <>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <ListItemAdElementAdBlockBackup />
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
            </div>

        </>
    )
}
