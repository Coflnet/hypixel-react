'use client'
import Image from 'next/image'
import React, { useMemo } from 'react'
import api from '../../api/ApiHelper'
import { convertTagToName, getMinecraftColorCodedElement } from '../../utils/Formatter'
import Number from '../Number/Number'
import Tooltip from '../Tooltip/Tooltip'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipNpc, getGetApiFlipNpcQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { parseProfitableCrafts } from '../../utils/Parser/APIResponseParser'
import { CraftDetails } from '../CraftsList/CraftDetails/CraftDetails'

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
        queryFn: () => getApiFlipNpc(),
    })

    const crafts = useMemo(() => flips ? parseProfitableCrafts(flips) : [], [flips])

    function renderFlipContent(craft: ProfitableCraft) {
        return (
            <>
                <h4>{getCraftHeader(craft)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Crafting Cost:</span> <Number number={Math.round(craft.craftCost)} /> Coins
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
        <GenericFlipList
            items={crafts}
            sortOptions={SORT_OPTIONS}
            renderFlipContentAction={renderFlipContent}
            filterFunction={filterFunction}
            getItemKeyAction={(craft) => craft.item.tag}
            censoredItemGenerator={censoredItemGenerator}
            premiumMessage="The top 3 flips can only be seen with starter premium or better"
            clickMessage="Click on a flip for further details"
            showColumns={true}
        />
    )
}
