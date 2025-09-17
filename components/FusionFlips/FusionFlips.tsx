'use client'
import Image from 'next/image'
import React from 'react'
import api from '../../api/ApiHelper'
import { convertTagToName } from '../../utils/Formatter'
import Number from '../Number/Number'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getApiFlipFusion, getGetApiFlipFusionQueryKey } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { FuseFlip } from '../../api/_generated/skyApi.schemas'

const SORT_OPTIONS: SortOption<FuseFlip>[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: (crafts: FuseFlip[]) => crafts.sort((a, b) => b.outputValue - b.inputCost - (a.outputValue - a.inputCost))
    },
    {
        label: 'Output Value',
        value: 'outputValue',
        sortFunction: (crafts: FuseFlip[]) => crafts.sort((a, b) => b.outputValue - a.outputValue)
    },
    {
        label: 'Input Cost',
        value: 'inputCost',
        sortFunction: (crafts: FuseFlip[]) => crafts.sort((a, b) => b.inputCost - a.inputCost)
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: crafts => crafts.sort((a, b) => b.volume - a.volume)
    }
]

export function FusionFlips() {
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipFusionQueryKey()],
        queryFn: () => getApiFlipFusion(),
    })

    function renderFlipContent(flip: FuseFlip) {
        return (
            <>
                <h4>{getCraftHeader(flip)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Input Cost:</span> <Number number={Math.round(flip.inputCost)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Output Value:</span> <Number number={Math.round(flip.outputValue)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Output Count:</span> <Number number={Math.round(flip.outputCount)} />
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Volume:</span> <Number number={Math.round(flip.volume)} />
                </p>
                <hr />
                {flip.inputs ? Object.keys(flip.inputs).map(input => {
                    return <p key={input}>
                        <Image
                            crossOrigin="anonymous"
                            src={api.getItemImageUrl({
                                tag: input
                            }) || ''}
                            height="24"
                            width="24"
                            alt=""
                            style={{ marginRight: '5px' }}
                            loading="lazy"
                        />
                        {convertTagToName(input) + ' (' + flip.inputs![input] + 'x)'}
                    </p>
                }) : null}
            </>
        )
    }

    function getCraftHeader(flip: FuseFlip): React.JSX.Element {
        if (!flip.output) {
            return <span>-</span>
        }
        return <div>
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({
                        tag: flip.output
                    }) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {convertTagToName(flip.output)}
            </span>
        </div>
    }

    function filterFunction(flip: FuseFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        let nameMatch = true;
        let inputs = flip.inputs ? Object.keys(flip.inputs).map(input => convertTagToName(input).toLowerCase()) : [];
        let outputMatch = flip.output && nameFilter ? convertTagToName(flip.output).toLowerCase().includes(nameFilter.toLowerCase()) : false;
        if (nameFilter && !inputs.find(input => nameFilter && input.includes(nameFilter.toLowerCase())) && !outputMatch) {
            nameMatch = false;
        }
        const profitMatch = flip.outputValue - flip.inputCost >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(): FuseFlip {
        return {
            inputCost: 42,
            outputCount: 69,
            outputValue: 123123,
            volume: 123123,
        }
    }

    return (
        <>
            <p>
                This is a curated list of profitable Fusion Flips in Hypixel SkyBlock — find opportunities to fuse shards and sell the fused shard for a profit.
                The list highlights input cost, output value, output count and trade volume so you can quickly spot high-margin fusion flips.
                This is one of the newest Skyblock money making methods introduced with the the <strong>Galatea Foraging update</strong>.
            </p>
            <details><summary>How to do fusion flipping</summary>
                <ol>
                    <li>Pick a fusion flip that has a positive profit from the list below.</li>
                    <li>Buy order the displayed amount of each shard</li>
                    <li>Go to the fusion machine on galatea, select first one then the other shard and fuse them.</li>
                    <li>Create a sell order on the bazaar with the resulting shards</li>
                    <li>Repeat when margins and volume look healthy.</li>
                </ol>
            </details>
            <details><summary>Why Galatea Foraging matters</summary>
                <p>
                    The Galatea Foraging update introduced shards and shard fusion. The prices of shards can fluctuate widly throughout the week and create new fusion flipping opportunities giving you the chance to profit from these changes.
                </p>
            </details>
            <details><summary>What do the columns mean?</summary>
                <p>
                    <strong>Input Cost:</strong> Estimated total cost to obtain all inputs required for the fusion.
                </p>
                <p>
                    <strong>Output Value:</strong> Typical market value of the fused item. A useful proxy for expected sale price.
                </p>
                <p>
                    <strong>Output Count:</strong> How many items the craft produces.
                </p>
                <p>
                    <strong>Volume:</strong> Estimated daily sales (higher volume = easier to sell).
                </p>
            </details>
            <br />
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.output || `${JSON.stringify(flip)}`}
                getFlipLink={(flip) => flip.output ? `https://sky.coflnet.com/item/${flip.output}` : undefined}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
                showColumns={true}
            />
        </>
    )
}
