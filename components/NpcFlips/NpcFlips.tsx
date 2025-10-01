'use client'
import Image from 'next/image'
import React, { useMemo } from 'react'
import api from '../../api/ApiHelper'
import { getMinecraftColorCodedElement } from '../../utils/Formatter'
import Number from '../Number/Number'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipNpc, getGetApiFlipNpcQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { parseProfitableCrafts } from '../../utils/Parser/APIResponseParser'

const SORT_OPTIONS: SortOption<ProfitableCraft>[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: (crafts: ProfitableCraft[]) => crafts.sort((a, b) => b.sellPrice - b.craftCost - (a.sellPrice - a.craftCost))
    },
    {
        label: 'Sell Price',
        value: 'sellPrice',
        sortFunction: (crafts: ProfitableCraft[]) => crafts.sort((a, b) => b.sellPrice - a.sellPrice)
    },
    {
        label: 'Craft Cost',
        value: 'craftCost',
        sortFunction: (crafts: ProfitableCraft[]) => crafts.sort((a, b) => b.craftCost - a.craftCost)
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: crafts => crafts.sort((a, b) => b.volume - a.volume)
    }
]

export function NpcFlips() {
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipNpcQueryKey()],
        queryFn: () => getApiFlipNpc()
    })

    const crafts = useMemo(() => (flips ? parseProfitableCrafts(flips) : []), [flips])

    function renderFlipContent(craft: ProfitableCraft) {
        return (
            <>
                <h4>{getCraftHeader(craft)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Purchase Cost:</span> <Number number={Math.round(craft.craftCost)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Sell Price:</span> <Number number={Math.round(craft.sellPrice)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Median:</span>{' '}
                    {craft.median > 0 ? (
                        <span>
                            <Number number={Math.round(craft.median)} /> Coins
                        </span>
                    ) : (
                        'unknown'
                    )}
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Volume:</span> {craft.volume > 0 ? <Number number={Math.round(craft.volume)} /> : 'unknown'}
                </p>
            </>
        )
    }

    function getCraftHeader(craft: ProfitableCraft): React.JSX.Element {
        return (
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl(craft.item) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {getMinecraftColorCodedElement(craft.item.name)}
            </span>
        )
    }

    function filterFunction(craft: ProfitableCraft, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (craft.item.name?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false)
        const profitMatch = craft.sellPrice - craft.craftCost >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(craft: ProfitableCraft): ProfitableCraft {
        return {
            ...craft,
            item: {
                tag: '',
                name: '§6You cheated the blur ☺',
                iconUrl: 'https://sky.coflnet.com/static/icon/BARRIER'
            },
            craftCost: 42,
            sellPrice: 69,
            ingredients: [
                {
                    cost: 119999545.7,
                    count: 80,
                    item: {
                        tag: 'ASPECT_OF_THE_DRAGONS',
                        name: 'Sword',
                        iconUrl: 'https://sky.coflnet.com/static/icon/BARRIER'
                    }
                }
            ],
            median: -1,
            volume: 123123,
            requiredCollection: undefined,
            requiredSlayer: undefined
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
                items={crafts}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getFlipLink={craft => `https://sky.coflnet.com/item/${craft.item.tag}`}
                getItemKeyAction={craft => craft.item.tag}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
                showColumns={true}
            />
        </>
    )
}
