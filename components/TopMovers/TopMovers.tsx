'use client'

import React, { useMemo } from 'react'
import { Alert, Spinner } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { useGetApiPricesChange } from '../../api/_generated/skyApi'
import { DropStatistic } from '../../api/_generated/skyApi.schemas'
import NumberElement from '../Number/Number'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { convertTagToName, formatToPriceToShorten } from '../../utils/Formatter'

interface TopMoverEntry {
    tag: string
    stats: DropStatistic
    displayName: string
    change24h: number | null
    change30d: number | null
}

const SORT_OPTIONS: SortOption<TopMoverEntry>[] = [
    {
        label: 'Largest 24h move',
        value: 'absRecent',
        sortFunction: items => items.sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
    },
    {
        label: 'Biggest gain (24h)',
        value: 'recentGain',
        sortFunction: items => items.sort((a, b) => (b.change24h ?? Number.NEGATIVE_INFINITY) - (a.change24h ?? Number.NEGATIVE_INFINITY))
    },
    {
        label: 'Biggest drop (24h)',
        value: 'recentDrop',
        sortFunction: items => items.sort((a, b) => (a.change24h ?? Number.POSITIVE_INFINITY) - (b.change24h ?? Number.POSITIVE_INFINITY))
    },
    {
        label: 'Highest volume',
        value: 'volume',
        sortFunction: items => items.sort((a, b) => (b.stats.volume ?? 0) - (a.stats.volume ?? 0))
    }
]

const RELATIVE_TIME_DIVISIONS: ReadonlyArray<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
]

const SHORT_NUMBER_UNITS = [{ mult: 1e12 }, { mult: 1e9 }, { mult: 1e6 }, { mult: 1e3 }, { mult: 1 }]

function calculateDelta(current?: number | null, previous?: number | null): number | null {
    if (current === null || current === undefined || previous === null || previous === undefined) {
        return null
    }
    if (Number.isNaN(current) || Number.isNaN(previous)) {
        return null
    }
    return current - previous
}

function getShortNumberDecimals(value: number): number {
    const absValue = Math.abs(value)
    if (absValue === 0) {
        return 0
    }
    const unit = SHORT_NUMBER_UNITS.find(u => absValue >= u.mult) ?? SHORT_NUMBER_UNITS[SHORT_NUMBER_UNITS.length - 1]
    const normalized = absValue / unit.mult
    const integerDigits = normalized >= 1 ? Math.floor(Math.log10(normalized)) + 1 : 1
    if (integerDigits >= 3) {
        return 0
    }
    if (integerDigits === 2) {
        return 1
    }
    return 2
}

function formatRelativeTimeFromNow(dateInput?: string | Date | null): string {
    if (!dateInput) {
        return 'unknown'
    }

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (!date || Number.isNaN(date.getTime())) {
        return 'unknown'
    }

    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    let duration = (date.getTime() - Date.now()) / 1000

    for (const division of RELATIVE_TIME_DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            return formatter.format(Math.round(duration), division.unit)
        }
        duration /= division.amount
    }

    return formatter.format(Math.round(duration), 'year')
}

function renderChange(delta?: number | null) {
    if (delta === null || delta === undefined || Number.isNaN(delta)) {
        return <span>Unknown</span>
    }

    if (delta === 0) {
        return <span>0 Coins</span>
    }

    const color = delta > 0 ? '#55ff55' : delta < 0 ? '#ff5555' : undefined
    const sign = delta > 0 ? '+' : '-'
    const decimals = getShortNumberDecimals(delta)
    const formatted = formatToPriceToShorten(Math.abs(delta), decimals)

    return (
        <span style={{ color }}>
            {sign}
            {formatted} Coins
        </span>
    )
}

function renderCoins(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return <span>Unknown</span>
    }

    return (
        <span>
            <NumberElement number={value} /> Coins
        </span>
    )
}

function renderVolume(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return <span>Unknown</span>
    }

    return <NumberElement number={value} />
}

export function TopMovers() {
    const { data, isLoading, isError, error } = useGetApiPricesChange(undefined, {
        query: {
            refetchInterval: 60 * 1000,
            staleTime: 60 * 1000
        }
    })

    const apiStatus = data?.status ?? null

    const movers = useMemo<TopMoverEntry[]>(() => {
        if (!data || data.status !== 200 || !data.data) {
            return []
        }

        return Object.entries(data.data)
            .map(([tag, stats]) => {
                const displayName = convertTagToName(stats?.tag ?? tag)
                const change24h = calculateDelta(stats?.now, stats?.recent)
                const change30d = calculateDelta(stats?.now, stats?.monthly)
                return {
                    tag,
                    stats,
                    displayName,
                    change24h,
                    change30d
                }
            })
            .filter(entry => entry.stats && entry.change24h !== null)
    }, [data])

    const lastUpdatedText = useMemo(() => {
        if (movers.length === 0) {
            return null
        }
        const newest = movers.reduce<Date | null>((acc, entry) => {
            const current = entry.stats.lastUpdated ? new Date(entry.stats.lastUpdated) : null
            if (!current || Number.isNaN(current.getTime())) {
                return acc
            }
            if (!acc || current > acc) {
                return current
            }
            return acc
        }, null)

        return newest ? formatRelativeTimeFromNow(newest) : null
    }, [movers])

    const errorMessage = useMemo(() => {
        if (isError) {
            return error instanceof Error ? error.message : 'Failed to load price changes.'
        }
        if (apiStatus && apiStatus !== 200) {
            return `The price change API responded with status ${apiStatus}.`
        }
        return null
    }, [apiStatus, error, isError])

    function renderFlipContent(entry: TopMoverEntry) {
        const imageTag = entry.stats.tag ?? entry.tag
        const imageItem: Item = { tag: imageTag }
        const imageUrl = api.getItemImageUrl(imageItem) || ''

        return (
            <>
                <h4>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <img src={imageUrl} alt={entry.displayName} style={{ width: 32, height: 32, verticalAlign: 'middle' }} loading="lazy" />
                        <span>{entry.displayName}</span>
                    </span>
                </h4>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>24h price change:</span> {renderChange(entry.change24h)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>30d price change:</span> {renderChange(entry.change30d)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>Current price:</span> {renderCoins(entry.stats.now)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>24h traded volume:</span> {renderVolume(entry.stats.volume)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>Last updated:</span>{' '}
                    <span suppressHydrationWarning>{formatRelativeTimeFromNow(entry.stats.lastUpdated)}</span>
                </p>
            </>
        )
    }

    function filterFunction(entry: TopMoverEntry, nameFilter: string | null | undefined, minimumChange: number) {
        const normalizedMinimum = Number(minimumChange) || 0
        const matchesName = !nameFilter || `${entry.displayName} ${entry.tag}`.toLowerCase().includes(nameFilter.toLowerCase())
        const matchesChange = Math.abs(entry.change24h ?? 0) >= normalizedMinimum
        return matchesName && matchesChange
    }

    function getFlipLink(entry: TopMoverEntry) {
        return entry.tag ? `https://sky.coflnet.com/item/${entry.tag}` : undefined
    }

    return (
        <div>
            <p>
                Track the biggest Hypixel SkyBlock price movers from the last 24 hours. Filter by name, require a minimum coin swing, and click any row to jump
                straight to the live item details.
                <br />
                Profit of price swings on items, but beware sometimes prices won't recover for a long time.
            </p>
            {lastUpdatedText && (
                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                    Most recent data update: <span suppressHydrationWarning>{lastUpdatedText}</span>
                </p>
            )}
            {isLoading && movers.length === 0 ? (
                <div className="d-flex align-items-center gap-2">
                    <Spinner animation="border" role="status" size="sm" />
                    <span>Loading top movers…</span>
                </div>
            ) : null}
            {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
            {!isLoading && !errorMessage && movers.length === 0 ? <Alert variant="info">No recent price movers found. Try again shortly.</Alert> : null}
            {movers.length > 0 ? (
                <GenericFlipList
                    items={movers}
                    sortOptions={SORT_OPTIONS}
                    renderFlipContentAction={renderFlipContent}
                    filterFunction={filterFunction}
                    getItemKeyAction={entry => entry.tag}
                    clickMessage="Click on a mover to open the live item page"
                    getFlipLink={getFlipLink}
                    renderBatchSize={60}
                    initialRenderCount={60}
                />
            ) : null}
        </div>
    )
}

export default TopMovers
