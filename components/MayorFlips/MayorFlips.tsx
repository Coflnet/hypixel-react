"use client"

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { useGetApiFlipMayor, getGetApiFlipMayorQueryKey } from '../../api/_generated/skyApi'
import { Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import api from '../../api/ApiHelper'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import NumberElement from '../Number/Number'
import PremiumNotifier from '../Premium/PremiumNotifier'
import { convertTagToName } from '../../utils/Formatter'
import { MayorDiffFlip } from '../../api/_generated/skyApi.schemas'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { getGeneratedApiErrorMessage, getGeneratedApiMessage, hasSuccessfulArrayResponse, isGeneratedPremiumRequired } from '../../utils/GeneratedApiResponseUtils'

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
    const imageUrl = tag ? api.getItemImageUrl({ tag }) : null
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
    const [googleToken, setGoogleToken] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasPremium, setHasPremium] = useState(false)
    const router = useRouter()

    const loadPremiumStatus = useCallback(() => {
        api.refreshLoadPremiumProducts(
            products => {
                setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
            },
            () => {
                setHasPremium(false)
            }
        )
    }, [])

    const query = useGetApiFlipMayor({
        fetch: googleToken ? { headers: { Authorization: `Bearer ${googleToken}` } } : undefined,
        query: {
            queryKey: [...getGetApiFlipMayorQueryKey(), googleToken],
            retry: false
        }
    })
    const response = query.data
    const safeFlips = useMemo(() => (hasSuccessfulArrayResponse<MayorDiffFlip>(response) ? response.data : []), [response])
    const isAccessError = response?.status === 401 || response?.status === 403 || isGeneratedPremiumRequired(response?.data)
    const accessMessage = isAccessError ? getGeneratedApiMessage(response?.data) : null
    const errorMessage = isAccessError
        ? null
        : getGeneratedApiErrorMessage(response, query.error, 'Unable to load mayor flips right now')

    useEffect(() => {
        if (typeof window === 'undefined') return

        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        if (token) {
            setIsLoggedIn(true)
            loadPremiumStatus()
        } else {
            setIsLoggedIn(false)
            setHasPremium(false)
        }
    }, [loadPremiumStatus])

    const handleAfterLogin = useCallback(() => {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        setIsLoggedIn(Boolean(token))

        if (token) {
            loadPremiumStatus()
            return
        }

        setHasPremium(false)
    }, [loadPremiumStatus])

    // Get current and next mayor from the first flip in the list
    const currentMayor = safeFlips.length > 0 ? safeFlips[0].currentMayor : null
    const nextMayor = safeFlips.length > 0 ? safeFlips[0].nextMayor : null

    return (
        <div>
            <p>
                Capitalize on Hypixel SkyBlock mayor election cycles with data-driven flips. Our analysis tracks historic price patterns from previous mayor
                terms to predict which items will surge or drop when the next mayor is elected. Perfect for players looking to maximize profits around election
                events.
            </p>
            {!hasPremium && !isAccessError ? (
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
                            Mayor flips require having premium to view the top results. {isLoggedIn ? 'Upgrade to unlock the full mayor flip predictions.' : 'Sign in and purchase premium to unlock the full mayor flip predictions.'}
                        </a>
                    </Alert>
                </div>
            ) : null}
            {isAccessError ? (
                <div data-nosnippet data-robots="noindex">
                    <PremiumNotifier
                        title="Mayor flips are a premium feature"
                        messageFromApi={isLoggedIn ? accessMessage : null}
                        onAfterLogin={handleAfterLogin}
                        variant="warning"
                    >
                        <p>
                            Mayor flip predictions are part of the premium tools on CoflNet.
                        </p>
                        <p>
                            {isLoggedIn
                                ? 'You are signed in, but this account still needs starter premium or better to load the mayor flip list.'
                                : 'Sign in with Google below to load mayor flips for your account and check whether you already have premium access.'}
                        </p>
                    </PremiumNotifier>
                </div>
            ) : null}
            {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}

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
            {currentMayor || nextMayor ? (
                <div style={{ 
                    padding: '15px', 
                    marginBottom: '20px',
                    border: '1px solid #dee2e6', 
                    borderRadius: '5px'
                }}>
                    <h4 style={{ marginBottom: '10px' }}>Mayor Information</h4>
                    {currentMayor && (
                        <p style={{ marginBottom: '5px' }}>
                            <strong>Current Mayor:</strong> {currentMayor}
                        </p>
                    )}
                    {nextMayor && (
                        <p style={{ marginBottom: '0' }}>
                            <strong>Next Mayor:</strong> {nextMayor}
                        </p>
                    )}
                </div>
            ) : null}
            {query.isLoading && !response ? (
                <Alert variant="info">Loading mayor flips…</Alert>
            ) : !errorMessage && !isAccessError ? (
                <>
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
                </>
            ) : null}
        </div>
    )
}

export default MayorFlips
