'use client'
import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import NumberElement from '../Number/Number'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { getMinecraftColorCodedElement } from '../../utils/Formatter'
import { getApiFlipNpcReverse } from '../../api/_generated/skyApi'
import { NpcFlip } from '../../api/_generated/skyApi.schemas'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'

const SORT_OPTIONS: SortOption<NpcFlip>[] = [
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: flips => flips.sort((a, b) => (b.profit || 0) - (a.profit || 0))
    },
    {
        label: 'Profit Margin',
        value: 'profitMargin',
        sortFunction: flips => flips.sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
    },
    {
        label: 'Buy Price',
        value: 'buyPrice',
        sortFunction: flips => flips.sort((a, b) => (b.buyPrice || 0) - (a.buyPrice || 0))
    },
    {
        label: 'Last Updated',
        value: 'lastUpdated',
        sortFunction: flips => flips.sort((a, b) => {
            const aTime = new Date(a.lastUpdated).getTime()
            const bTime = new Date(b.lastUpdated).getTime()
            const safeATime = Number.isNaN(aTime) ? 0 : aTime
            const safeBTime = Number.isNaN(bTime) ? 0 : bTime
            return safeBTime - safeATime
        })
    }
]

const REFRESH_DELAY_SECONDS = 20
const REFRESH_DELAY_MS = REFRESH_DELAY_SECONDS * 1000
const RELATIVE_TIME_DIVISIONS: ReadonlyArray<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
]

function formatMargin(margin?: number | null): string {
    if (margin === null || margin === undefined || Number.isNaN(margin)) {
        return 'unknown'
    }

    const normalized = margin > 1 ? margin : margin * 100
    const fixedDigits = normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2
    return `${normalized.toFixed(fixedDigits)}%`
}

export function ReverseNpcFlips() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasPremium, setHasPremium] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)
    const [googleToken, setGoogleToken] = useState('')
    const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const relativeTimeFormatter = useMemo(() => new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }), [])

    const formatRelativeTimeFromNow = useCallback((dateInput: string | Date | null | undefined) => {
        if (!dateInput) {
            return 'unknown'
        }
        const date = new Date(dateInput)
        if (Number.isNaN(date.getTime())) {
            return 'unknown'
        }
        let duration = (date.getTime() - Date.now()) / 1000
        for (const division of RELATIVE_TIME_DIVISIONS) {
            if (Math.abs(duration) < division.amount) {
                return relativeTimeFormatter.format(Math.round(duration), division.unit)
            }
            duration /= division.amount
        }
        return relativeTimeFormatter.format(Math.round(duration), 'year')
    }, [relativeTimeFormatter])

    const getDisplayPriceValue = useCallback((value: number | null | undefined, counterpart?: number | null | undefined) => {
        const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : 0
        const otherValue = typeof counterpart === 'number' && Number.isFinite(counterpart) ? counterpart : undefined

        if (otherValue === undefined) {
            return Math.round(numericValue)
        }

        const sameRounded = Math.round(numericValue) === Math.round(otherValue)
        const difference = Math.abs(numericValue - otherValue)

        if (sameRounded && difference > 0) {
            const lowerValue = Math.min(numericValue, otherValue)
            const higherValue = Math.max(numericValue, otherValue)
            const adjustedLower = Math.floor(lowerValue * 10) / 10
            const adjustedHigher = Math.ceil(higherValue * 10) / 10
            return numericValue === lowerValue ? adjustedLower : adjustedHigher
        }

        return Math.round(numericValue)
    }, [])

    const refreshPremiumStatus = useCallback(() => {
        api.refreshLoadPremiumProducts(
            products => {
                setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
            },
            () => {
                setHasPremium(false)
            }
        )
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        if (token) {
            setIsLoggedIn(true)
            refreshPremiumStatus()
        } else {
            setIsLoggedIn(false)
        }
    }, [refreshPremiumStatus])

    const { data: response, refetch } = useQuery({
        queryKey: ['reverseNpcFlips', googleToken],
        queryFn: () => getApiFlipNpcReverse(undefined, {
            headers: {
                GoogleToken: googleToken,
            },
        }),
        enabled: !!googleToken,
        staleTime: 60 * 1000,
        retry: false,
    })

    useEffect(() => {
        if (!response) {
            setAuthError(null)
            return
        }
        if (response.status === 401) {
            setAuthError('We could not load reverse NPC flips. Please sign in again to continue.')
        } else {
            setAuthError(null)
        }
    }, [response])

    useEffect(() => {
        if (cooldown <= 0) {
            return
        }
        const timer = setTimeout(() => {
            setCooldown(prev => Math.max(prev - 1, 0))
        }, 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    useEffect(() => {
        return () => {
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current)
            }
        }
    }, [])

    const normalizedFlips = useMemo(() => {
        if (!response || response.status !== 200 || !Array.isArray(response.data)) {
            return []
        }
        return response.data
    }, [response])

    const handleAfterSignIn = useCallback(() => {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        if (token) {
            setIsLoggedIn(true)
            refreshPremiumStatus()
        }
    }, [refreshPremiumStatus])

    const handleRefresh = useCallback(async () => {
        if (!hasPremium || isRefreshing || cooldown > 0 || !googleToken) {
            return
        }
        setIsRefreshing(true)
        try {
            const refreshResponse = await getApiFlipNpcReverse({ requestRefresh: true }, {
                headers: {
                    GoogleToken: googleToken,
                },
            })
            if (refreshResponse.status !== 200) {
                setIsRefreshing(false)
                const message = refreshResponse.status === 403
                    ? 'Recalculating reverse NPC flips is a premium feature.'
                    : 'Unable to request a refresh right now. Please try again later.'
                toast.warn(message)
                return
            }
            setCooldown(REFRESH_DELAY_SECONDS)
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current)
            }
            refetchTimeoutRef.current = setTimeout(() => {
                refetch({ throwOnError: false }).finally(() => {
                    setIsRefreshing(false)
                    refetchTimeoutRef.current = null
                })
            }, REFRESH_DELAY_MS)
        } catch (error) {
            setIsRefreshing(false)
            const message = error instanceof Error && error.message
                ? `Failed to request a reverse NPC refresh: ${error.message}`
                : 'Failed to request a reverse NPC refresh. Please try again.'
            toast.error(message)
        }
    }, [cooldown, googleToken, hasPremium, isRefreshing, refetch])

    function getFlipHeader(flip: NpcFlip): React.JSX.Element {
        const tag = flip.itemId || 'BARRIER'
        const name = flip.itemName ? getMinecraftColorCodedElement(flip.itemName) : flip.itemName ?? 'Unknown Item'
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

    function renderFlipContent(flip: NpcFlip) {
        const margin = formatMargin(flip.profitMargin)
        const buyPrice = flip.buyPrice ?? 0
        const npcSellPrice = flip.npcSellPrice ?? 0
        const profit = flip.profit ?? npcSellPrice - buyPrice
        const formattedLastUpdated = formatRelativeTimeFromNow(flip.lastUpdated)

        const displayBuyPrice = getDisplayPriceValue(buyPrice, npcSellPrice)
        const displayNpcPrice = getDisplayPriceValue(npcSellPrice, buyPrice)

        let displayProfit = Math.round(profit)
        if (displayProfit === 0 && Math.abs(profit) > 0) {
            const scaledProfit = Math.round(profit * 10) / 10
            displayProfit = scaledProfit !== 0 ? scaledProfit : profit > 0 ? 0.1 : -0.1
        }

        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Market Purchase Price:</span> <NumberElement number={displayBuyPrice} /> Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>NPC Sell Price:</span> <NumberElement number={displayNpcPrice} /> Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Guaranteed Profit:</span> <NumberElement number={displayProfit} /> Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Profit Margin:</span> {margin}
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Last Updated:</span>
                    <span suppressHydrationWarning>{formattedLastUpdated}</span>
                </p>
            </>
        )
    }

    function filterFunction(flip: NpcFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (flip.itemName?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false)
        const profitMatch = (flip.profit || 0) >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(flip: NpcFlip): NpcFlip {
        return {
            ...flip,
            itemName: '§6You cheated the blur ☺',
            buyPrice: 123456,
            npcSellPrice: 654321,
            profit: 98765,
            profitMargin: 0.42,
        }
    }

    function getFlipLink(flip: NpcFlip) {
        return flip.itemId ? `https://sky.coflnet.com/item/${flip.itemId}` : undefined
    }

    return (
        <>
            {!isLoggedIn && (
                <Alert variant="info">
                    Sign in with Google to unlock the live reverse NPC flip list and premium refresh tools.
                </Alert>
            )}
            {authError && (
                <Alert variant="danger">{authError}</Alert>
            )}
            <p>
                Reverse NPC flips take advantage of skyblock items that can always be sold back to vendors for a fixed amount of coins. When the bazaar or auction house dips below that NPC value you can buy the item from other players and instantly sell it to the NPC for a guaranteed profit.
            </p>
            <details>
                <summary>How to execute a reverse NPC flip</summary>
                <ol>
                    <li>Pick an item from the list with a healthy profit margin.</li>
                    <li>Head to the Bazaar or Auction House and buy the item for the listed price or cheaper.</li>
                    <li>Claim the item and immediately sell it to the NPC that provides the guaranteed sell price.</li>
                    <li>Repeat while the market stays below the NPC sell price.</li>
                </ol>
            </details>
            <details>
                <summary>What the profit margin means</summary>
                <p>The profit margin compares the NPC sell price against the current market purchase price. Higher percentages mean more coins per purchase, but items with smaller margins might have higher volume.</p>
            </details>
            <details>
                <summary>Tips to stay profitable</summary>
                <ul>
                    <li>Use buy orders where possible to push your purchase price even lower.</li>
                    <li>Watch the last updated time to avoid stale data after major updates.</li>
                    <li>Split your coins across multiple items to avoid tanking a single market.</li>
                </ul>
            </details>
            {isLoggedIn && (
                <div className="my-3">
                    {hasPremium ? (
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <Button
                                variant="primary"
                                disabled={isRefreshing || cooldown > 0}
                                onClick={handleRefresh}
                            >
                                {isRefreshing ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                        Waiting for recalculation…
                                    </>
                                ) : cooldown > 0 ? (
                                    <>Refresh available in {cooldown}s</>
                                ) : (
                                    <>Refresh reverse NPC flips</>
                                )}
                            </Button>
                            <small className="text-muted">
                                We trigger a recalculation and fetch updated flips after {REFRESH_DELAY_SECONDS} seconds.
                            </small>
                        </div>
                    ) : (
                        <Alert variant="warning" className="mb-0">
                            Starter Premium unlocks the reverse NPC recalculation button. You can still browse the current flips below.
                        </Alert>
                    )}
                </div>
            )}
            <br />
            <GenericFlipList
                items={normalizedFlips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={(flip) => flip.itemId ?? flip.itemName ?? `${flip.npcSellPrice}-${flip.buyPrice}`}
                censoredItemGenerator={censoredItemGenerator}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
                showColumns={true}
                getFlipLink={getFlipLink}
                onAfterSignIn={handleAfterSignIn}
            />
        </>
    )
}
