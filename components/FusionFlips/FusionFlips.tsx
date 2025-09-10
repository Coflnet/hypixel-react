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
        <GenericFlipList
            items={flips}
            sortOptions={SORT_OPTIONS}
            renderFlipContentAction={renderFlipContent}
            filterFunction={filterFunction}
            getItemKeyAction={flip => flip.output || `${JSON.stringify(flip)}`}
            censoredItemGenerator={censoredItemGenerator}
            premiumMessage="The top 3 flips can only be seen with starter premium or better"
            clickMessage="Click on a flip for further details"
            showColumns={true}
        />
    )
}
