"use client"

import React, { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import api from '../../api/ApiHelper'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import NumberElement from '../Number/Number'
import { convertTagToName, getItemImageUrl } from '../../utils/Formatter'
import { getApiFlipMayor, getGetApiFlipMayorQueryKey } from '../../api/_generated/skyApi'
import { MayorDiffFlip } from '../../api/_generated/skyApi.schemas'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'

const SORT_OPTIONS: SortOption<MayorDiffFlip>[] = [
    {
        label: 'Expected Profit',
        value: 'expectedProfit',
        sortFunction: items => items.sort((a, b) => getExpectedProfit(b) - getExpectedProfit(a))
    },
    {
        label: 'Price Change %',
        value: 'priceChangePercent',
        sortFunction: items => items.sort((a, b) => getPriceChangePercent(b) - getPriceChangePercent(a))
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: items => items.sort((a, b) => b.volume - a.volume)
    },
    {
        label: 'Current Price',
        value: 'currentPrice',
        sortFunction: items => items.sort((a, b) => b.medianPrice - a.medianPrice)
    },
    {
        label: 'Expected Price',
        value: 'expectedPrice',
        sortFunction: items => items.sort((a, b) => b.expectedPrice - a.expectedPrice)
    }
]

function getExpectedProfit(flip: MayorDiffFlip): number {
    return flip.expectedPrice - flip.medianPrice
}

function getPriceChangePercent(flip: MayorDiffFlip): number {
    if (flip.medianPrice === 0) return 0
    return ((flip.expectedPrice - flip.medianPrice) / flip.medianPrice) * 100
}

function getItemTag(flip: MayorDiffFlip): string | null {
    return flip.itemTag ?? null
}

function getItemName(flip: MayorDiffFlip): string {
    if (flip.itemTag) {
        return convertTagToName(flip.itemTag)
    }
    return flip.itemName ?? 'Unknown Item'
}

function renderMayorFlip(flip: MayorDiffFlip) {
    const tag = getItemTag(flip)
    const imageUrl = tag ? getItemImageUrl({ tag }) : null
    const expectedProfit = getExpectedProfit(flip)
    const priceChangePercent = getPriceChangePercent(flip)

    return (
        <>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {imageUrl ? <Image src={imageUrl} alt={getItemName(flip)} width={32} height={32} loading="lazy" crossOrigin="anonymous" /> : null}
                <span>{getItemName(flip)}</span>
            </h4>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Expected Profit:</span>{' '}
                <NumberElement number={Math.round(expectedProfit)} /> Coins{' '}
                <span style={{ color: expectedProfit >= 0 ? '#00ff00' : '#ff0000' }}>
                    ({priceChangePercent >= 0 ? '+' : ''}
                    {priceChangePercent.toFixed(1)}%)
                </span>
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Current Price:</span> <NumberElement number={Math.round(flip.medianPrice)} /> Coins
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Expected Price:</span> <NumberElement number={Math.round(flip.expectedPrice)} /> Coins
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Volume:</span> <NumberElement number={Math.round(flip.volume)} />
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Based on</span>
                {flip.usedPricesAfterCurrentMayor && flip.usedPricesBeforeNextMayor
                    ? 'Current & Next Mayor'
                    : flip.usedPricesAfterCurrentMayor
                      ? 'Prices after Current Mayor'
                      : flip.usedPricesBeforeNextMayor
                        ? 'Prices on start of next mayor'
                        : 'Historic Data'}
            </p>
        </>
    )
}

function filterFunction(flip: MayorDiffFlip, nameFilter: string | null | undefined, minimumProfit: number) {
    const nameMatch = !nameFilter || getItemName(flip).toLowerCase().includes(nameFilter.toLowerCase())
    const profitMatch = getExpectedProfit(flip) >= minimumProfit
    return nameMatch && profitMatch
}

function getFlipLink(flip: MayorDiffFlip) {
    const tag = flip.itemTag
    if (!tag) {
        return undefined
    }
    return `https://sky.coflnet.com/item/${tag}`
}

function censoredFlip(): MayorDiffFlip {
    return {
        itemTag: 'SECRET_MAYOR_FLIP',
        itemName: 'Secret Mayor Flip',
        averageMayorMedianDiff: 500000,
        volume: 999,
        expectedPrice: 2000000,
        medianPrice: 1000000,
        nextMayor: 'Derpy',
        currentMayor: 'Barry',
        usedPricesAfterCurrentMayor: true,
        usedPricesBeforeNextMayor: true
    }
}

export function MayorFlips() {
    const token = (typeof window !== 'undefined' && (sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId'))) || ''

    const { data } = useSuspenseQuery({
        queryKey: [getGetApiFlipMayorQueryKey(), token],
        queryFn: () =>
            getApiFlipMayor({ headers: token ? { Authorization: `Bearer ${token}` } : {} })
    })

    const rawFlips = (data && (data as any).data) ?? []
    const safeFlips = useMemo(() => (Array.isArray(rawFlips) ? (rawFlips as MayorDiffFlip[]) : []), [rawFlips])

    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasPremium, setHasPremium] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if (typeof window === 'undefined') return

        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        if (token) {
            setIsLoggedIn(true)
            api.refreshLoadPremiumProducts(
                products => {
                    setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
                },
                () => {
                    setHasPremium(false)
                }
            )
        } else {
            setIsLoggedIn(false)
            setHasPremium(false)
        }
    }, [])

    return (
        <div>
            <p>
                Capitalize on Hypixel SkyBlock mayor election cycles with data-driven flips. Our analysis tracks historic price patterns from previous mayor
                terms to predict which items will surge or drop when the next mayor is elected. Perfect for players looking to maximize profits around election
                events.
            </p>
            {!hasPremium ? (
                <div data-nosnippet data-robots="noindex">
                    <Alert variant="warning">
                        <a
                            href="/premium"
                            rel="nofollow noopener noreferrer"
                            onClick={e => {
                                e.preventDefault()
                                router.push('/premium')
                            }}
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                            Mayor flips require having premium to view the top results. Sign in and purchase premium to unlock full mayor flip
                            predictions. Click to upgrade.
                        </a>
                    </Alert>
                </div>
            ) : null}

            <details>
                <summary>How mayor flipping works</summary>
                <ol>
                    <li>Our system analyzes historic price data from previous mayor terms to identify patterns.</li>
                    <li>
                        We calculate the average price difference for items between different mayor periods (e.g., prices during Diana vs. prices during Barry).
                    </li>
                    <li>
                        Based on the current and predicted next mayor, we estimate how item prices will change when the next mayor is elected on Hypixel
                        SkyBlock.
                    </li>
                    <li>Buy items before the election that are expected to increase in value, then sell after the new mayor takes office.</li>
                </ol>
            </details>
            <details>
                <summary>Understanding the data</summary>
                <ul>
                    <li>
                        <strong>Expected Profit:</strong> The predicted price difference between now and after the next mayor election, calculated from historic
                        price patterns.
                    </li>
                    <li>
                        <strong>Price Change %:</strong> The percentage increase or decrease expected when the next mayor is elected.
                    </li>
                    <li>
                        <strong>Current Price:</strong> The current median price on the auction house.
                    </li>
                    <li>
                        <strong>Expected Price:</strong> The predicted median price after the next mayor is elected, based on historic data.
                    </li>
                    <li>
                        <strong>Volume:</strong> Recent trading volume - higher volume means more market activity and easier buying/selling.
                    </li>
                    <li>
                        <strong>Data Source:</strong> Which historic mayor price data was used to calculate the prediction (current mayor, next mayor, or both).
                    </li>
                </ul>
            </details>
            <details>
                <summary>Tips for mayor flipping</summary>
                <ul>
                    <li>Check the mayor election calendar - flips work best when timed close to the election.</li>
                    <li>Higher volume items are safer as they're easier to buy and sell quickly.</li>
                    <li>Consider the specific perks of the next mayor - some predictions are based on known mayor abilities (e.g., Diana buffs mythological events).</li>
                    <li>Don't invest all your coins in one flip - diversify to reduce risk.</li>
                    <li>Monitor prices as the election approaches - real market conditions may differ from historic predictions.</li>
                </ul>
            </details>
            <br />
            <GenericFlipList
                items={safeFlips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderMayorFlip}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.itemTag ?? flip.itemName ?? 'unknown'}
                getFlipLink={getFlipLink}
                censoredItemGenerator={censoredFlip}
                premiumMessage="The top 3 mayor flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
                showColumns
            />
        </div>
    )
}

export default MayorFlips
