'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { convertTagToName, getStyleForTier } from '../../utils/Formatter'
import Number from '../Number/Number'
import { parseKatFlip } from '../../utils/Parser/APIResponseParser'
import { writeToClipboard } from '../../utils/ClipboardUtils'
import { GenericFlipList, SortOption } from '../GenericFlipList'

interface Props {
    flips: any[]
}

const SORT_OPTIONS: SortOption<KatFlip>[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: flips => flips.sort((a, b) => b.profit - a.profit)
    },
    {
        label: 'Time ⇧',
        value: 'timeAsc',
        sortFunction: flips => flips.sort((a, b) => b.coreData.hours - a.coreData.hours)
    },
    {
        label: 'Time ⇩',
        value: 'timeDesc',
        sortFunction: flips => flips.sort((a, b) => a.coreData.hours - b.coreData.hours)
    },
    {
        label: 'Profit/Time',
        value: 'profitPerTime',
        sortFunction: flips => flips.sort((a, b) => b.profit / b.coreData.hours - a.profit / a.coreData.hours)
    }
]

export function KatFlips(props: Props) {
    const flips = useMemo(() => {
        return (props.flips ? props.flips.map(parseKatFlip) : []) as KatFlip[]
    }, [props.flips])

    function onFlipClick(flip: KatFlip, event: React.MouseEvent) {
        if (event.defaultPrevented || !flip.originAuctionUUID) {
            return
        }
        writeToClipboard('/viewauction ' + flip.originAuctionUUID)

        toast.success(
            <p>
                Copied the origin auction UUID <br />
                <i>{flip.originAuctionUUID}</i>
            </p>,
            {
                autoClose: 1500,
                pauseOnFocusLoss: false
            }
        )
    }

    function renderFlipContent(flip: KatFlip) {
        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Purchase Cost:</span>{' '}
                    <Link href={'auction/' + flip.originAuctionUUID}>
                        <Number number={Math.round(flip.purchaseCost)} /> Coins
                    </Link>
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Upgrade Cost:</span>
                    <Number number={flip.upgradeCost} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Median:</span> <Number number={Math.round(flip.median)} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Profit:</span>{' '}
                    <Link href={'auction/' + flip.referenceAuctionUUID}>
                        <Number number={flip.profit} /> Coins
                    </Link>
                </p>
                <hr />
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Volume:</span> <Number number={Math.round(flip.volume)} />
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Target Rarity:</span> <span style={getStyleForTier(flip.targetRarity)}>{flip.targetRarity}</span>
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Time:</span> {flip.coreData.hours} Hours
                </p>
                <hr />
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Material Cost:</span> <Number number={Math.round(flip.materialCost)} /> Coins
                </p>
                {flip.coreData?.materials && Object.keys(flip.coreData?.materials).length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr" }}>
                        <span style={{ width: '150px', float: 'left' }}>Material{Object.keys(flip.coreData.materials).length > 1 ? 's' : ''}:</span>
                        <div>
                            {Object.entries(flip.coreData.materials).map(([material, amount]) => {
                                return (
                                    <p key={material}>
                                        {`${amount}x ${convertTagToName(material)}`}
                                    </p>
                                )
                            })}
                        </div>
                    </div>) : null}
            </>
        )
    }

    function getFlipHeader(flip: KatFlip) {
        return (
            <span style={getStyleForTier(flip.coreData.item.tier)}>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl(flip.coreData.item) || ''}
                    height="32"
                    width="32"
                    alt=""
                    style={{ marginRight: '5px' }}
                    loading="lazy"
                />
                {convertTagToName(flip.originAuctionName) || convertTagToName(flip.coreData.item.tag)}
            </span>
        )
    }

    function filterFunction(flip: KatFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (flip.coreData.item.name?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false)
        const profitMatch = flip.profit >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(flip: KatFlip): KatFlip {
        return {
            ...flip,
            coreData: {
                amount: -1,
                hours: 69,
                item: {
                    tag: '',
                    name: 'You cheated the blur ☺',
                    tier: 'LEGENDARY',
                    iconUrl: 'https://sky.coflnet.com/static/icon/BARRIER'
                },
                materials: { 'CoflCoin': 1 }
            },
            cost: 12345,
            materialCost: 696969,
            median: 424242,
            originAuctionUUID: '',
            profit: -100000,
            purchaseCost: 1,
            referenceAuctionUUID: '',
            volume: -1,
            upgradeCost: 0,
            originAuctionName: 'You cheated the blur ☺'
        }
    }

    return (
        <GenericFlipList
            items={flips}
            sortOptions={SORT_OPTIONS}
            renderFlipContentAction={renderFlipContent}
            onFlipClick={onFlipClick}
            filterFunction={filterFunction}
            getItemKeyAction={(flip) => flip.originAuctionUUID || ''}
            censoredItemGenerator={censoredItemGenerator}
            premiumMessage="The top 3 flips can only be seen with starter premium or better"
            clickMessage="Click on a flip for further details"
        />
    )
}
