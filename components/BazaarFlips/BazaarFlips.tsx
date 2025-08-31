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
import Link from 'next/link'

const SORT_OPTIONS: SortOption<SpreadFlip>[] = [
    {
        label: 'Profit/Hour',
        value: 'profitPerHour',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.profitPerHour || 0) - (a.flip?.profitPerHour || 0))
    },
    {
        label: 'Profit ⇧',
        value: 'profitAsc',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.profitPerHour || 0) - (a.flip?.profitPerHour || 0))
    },
    {
        label: 'Profit ⇩',
        value: 'profitDesc',
        sortFunction: flips => flips.sort((a, b) => (a.flip?.profitPerHour || 0) - (b.flip?.profitPerHour || 0))
    },
    {
        label: 'Volume ⇩',
        value: 'volumeAsc',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.volume || 0) - (a.flip?.volume || 0))
    },
    {
        label: 'Price ⇧',
        value: 'priceDesc',
        sortFunction: flips => flips.sort((a, b) => (a.flip?.sellPrice || 0) - (b.flip?.sellPrice || 0))
    },
    {
        label: 'Price ⇩',
        value: 'priceAsc',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.sellPrice || 0) - (a.flip?.sellPrice || 0))
    }
]

export function BazaarFlips() {
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipBazaarSpreadQueryKey()],
        queryFn: () => getApiFlipBazaarSpread(),
    })

    function renderFlipContent(flip: SpreadFlip) {
        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Buy-order at:</span> <Number number={Math.round((flip.flip?.sellPrice || 0) * 10) / 10} />
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Sell-order at:</span>{' '}
                    <Number number={Math.round(flip.flip?.buyPrice || 0)} /> Coins
                </p>
                {flip.flip?.medianBuyPrice &&
                    <p>
                        <span style={{ width: '150px', float: 'left' }}>Median:</span> <Number number={Math.round((flip.flip?.medianBuyPrice || 0) * 10) / 10} /> Coins
                    </p>
                }
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Profit per Hour:</span>{' '}
                    <Number number={flip.flip?.profitPerHour || 0} /> Coins
                </p>
                <p>
                    <span style={{ width: '150px', float: 'left' }}>Sells/hour:</span>
                    <Number number={Math.round((flip.flip?.volume || 0) / 24)} />
                </p>
                {flip.isManipulated &&
                    <p style={{ display: 'flex', justifyContent: 'end' }}>
                        <Badge bg="info" style={{ width: '150px', float: 'left' }}>Seems Manipulated</Badge>
                    </p>
                }
            </>
        )
    }

    function onFlipClick(flip: SpreadFlip) {
        const url = `https://sky.coflnet.com/item/${flip.flip?.itemTag}`
        window.open(url, '_blank')
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
        <>
            <details><summary>These are bazaar spread based flips</summary>
                <p>the spread is the difference between buy and sell price. <br />
                    They are calculated using <code>{'({sell price}-{buy price})*{sales per week}/{hours per week}'}</code>
                    that calculation is used by most other hypixel skyblock bazaar website/mods and doesn't need data storing.<br />
                    It displays you the potential profit under perfect conditions. If you are impatient it's probably lower, but it can also be higher if you are lucky.<br />
                    We enhanced this by marking items that are probably manipulated to protect you from losing coins.
                </p>
            </details>
            <details>
                <summary>How do we detect manipulated items?</summary>
                <p>Using our hypixel skyblock bazaar data archive we know what an item usually sells for. If it suddenly spikes its usually manipulated.
                    Sometimes its also because of a game update.
                    So these items are still displayed for you to make a decission on if you want to risk you coins for potentially more reward.
                </p>
            </details>
            <details>
                <summary>Why are the top 3 hidden</summary>
                <p>The manipulation detection and other features depend on our data archive.
                    To finance the archive storage, the top 3 flips are only available with starter premium.
                    You either buy any premium tier or <Link href="/linkvertise">watched an ad</Link> to  get starter premium for free
                </p>
            </details>
            <details>
                <summary>How to do these flips?</summary>
                <ol>
                    <li>Go to the skyblock bazaar and search up the item. (This is simpler if you use this list in game with /cofl bazaar)</li>
                    <li>Place a top buyorder (should be within one coin of whats displayed here)</li>
                    <li>If you don't know how much to order select fill your inventory if its an item below 10k coins, otherwise you buy a stack, make sure to not spend your whole purse at once</li>
                    <li>Wait for the order to fill, if you notice that taking long times you may want to try our premium demand based bazaar flips</li>
                    <li>Once its filled you claim the items and place the lowest sell order</li>
                </ol></details>
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                onFlipClick={onFlipClick}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={(flip) => flip.itemName || ''}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
            />
        </>
    )
}
