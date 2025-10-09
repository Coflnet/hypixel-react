'use client'
import Image from 'next/image'
import React, { useMemo } from 'react'
import api from '../../api/ApiHelper'
import { convertTagToName, getMinecraftColorCodedElement } from '../../utils/Formatter'
import Number from '../Number/Number'
import Tooltip from '../Tooltip/Tooltip'
import { CraftDetails } from './CraftDetails/CraftDetails'
import { parseProfitableCrafts } from '../../utils/Parser/APIResponseParser'
import { GenericFlipList, SortOption } from '../GenericFlipList'

interface Props {
    crafts?: any[]
    bazaarTags?: string[]
}

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
        label: 'Sell Offer (Bazaar)',
        value: 'bazaarCrafts',
        sortFunction: (crafts: ProfitableCraft[], bazaarTags: string[] = []) =>
            crafts
                .sort((a, b) => b.sellPrice - b.craftCost - (a.sellPrice - a.craftCost))
                .filter(craft => {
                    let searchFor = [...craft.ingredients.map(ingredients => ingredients.item.tag), craft.item.tag]
                    for (let i = 0; i < searchFor.length; i++) {
                        if (bazaarTags.indexOf(searchFor[i]) === -1) {
                            return false
                        }
                    }
                    return true
                })
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: crafts => crafts.sort((a, b) => b.volume - a.volume)
    }
]

export function CraftsList(props: Props) {
    const crafts = useMemo(() => (props.crafts ? parseProfitableCrafts(props.crafts) : []), [props.crafts])

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
                {craft.requiredCollection ? (
                    <p style={{ textAlign: 'right' }}>
                        <span style={{ marginRight: '10px' }}>Req. Collection:</span>
                        {convertTagToName(craft.requiredCollection.name) + ' ' + craft.requiredCollection.level}
                    </p>
                ) : null}
                {craft.requiredSlayer ? (
                    <p style={{ textAlign: 'right' }}>
                        <span style={{ marginRight: '10px' }}>Req. Slayer:</span>
                        {convertTagToName(craft.requiredSlayer.name) + ' ' + craft.requiredSlayer.level}
                    </p>
                ) : null}
                {!craft.requiredCollection && !craft.requiredSlayer ? <p style={{ textAlign: 'right' }}>No Collection/Slayer required</p> : null}
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

    // Wrapper function for rendering with tooltip
    function customItemWrapper(craft: ProfitableCraft, blur: boolean, key: string, content: React.ReactNode, flipCardClass: string) {
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
                    tooltipTitle={getCraftHeader(craft)}
                    tooltipContent={<CraftDetails craft={craft} />}
                />
            )
        }
    }

    return (
        <GenericFlipList
            items={crafts}
            sortOptions={SORT_OPTIONS}
            renderFlipContentAction={renderFlipContent}
            filterFunction={filterFunction}
            getItemKeyAction={craft => craft.item.tag}
            censoredItemGenerator={censoredItemGenerator}
            premiumMessage="The top 3 crafts can only be seen with starter premium or better"
            clickMessage="Click on a craft for further details"
            showColumns={true}
            sortFunctionArgs={[props.bazaarTags]}
            customItemWrapper={customItemWrapper}
        />
    )
}
