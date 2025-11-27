'use client'
import Image from 'next/image'
import React, { useCallback, useMemo } from 'react'
import api from '../../api/ApiHelper'
import { convertTagToName, getMinecraftColorCodedElement } from '../../utils/Formatter'
import NumberElement from '../Number/Number'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipNpc, getGetApiFlipNpcQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { ReverseNpcFlip } from '../../api/_generated/skyApi.schemas'
import Tooltip from '../Tooltip/Tooltip'
import { NpcFlipDetails } from './NpcFlipDetails/NpcFlipDetails'

const SORT_OPTIONS: SortOption<ReverseNpcFlip>[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: (flips: ReverseNpcFlip[]) => flips.sort((a, b) => (b.profit || 0) - (a.profit || 0))
    },
    {
        label: 'Sell Price',
        value: 'sellPrice',
        sortFunction: (flips: ReverseNpcFlip[]) => flips.sort((a, b) => (b.sellPrice || 0) - (a.sellPrice || 0))
    },
    {
        label: 'Purchase Cost',
        value: 'purchaseCost',
        sortFunction: (flips: ReverseNpcFlip[]) => flips.sort((a, b) => (b.npcBuyPrice || 0) - (a.npcBuyPrice || 0))
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: (flips: ReverseNpcFlip[]) => flips.sort((a, b) => (b.volume || 0) - (a.volume || 0))
    },
    {
        label: 'Profit Margin',
        value: 'profitMargin',
        sortFunction: (flips: ReverseNpcFlip[]) => flips.sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
    }
]

function formatMargin(margin?: number | null): string {
    if (margin === null || margin === undefined || Number.isNaN(margin)) {
        return 'unknown'
    }
    const normalized = margin > 1 ? margin : margin * 100
    const fixedDigits = normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2
    return `${normalized.toFixed(fixedDigits)}%`
}

export function NpcFlips() {
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipNpcQueryKey()],
        queryFn: () => getApiFlipNpc()
    })

    const normalizedFlips = useMemo(() => (flips ? flips : []), [flips])

    const getTotalCost = useCallback((flip: ReverseNpcFlip): number => {
        if (!flip.costs || flip.costs.length === 0) {
            return flip.npcBuyPrice || 0
        }
        return flip.costs.reduce((sum, cost) => sum + (cost.price || 0), 0)
    }, [])

    function renderFlipContent(flip: ReverseNpcFlip) {
        const margin = formatMargin(flip.profitMargin)
        const totalCost = getTotalCost(flip)
        
        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Purchase Cost:</span> <NumberElement number={Math.round(totalCost)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Sell Price:</span> <NumberElement number={Math.round(flip.sellPrice || 0)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Profit:</span>{' '}
                    <span style={{ color: (flip.profit || 0) > 0 ? '#55ff55' : '#ff5555' }}>
                        <NumberElement number={Math.round(flip.profit || 0)} /> Coins
                    </span>
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Margin:</span> {margin}
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Volume:</span>{' '}
                    {(flip.volume || 0) > 0 ? <NumberElement number={Math.round(flip.volume || 0)} /> : 'unknown'}
                </p>
            </>
        )
    }

    function getFlipHeader(flip: ReverseNpcFlip): React.JSX.Element {
        const tag = flip.itemId || 'BARRIER'
        // Use itemName if it looks like a formatted name (contains spaces or Minecraft color codes)
        // Otherwise convert the tag to a readable name
        const rawName = flip.itemName || flip.itemId || ''
        const hasFormatting = rawName.includes(' ') || rawName.includes('§')
        const name = hasFormatting ? getMinecraftColorCodedElement(rawName) : convertTagToName(rawName)
        return (
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({ tag }) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {name}
            </span>
        )
    }

    function filterFunction(flip: ReverseNpcFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const searchText = nameFilter?.toLowerCase() || ''
        const itemName = (flip.itemName || '').toLowerCase()
        const convertedName = convertTagToName(flip.itemId || '').toLowerCase()
        const nameMatch = !searchText || itemName.includes(searchText) || convertedName.includes(searchText)
        const profitMatch = (flip.profit || 0) >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(flip: ReverseNpcFlip): ReverseNpcFlip {
        return {
            ...flip,
            itemId: 'BARRIER',
            itemName: '§6You cheated the blur ☺',
            npcName: 'Hidden NPC',
            npcBuyPrice: 42,
            sellPrice: 69,
            profit: 27,
            profitMargin: 64.3,
            costs: [
                {
                    itemName: 'Coins',
                    itemTag: 'SKYBLOCK_COIN',
                    price: 42,
                    amount: 1
                }
            ],
            volume: 123123,
            lastUpdated: new Date().toISOString()
        }
    }

    // Wrapper function for rendering with tooltip/modal
    function customItemWrapper(flip: ReverseNpcFlip, blur: boolean, key: string, content: React.ReactNode, flipCardClass: string) {
        if (blur) {
            return (
                <div key={key} className={flipCardClass}>
                    {content}
                </div>
            )
        } else {
            return (
                <Tooltip
                    key={key}
                    className={flipCardClass}
                    type="click"
                    content={<>{content}</>}
                    tooltipTitle={getFlipHeader(flip)}
                    tooltipContent={<NpcFlipDetails flip={flip} />}
                />
            )
        }
    }

    return (
        <>
            <p>This is a complete list the best items to flip from npc to either bazaar or the auction house in hypixel skyblock for a profit.</p>
            <details>
                <summary>How to do npc flipping</summary>
                <ol>
                    <li>Find an item you can afford and looks promising in the list</li>
                    <li>Click on the item to open the item page</li>
                    <li>(optional)Check the price history of the item to see if the price is stable or dropping</li>
                    <li>If the price is stable, buy some from the npc (you can find detailed information about the item on the linked wiki pages)</li>
                    <li>List the item on either ah or bazaar</li>
                    <li>After it sold, repeat</li>
                </ol>
            </details>
            <details>
                <summary>What is volume?</summary>
                <p>Volume is how many items are sold per day on average. The higher the volume the easier it is to sell your item.</p>
                <p>
                    For bazaar items this is how many items are sold on bazaar per day, for auction house items this is how many items are sold on auction house
                    per day.
                </p>
            </details>
            <details>
                <summary>What is median?</summary>
                <p>
                    The median is what an item usually sells for, you can learn more with <a href="https://www.youtube.com/watch?v=nfMo5CeJDgc">this video</a>.
                </p>
                <p>This is a good indicator of the actual price of an item as it is not influenced by outliers like the average price is.</p>
            </details>
            <details>
                <summary>How the Purchase Cost is calculated</summary>
                <p>
                    The displayed purchase cost is the sum of coins + item purchase cost required to get an item from the NPC.
                    <br />
                    For example <b>Wither Goggles</b> purchase cost is <b>5m</b> Skyblock Coins combined with the cost of <b>Shadow Goggles</b> both of which
                    you hand to the <a href="https://wiki.hypixel.net/Ophelia">Ophelia NPC</a>
                </p>
            </details>
            <details>
                <summary>Is there a limit to how many items I can buy from an NPC?</summary>
                <p>
                    Yes, many NPC items have a limit to how many items you can buy from them per day. <br />
                    This is usually 640 items per day for bazaar items.
                    <br />
                </p>
            </details>
            <details>
                <summary>Some items are inaccessible</summary>
                <p>
                    Some npc are only accessible during special skyblock events. If that event is not active you can't currently do the flip. <br />
                    Note that you can learn from the price difference. <br />
                    Buy more when the event is active and sell them later when its not. Doing it this way with a bit of waiting can net you way more profit with
                    npc flips.
                </p>
            </details>
            <br />
            <GenericFlipList
                items={normalizedFlips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.itemId || ''}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
                showColumns={true}
                customItemWrapper={customItemWrapper}
            />
        </>
    )
}
