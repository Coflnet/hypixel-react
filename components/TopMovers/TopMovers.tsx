'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Form, Spinner } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { useGetApiItemsBazaarTags, useGetApiPricesChange } from '../../api/_generated/skyApi'
import { DropStatistic } from '../../api/_generated/skyApi.schemas'
import NumberElement from '../Number/Number'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import { convertTagToName, formatToPriceToShorten } from '../../utils/Formatter'

interface TopMoverEntry {
    tag: string
    stats: DropStatistic
    displayName: string
    change24h: number | null
    change24hPercent: number | null
    change30d: number | null
    isBazaar: boolean | null
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
        label: 'Largest 24h move (%)',
        value: 'absRecentPercent',
        sortFunction: items => items.sort((a, b) => Math.abs(b.change24hPercent ?? 0) - Math.abs(a.change24hPercent ?? 0))
    },
    {
        label: 'Biggest gain (24h %)',
        value: 'recentGainPercent',
        sortFunction: items =>
            items.sort((a, b) => (b.change24hPercent ?? Number.NEGATIVE_INFINITY) - (a.change24hPercent ?? Number.NEGATIVE_INFINITY))
    },
    {
        label: 'Biggest drop (24h %)',
        value: 'recentDropPercent',
        sortFunction: items =>
            items.sort((a, b) => (a.change24hPercent ?? Number.POSITIVE_INFINITY) - (b.change24hPercent ?? Number.POSITIVE_INFINITY))
    },
    {
        label: 'Highest volume',
        value: 'volume',
        sortFunction: items => items.sort((a, b) => (b.stats.volume ?? 0) - (a.stats.volume ?? 0))
    },
    {
        label: 'Biggest 24h increase × volume',
        value: 'increaseByVolume',
        sortFunction: items =>
            items.sort((a, b) => {
                const aScore = (a.change24h ?? 0) * (a.stats.volume ?? 0)
                const bScore = (b.change24h ?? 0) * (b.stats.volume ?? 0)
                return bScore - aScore
            })
    },
    {
        label: 'Biggest 24h drop × volume',
        value: 'dropByVolume',
        sortFunction: items =>
            items.sort((a, b) => {
                const aScore = Math.abs(a.change24h ?? 0) * (a.stats.volume ?? 0)
                const bScore = Math.abs(b.change24h ?? 0) * (b.stats.volume ?? 0)
                // For drops we want the largest negative moves first; since we use absolute values,
                // keep the same order as increase but label accordingly. To prefer drops specifically,
                // we could consider using -(change) * volume for strictly negative values, but
                // absolute movement * volume highlights large drops similarly to increases.
                return bScore - aScore
            })
    }
];


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

function calculatePercentChange(current?: number | null, previous?: number | null): number | null {
    if (current === null || current === undefined || previous === null || previous === undefined || previous === 0) {
        return null
    }
    if (Number.isNaN(current) || Number.isNaN(previous)) {
        return null
    }

    return ((current - previous) / previous) * 100
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

function renderPercentChange(delta?: number | null) {
    if (delta === null || delta === undefined || Number.isNaN(delta)) {
        return <span>Unknown</span>
    }

    if (delta === 0) {
        return <span>0%</span>
    }

    const color = delta > 0 ? '#55ff55' : delta < 0 ? '#ff5555' : undefined
    const sign = delta > 0 ? '+' : ''

    return <span style={{ color }}>{sign}{delta.toFixed(2)}%</span>
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
    const [showIncreasing, setShowIncreasing] = useState(true)
    const [showDecreasing, setShowDecreasing] = useState(true)
    const [showBazaar, setShowBazaar] = useState(true)
    const [showNonBazaar, setShowNonBazaar] = useState(true)

    const { data, isLoading, isError, error } = useGetApiPricesChange(undefined, {
        query: {
            refetchInterval: 60 * 1000,
            staleTime: 60 * 1000
        }
    })
    const { data: bazaarTagsData } = useGetApiItemsBazaarTags({
        query: {
            staleTime: 60 * 60 * 1000,
            refetchInterval: 60 * 60 * 1000
        }
    })

    const apiStatus = data?.status ?? null
    const bazaarTagSet = useMemo(() => {
        if (!bazaarTagsData?.data) {
            return null
        }

        return new Set(bazaarTagsData.data)
    }, [bazaarTagsData])

    const movers = useMemo<TopMoverEntry[]>(() => {
        if (!data || data.status !== 200 || !data.data) {
            return []
        }

        return Object.entries(data.data)
            .map(([tag, stats]) => {
                const displayName = convertTagToName(stats?.tag ?? tag)
                const change24h = calculateDelta(stats?.now, stats?.recent)
                const change24hPercent = calculatePercentChange(stats?.now, stats?.recent)
                const change30d = calculateDelta(stats?.now, stats?.monthly)
                return {
                    tag,
                    stats,
                    displayName,
                    change24h,
                    change24hPercent,
                    change30d,
                    isBazaar: bazaarTagSet ? bazaarTagSet.has(tag) : null
                }
            })
            .filter(entry => entry.stats && entry.change24h !== null)
    }, [bazaarTagSet, data])

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
                    <span style={{ width: '200px', float: 'left' }}>24h price change %:</span> {renderPercentChange(entry.change24hPercent)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>30d price change:</span> {renderChange(entry.change30d)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>Current price:</span> {renderCoins(entry.stats.now)}
                </p>
                <p>
                    <span style={{ width: '200px', float: 'left' }}>Market:</span>{' '}
                    <span>{entry.isBazaar === null ? 'Unknown' : entry.isBazaar ? 'Bazaar' : 'Auction House'}</span>
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

    const filterFunction = useCallback((entry: TopMoverEntry, nameFilter: string | null | undefined, minimumChange: number) => {
        const normalizedMinimum = Number(minimumChange) || 0
        const matchesName = !nameFilter || `${entry.displayName} ${entry.tag}`.toLowerCase().includes(nameFilter.toLowerCase())
        const matchesChange = Math.abs(entry.change24h ?? 0) >= normalizedMinimum
        const matchesDirection =
            (showIncreasing && (entry.change24h ?? 0) >= 0) ||
            (showDecreasing && (entry.change24h ?? 0) <= 0)

        const matchesMarket =
            entry.isBazaar === null ||
            (showBazaar && entry.isBazaar) ||
            (showNonBazaar && !entry.isBazaar)

        return matchesName && matchesChange && matchesDirection && matchesMarket
    }, [showBazaar, showDecreasing, showIncreasing, showNonBazaar])

    const customFilters = useMemo(
        () => (
            <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <span>Trend:</span>
                    <Form.Check
                        checked={showIncreasing}
                        id="top-movers-increasing"
                        label="Increasing"
                        onChange={event => setShowIncreasing(event.target.checked)}
                        type="checkbox"
                    />
                    <Form.Check
                        checked={showDecreasing}
                        id="top-movers-decreasing"
                        label="Decreasing"
                        onChange={event => setShowDecreasing(event.target.checked)}
                        type="checkbox"
                    />
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <span>Market:</span>
                    <Form.Check
                        checked={showBazaar}
                        id="top-movers-bazaar"
                        label="Bazaar"
                        onChange={event => setShowBazaar(event.target.checked)}
                        type="checkbox"
                    />
                    <Form.Check
                        checked={showNonBazaar}
                        id="top-movers-non-bazaar"
                        label="Non-bazaar"
                        onChange={event => setShowNonBazaar(event.target.checked)}
                        type="checkbox"
                    />
                </div>
            </div>
        ),
        [showBazaar, showDecreasing, showIncreasing, showNonBazaar]
    )

    function getFlipLink(entry: TopMoverEntry) {
        return entry.tag ? `https://sky.coflnet.com/item/${entry.tag}` : undefined
    }

    function censoredItemGenerator(entry: TopMoverEntry): TopMoverEntry {
        const fakeStats: DropStatistic = {
            monthly: entry.stats?.monthly ?? 0,
            recent: entry.stats?.recent ?? 0,
            tag: 'BARRIER',
            volume: 123123,
            lastUpdated: new Date().toISOString(),
            now: 69
        }

        return {
            ...entry,
            tag: '',
            displayName: '§6You cheated the blur ☺',
            stats: fakeStats,
            change24h: calculateDelta(fakeStats.now, fakeStats.recent),
            change24hPercent: calculatePercentChange(fakeStats.now, fakeStats.recent),
            change30d: calculateDelta(fakeStats.now, fakeStats.monthly),
            isBazaar: false
        }
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
                    customFilters={customFilters}
                    filterFunction={filterFunction}
                    getItemKeyAction={entry => entry.tag}
                    censoredItemGenerator={censoredItemGenerator}
                    premiumMessage="The top 3 movers can only be seen with starter premium or better"
                    clickMessage="Click on a mover to open the live item page"
                    getFlipLink={getFlipLink}
                    renderBatchSize={60}
                    initialRenderCount={60}
                    minimumPlaceholder="Minimum Movement"
                />
            ) : null}
        </div>
    )
}

export default TopMovers
