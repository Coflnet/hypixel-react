'use client'
import Image from 'next/image'
import React from 'react'
import api from '../../api/ApiHelper'
import Number from '../Number/Number'
import { BookFlip } from '../../api/_generated/skyApi.schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipBazaarBooks, getGetApiFlipBazaarBooksQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import Link from 'next/link'
import { convertTagToName, formatToPriceToShorten } from '../../utils/Formatter'

const SORT_OPTIONS: SortOption<BookFlip>[] = [
    {
        label: 'Profit/Hour',
        value: 'profitPerHour',
        sortFunction: flips => flips.sort((a, b) => b.profitPerHour - a.profitPerHour)
    },
    {
        label: 'Volume ⇩',
        value: 'volumeAsc',
        sortFunction: flips => flips.sort((a, b) => b.hourlyVolume - a.hourlyVolume)
    }
]

export function BookFlips() {
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipBazaarBooksQueryKey()],
        queryFn: () => getApiFlipBazaarBooks(),
    })

    function renderFlipContent(flip: BookFlip) {
        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Start Tag:</span>{' '}{flip.startTag ? convertTagToName(flip.startTag) : "-"}
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Profit per Hour:</span>{' '}
                    {formatToPriceToShorten(flip.profitPerHour || 0)} Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Hourly Volume</span>
                    <Number number={Math.round((flip.hourlyVolume))} />
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Estimated Fees</span>
                    <Number number={Math.round((flip.estimatedFees))} /> Coins
                </p>
            </>
        )
    }

    function getFlipHeader(flip: BookFlip) {
        if (!flip.endTag) {
            return "-"
        }
        return (
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({ tag: "ENCHANTED_BOOK" }) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {convertTagToName(flip.endTag)}
            </span>
        )
    }

    function filterFunction(flip: BookFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const hasNoFilter = !nameFilter;
        const lowerNameFilter = nameFilter ? nameFilter.toLowerCase() : '';
        const startTagMatch = flip.startTag
            ? convertTagToName(flip.startTag).toLowerCase().includes(lowerNameFilter)
            : false;
        const endTagMatch = flip.endTag
            ? convertTagToName(flip.endTag).toLowerCase().includes(lowerNameFilter)
            : false;
        const nameMatch = hasNoFilter || startTagMatch || endTagMatch;
        const profitMatch = flip.profitPerHour >= minimumProfit;
        return nameMatch && profitMatch;
    }

    function censoredItemGenerator(flip: BookFlip): BookFlip {
        return {
            estimatedFees: 0,
            hourlyVolume: 0,
            profitPerHour: 0,
            timestamp: "",
            endTag: "You cheated the blur ☺",
            startTag: ""
        }
    }

    return (
        <>
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={(flip) => flip.endTag || JSON.stringify(flip)}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
            />
        </>
    )
}
