'use client'
import Image from 'next/image'
import React from 'react'
import { Badge } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import Number from '../Number/Number'
import { SpreadFlip } from '../../api/_generated/skyApi.schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipBazaarSpread, getGetApiFlipBazaarSpreadQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'

const SORT_OPTIONS: SortOption<SpreadFlip>[] = [
    {
        label: 'Profit/Hour',
        value: 'profitPerHour',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.profitPerHour || 0) - (a.flip?.profitPerHour || 0))
    },
    {
        label: 'Time ⇧',
        value: 'timeAsc',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.profitPerHour || 0) - (a.flip?.profitPerHour || 0))
    },
    {
        label: 'Time ⇩',
        value: 'timeDesc',
        sortFunction: flips => flips.sort((a, b) => (a.flip?.profitPerHour || 0) - (b.flip?.profitPerHour || 0))
    }
]

export function BazaarFlips() {
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipBazaarSpreadQueryKey()],
        queryFn: () => getApiFlipBazaarSpread(),
    })

    function renderFlipContent(flip: SpreadFlip, blur: boolean) {
        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Purchase Cost:</span>{' '}
                    <Number number={Math.round(flip.flip?.buyPrice || 0)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Sell Price:</span> <Number number={Math.round(flip.flip?.sellPrice || 0)} />
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Estimated Fees:</span>
                    <Number number={flip.flip?.estimatedFees || 0} /> Coins
                </p>
                {flip.flip?.medianBuyPrice &&
                    <p>
                        <span style={{ width: '150px', float: 'left' }}>Median:</span> <Number number={Math.round(flip.flip?.medianBuyPrice || 0)} /> Coins
                    </p>}
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Profit per Hour:</span>{' '}
                    <Number number={flip.flip?.profitPerHour || 0} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Volume:</span>
                    <Number number={flip.flip?.volume || 0} />
                </p>
                {flip.isManipulated &&
                    <p style={{ display: 'flex', justifyContent: 'end' }}>
                        <Badge bg="info" style={{ width: '150px', float: 'left' }}>Manipulated</Badge>
                    </p>
                }
            </>
        )
    }

    function getFlipHeader(flip: SpreadFlip) {
        return (
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({ tag: flip.flip?.itemTag || "" }) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {flip.itemName}
            </span>
        )
    }

    function filterFunction(flip: SpreadFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (flip.itemName?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false)
        const profitMatch = (flip.flip?.profitPerHour || 0) >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(flip: SpreadFlip): SpreadFlip {
        return {
            ...flip,
            itemName: 'You cheated the blur ☺',
            flip: {
                buyPrice: 12345,
                sellPrice: 69420,
                profitPerHour: -100000,
                volume: -1,
                itemTag: 'BARRIER',
                estimatedFees: 0,
                timestamp: '',
                medianBuyPrice: 0
            }
        }
    }

    return (
        <GenericFlipList
            items={flips}
            sortOptions={SORT_OPTIONS}
            renderFlipContentAction={renderFlipContent}
            filterFunction={filterFunction}
            getItemKeyAction={(flip) => flip.itemName || ''}
            censoredItemGenerator={censoredItemGenerator}
            premiumMessage="The top 3 flips can only be seen with starter premium or better"
            clickMessage="Click on a flip for further details"
        />
    )
}
