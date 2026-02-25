'use client'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { Badge } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import Number from '../Number/Number'
import { DemandSpreadFlip } from '../../api/_generated/skyApi.schemas'
import { useSuspenseQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { getApiFlipBazaarSpreadDeemand, getGetApiFlipBazaarSpreadDeemandQueryKey, type getApiFlipBazaarSpreadDeemandResponse } from '../../api/_generated/skyApi'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import Link from 'next/link'
import { formatToPriceToShorten } from '../../utils/Formatter'
import PremiumNotifier from '../Premium/PremiumNotifier'
import styles from './PremiumBazaarFlips.module.css'

const SORT_OPTIONS: SortOption<DemandSpreadFlip>[] = [
    {
        label: 'Profit/Hour',
        value: 'profitPerHour',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.currentProfitPerHour || 0) - (a.flip?.currentProfitPerHour || 0))
    },
    {
        label: 'Profit ⇧',
        value: 'profitAsc',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.currentProfitPerHour || 0) - (a.flip?.currentProfitPerHour || 0))
    },
    {
        label: 'Profit ⇩',
        value: 'profitDesc',
        sortFunction: flips => flips.sort((a, b) => (a.flip?.currentProfitPerHour || 0) - (b.flip?.currentProfitPerHour || 0))
    },
    {
        label: 'Volume ⇩',
        value: 'volumeAsc',
        sortFunction: flips => flips.sort((a, b) => (b.flip?.volume || 0) - (a.flip?.volume || 0))
    }
]

export function PremiumBazaarFlips() {
    const queryClient = useQueryClient()
    const [googleToken, setGoogleToken] = useState('')

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
    }, [])

    const { data: response } = useSuspenseQuery<getApiFlipBazaarSpreadDeemandResponse>({
        queryKey: [getGetApiFlipBazaarSpreadDeemandQueryKey(), googleToken],
        queryFn: () => getApiFlipBazaarSpreadDeemand(googleToken ? { headers: { GoogleToken: googleToken } } : undefined)
    })

    // Detect active fetches for this query (useful during login/refresh flows).
    const fetchingCount = useIsFetching({ queryKey: [getGetApiFlipBazaarSpreadDeemandQueryKey(), googleToken] })
    const isFetching = fetchingCount > 0

    const handleAfterLogin = useCallback(() => {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''
        setGoogleToken(token)
        queryClient.invalidateQueries({ queryKey: [getGetApiFlipBazaarSpreadDeemandQueryKey(), token] })
    }, [queryClient])

    if (response.status !== 200 || !Array.isArray(response.data)) {
        const messageFromApi = typeof response.data === 'string'
            ? response.data
            : (response.data && typeof response.data === 'object' && 'message' in response.data ? String((response.data as any).message) : undefined)

        const explanatorySection = (
            <div>
                <p>
                    Premium bazaar flips use real-time market data and demand analysis to provide more accurate profit estimates than traditional spread-based flips.
                </p>
                <p>
                    Unlike the regular bazaar flips that use weekly averages, premium bazaar flips analyze the <strong>current state of the market</strong> including:
                </p>
                <ul>
                    <li>Real-time buy and sell order volumes</li>
                    <li>Current demand trends and market momentum</li>
                    <li>Instant profit calculations based on actual market conditions</li>
                    <li>More accurate volume and turnover predictions</li>
                </ul>
                <p>
                    This data-intensive analysis requires premium access to our real-time bazaar tracking infrastructure.
                </p>
                <details>
                    <summary>Why are premium bazaar flips more accurate?</summary>
                    <p>
                        Traditional bazaar flips calculate profit using the spread between buy and sell orders multiplied by historical weekly sales.
                        This works well for stable items but can be misleading during market fluctuations.
                    </p>
                    <p>
                        Premium bazaar flips analyze current order book depth, recent trade velocity, and demand patterns to estimate profit
                        based on what the market is doing <em>right now</em>, not what it did last week.
                    </p>
                </details>
                <details>
                    <summary>How to perform premium bazaar flips</summary>
                    <ol>
                        <li>Pick a flip with positive current profit per hour and healthy volume</li>
                        <li>Go to the skyblock bazaar and search up the item (use /cofl bazaar in-game for faster access)</li>
                        <li>Place a top buy order (should match or be slightly above the current buy price)</li>
                        <li>Monitor the order - premium flips react to current demand, so fill times may vary</li>
                        <li>Once filled, place the lowest sell order at or slightly below the suggested sell price</li>
                    </ol>
                </details>
            </div>
        )

        return (
            <div className={styles.alertWrapper}>
                {explanatorySection}
                {!isFetching ? (
                    <PremiumNotifier messageFromApi={messageFromApi} onAfterLogin={handleAfterLogin} />
                ) : null}
            </div>
        )
    }

    const flips = response.data as DemandSpreadFlip[]

    function renderFlipContent(flip: DemandSpreadFlip) {
        return (
            <>
                <h4>{getFlipHeader(flip)}</h4>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Current Profit/Hour:</span> 
                    <Number number={Math.round(flip.flip?.currentProfitPerHour || 0)} /> Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Buy Price:</span>
                    {formatToPriceToShorten(flip.flip?.buyPrice || 0)} Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Sell Price:</span>
                    {formatToPriceToShorten(flip.flip?.sellPrice || 0)} Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Median:</span>
                    {formatToPriceToShorten(flip.flip?.medianValue || 0)} Coins
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Est. Sales/hour:</span>
                    <Number number={Math.round((flip.flip?.volume || 0) /24)} />
                </p>
                <p>
                    <span style={{ width: '180px', float: 'left' }}>Last Updated:</span>
                    {new Date(flip.flip?.timestamp || '').toLocaleString()}
                </p>
                <Badge bg="success" style={{ marginTop: '10px' }}>
                    Real-time Data
                </Badge>
            </>
        )
    }

    function onFlipClick(flip: DemandSpreadFlip) {
        const url = `https://sky.coflnet.com/item/${flip.flip?.itemTag}`
        window.open(url, '_blank')
    }

    function getFlipHeader(flip: DemandSpreadFlip) {
        return (
            <span>
                <Image
                    crossOrigin="anonymous"
                    src={api.getItemImageUrl({ tag: flip.flip?.itemTag || '' }) || ''}
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

    function filterFunction(flip: DemandSpreadFlip, nameFilter: string | null | undefined, minimumProfit: number): boolean {
        const nameMatch = !nameFilter || (flip.itemName?.toLowerCase().includes(nameFilter.toLowerCase()) ?? false)
        const profitMatch = (flip.flip?.currentProfitPerHour || 0) >= minimumProfit
        return nameMatch && profitMatch
    }

    function censoredItemGenerator(flip: DemandSpreadFlip): DemandSpreadFlip {
        return {
            ...flip,
            itemName: 'Premium Required ☺',
            flip: {
                currentProfitPerHour: -100000,
                volume: -1,
                itemTag: 'BARRIER',
                timestamp: '',
                buyPrice: 0,
                sellPrice: 0,
                medianValue: 0
            }
        }
    }

    const explanatorySection = (
        <div>
            <p>
                Premium bazaar flips leverage real-time market analysis and demand tracking to provide more accurate profit estimates.
                Unlike regular bazaar flips that rely on weekly averages, these flips use the <strong>current state of the market</strong> to calculate profits.
            </p>
            <details>
                <summary>How premium bazaar flips work</summary>
                <p>
                    These flips analyze real-time buy and sell order volumes, current demand trends, and market momentum to calculate
                    profit based on what's happening in the bazaar right now. This provides more accurate estimates than traditional
                    spread-based calculations, especially during market fluctuations.
                </p>
            </details>
            <details>
                <summary>Difference from regular bazaar flips</summary>
                <p>
                    Regular bazaar flips use: <code>{'({sell price}-{buy price})*{sales per week}/{hours per week}'}</code>
                </p>
                <p>
                    Premium bazaar flips use real-time demand data, order book depth analysis, and current trade velocity
                    to calculate profit based on actual market conditions instead of historical averages.
                </p>
            </details>
            <details>
                <summary>How to perform these flips</summary>
                <ol>
                    <li>Select a flip with positive current profit per hour and good volume</li>
                    <li>Go to the bazaar in-game (or use /cofl bazaar for quick access)</li>
                    <li>Place a competitive buy order based on current prices</li>
                    <li>Monitor order fill times - they vary based on real-time demand</li>
                    <li>Once filled, place a sell order at the suggested price</li>
                </ol>
            </details>
            <p style={{ marginTop: '15px' }}>
                <Badge bg="info">Premium Feature</Badge> Premium bazaar flips require an active premium subscription to access our real-time market data infrastructure.
            </p>
        </div>
    )

    return (
        <>
            {explanatorySection}
            <GenericFlipList
                items={flips}
                sortOptions={SORT_OPTIONS}
                onFlipClick={onFlipClick}
                getFlipLink={flip => `https://sky.coflnet.com/item/${flip.flip?.itemTag}`}
                renderFlipContentAction={renderFlipContent}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.itemName || ''}
                censoredItemGenerator={censoredItemGenerator}
                clickMessage="Click on a flip for detailed item information"
            />
        </>
    )
}
