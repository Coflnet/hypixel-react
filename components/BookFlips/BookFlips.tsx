'use client'
import Image from 'next/image'
import React from 'react'
import api from '../../api/ApiHelper'
import Number from '../Number/Number'
import { BookFlip } from '../../api/_generated/skyApi.schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipBazaarBooks, getGetApiFlipBazaarBooksQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
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
            <p>
                This is a list of promising Hypixel Skyblock book flips (enchanted book trades) based on estimated profit per hour and hourly volume.
                Book flips compare related enchanted-book types (start and end tags) to show opportunities where buying books of a lower level and combining them in an anvil can net a profit.
                Use this as a starting point — always verify prices in-game before committing coins.
            </p>
            <details>
                <summary>What are start/end tags?</summary>
                <p>
                    Each flip has a <b>startTag</b> and an <b>endTag</b>. The start tag is the book you would acquire (buy/order) and the end tag is the book you combine to.
                    The list shows the estimated profit per hour for combining 2 of these book type using bazaar data.
                </p>
            </details>
            <details>
                <summary>How to perform book flips</summary>
                <ol>
                    <li>Click a flip to open the item page and inspect price history and details.</li>
                    <li>Place an appropriate buy order in game for the <i>start</i> book.</li>
                    <li>When acquired, comine them in an anvil and then create a sell order.</li>
                    <li>Consider not risking your full purse on a single order — scale your orders based on your balance and volume.</li>
                </ol>
            </details>
            <details>
                <summary>What do the metrics mean?</summary>
                <p>
                    <b>Profit per Hour</b> is an estimate based on current spreads and hourly volume. It represents potential earnings under typical conditions, but real results vary with market activity, fees are included already.
                    <br />
                    <b>Hourly Volume</b> indicates how many of the flip pair move per hour — higher volume usually means easier, faster trades.
                </p>
            </details>
            <details>
                <summary>Why are the top 3 flips hidden?</summary>
                <p>
                    The most sensitive/top-ranked flips depend on our historical data archive and manipulation detection. To help fund the archive, the top 3 flips are visible only to users with starter premium or higher.
                </p>
            </details>
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getFlipLink={(flip) => `https://sky.coflnet.com/item/${flip.endTag}`}
                getItemKeyAction={(flip) => flip.endTag || JSON.stringify(flip)}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
            />
        </>
    )
}
