'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import ReactECharts from 'echarts-for-react'
import { useEffect, useRef, useState } from 'react'
import useRotatingMessages from '../../../hooks/useRotatingMessages'
import api from '../../../api/ApiHelper'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { AUCTION_GRAPH_LEGEND_SELECTION } from '../../../utils/SettingsUtils'
import ActiveAuctions from '../../ActiveAuctions/ActiveAuctions'
import ItemFilter, { getPrefillFilter } from '../../ItemFilter/ItemFilter'
import { DateRange, ItemPriceRange } from '../../ItemPriceRange/ItemPriceRange'
import { getValidatedRange, useValidRange } from '../../../hooks/useValidRange'
import Number from '../../Number/Number'
import GoogleSignIn from '../../GoogleSignIn/GoogleSignIn'
import RecentAuctions from '../../RecentAuctions/RecentAuctions'
import MarketAnalysis from '../../MarketAnalysis/MarketAnalysis'
import ShareButton from '../../ShareButton/ShareButton'
import SubscribeButton from '../../SubscribeButton/SubscribeButton'
import QuickDateSelect from './QuickDateSelect'
import styles from './AuctionHousePriceGraph.module.css'
import graphConfig from './PriceGraphConfig'
import { applyMayorDataToChart } from '../../../utils/GraphUtils'
import EChartsReact from 'echarts-for-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useGetApiItemPriceItemTagHistoryYear } from '../../../api/_generated/skyApi'
import Link from 'next/link'
import { v4 as generateUUID } from 'uuid'
import { useGetApiMayor } from '../../../api/_generated/skyApi'
import type { PriceStatistics, CoflnetSkyMayorModelsModelElectionPeriod, AuctionPreview, GetApiItemPriceItemTagHistoryYearParams } from '../../../api/_generated/skyApi.schemas'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import NitroAdSlot from '../../Ads/NitroAdSlot'
import { getItemFilterFromUrl } from '../../../utils/Parser/URLParser'

const HOUR_IN_MS = 60 * 60 * 1000

const normaliseMayorRange = (start: Date, end: Date) => {
    let from = new Date(start.getTime())
    let to = new Date(end.getTime())

    if (to < from) {
        ;[from, to] = [to, from]
    }

    from.setMinutes(0, 0, 0)
    to.setMinutes(0, 0, 0)

    if (to.getTime() <= from.getTime()) {
        to = new Date(from.getTime() + HOUR_IN_MS)
    } else if (to.getTime() < end.getTime()) {
        to = new Date(to.getTime() + HOUR_IN_MS)
    }

    return { from, to }
}

type YearStatistics = PriceStatistics & {
    isPremiumRequired?: boolean
    recentAuctions?: AuctionPreview[]
}

// Base empty statistics object used for premium/preview placeholders.
// Created once so identical objects are not duplicated inline.
const EMPTY_YEAR_STATISTICS_BASE: YearStatistics = {
    averageSellTimeSeconds: 0,
    totalAuctionsSold: 0,
    totalListed: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalBids: 0,
    totalCoinsTransferred: 0,
    totalAuctions: 0,
    totalItemsSold: 0,
    binCount: 0
}

interface Props {
    item: Item
}

type GraphPrice = { time: Date | string; avg: number; min: number; max: number; volume: number }

function getAveragePrice(prices: GraphPrice[]) {
    return prices.length ? Math.round(prices.reduce((sum, price) => sum + price.avg, 0) / prices.length) : 0
}

function createChartOptions(previous: typeof graphConfig, prices: GraphPrice[]) {
    const values = ['avg', 'min', 'max', 'volume'] as const
    return {
        ...previous,
        xAxis: previous.xAxis.map(axis => ({ ...axis, data: prices.map(price => new Date(price.time).getTime()) })),
        series: previous.series.map((series, index) => ({
            ...series,
            data: index < values.length ? prices.map(price => price[values[index]].toFixed(2)) : [],
            markArea: undefined
        }))
    }
}

function AuctionHousePriceGraph(props: Props) {
    const mounted = useRef(false)
    const requestVersion = useRef(0)
    const searchParams = useSearchParams()
    const [fetchspan, setFetchspan] = useValidRange()
    const [isLoading, setIsLoading] = useState(false)
    const [noDataFound, setNoDataFound] = useState(false)
    const [avgPrice, setAvgPrice] = useState(0)
    const [filters, setFilters] = useState([] as FilterOptions[])
    const [itemFilter, setItemFilter] = useState<ItemFilter>()
    const [defaultRangeSwitch, setDefaultRangeSwitch] = useState(true)
    const [chartOptions, setChartOptions] = useState(graphConfig)
    const [mayorData, setMayorData] = useState<MayorData[]>([])
    const [rangeSelectKey, setRangeSelectKey] = useState(() => generateUUID())
    const [hasPremium, setHasPremium] = useState(false)
    const [yearStatistics, setYearStatistics] = useState<YearStatistics | null>(null)
    const [yearServerError, setYearServerError] = useState<string | null>(null)
    const [customStartDate, setCustomStartDate] = useState<string>('')
    const [customEndDate, setCustomEndDate] = useState<string>('')
    const [mayorPeriods, setMayorPeriods] = useState<CoflnetSkyMayorModelsModelElectionPeriod[]>([])
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
    const [isYearLoading, setIsYearLoading] = useState(false)
    const [yearParams, setYearParams] = useState<(GetApiItemPriceItemTagHistoryYearParams & Record<string, unknown>) | undefined>(undefined)
    const [yearFetchOptions, setYearFetchOptions] = useState<RequestInit | undefined>(undefined)
    const loadingMessage = useRotatingMessages(
        isYearLoading,
        [
            'Loading year history data... This might take a while! 📊',
            'Crunching numbers from the past year... Stay tuned! 🔢',
            "Fetching auction data... It's a lot of information! 📈",
            'Almost there! Processing historical market trends... 📋',
            'Loading complete market analysis... Worth the wait! 🎯',
            'Gathering seller and buyer statistics... Hang tight! 👥',
            "Fun fact: We're processing millions of auction records! 🎪",
            'Did you know? Year data includes every single transaction! 💰'
        ],
        10000
    )
    const graphRef = useRef<EChartsReact>(null)
    const router = useRouter()
    const pathname = usePathname()

    const isSignedIn = typeof window !== 'undefined' && !!sessionStorage.getItem('googleId')

    const fetchspanRef = useRef(fetchspan)
    fetchspanRef.current = fetchspan
    const initialUrlFilter = useRef<string | null>(null)

    useEffect(() => {
        mounted.current = true

        setSelectedLegendOptionsFromLocalStorage()

        return () => {
            mounted.current = false
            requestVersion.current++
        }
    }, [])

    useEffect(() => {
        loadFilters().then(filters => {
            const requestedRange = getValidatedRange(searchParams.get('range'))
            const prefilledFilter = getPrefillFilter(filters)
            initialUrlFilter.current = Object.keys(getItemFilterFromUrl()).length > 0 ? JSON.stringify(prefilledFilter) : null
            setFetchspan(requestedRange)
            setItemFilter(prefilledFilter)
            setFilters(filters)
            if (props.item) {
                updateChart(requestedRange, prefilledFilter)
            }
        })
    }, [props.item.tag])

    function handleAfterLoginForPremium() {
        api.getPremiumProducts()
            .then(products => {
                const ok = hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM)
                setHasPremium(ok)
                if (ok) {
                    updateChart(DateRange.YEAR, itemFilter)
                }
            })
            .catch(() => { })
    }

    const now = new Date()
    const lookbackStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1)
    const { from: currentMayorFrom, to: currentMayorTo } = normaliseMayorRange(lookbackStart, now)

    const mayorParams =
        fetchspan === DateRange.YEAR
            ? {
                from: currentMayorFrom.toISOString(),
                to: currentMayorTo.toISOString()
            }
            : undefined

    const mayorQuery = useGetApiMayor(mayorParams, { query: { enabled: fetchspan === DateRange.YEAR } })

    useEffect(() => {
        if (mayorQuery.data) {
            const periods = mayorQuery.data.data || []
            const sortedPeriods = periods.sort((a, b) => new Date(b.start as string).getTime() - new Date(a.start as string).getTime())
            setMayorPeriods(sortedPeriods)
        } else if (mayorQuery.error) {
            console.error(mayorQuery.error)
        }
    }, [mayorQuery.data, mayorQuery.error])

    const authKey = yearFetchOptions?.headers ? yearFetchOptions.headers : null
    const yearQuery = useGetApiItemPriceItemTagHistoryYear(props.item.tag, yearParams, {
        query: {
            enabled: isYearLoading,
            queryKey: ['yearHistory', props.item.tag, yearParams ?? null, authKey]
        },
        fetch: yearFetchOptions
    })

    useEffect(() => {
        if (!isYearLoading) return

        if (yearQuery.data) {
            const response = yearQuery.data

            if (!mounted.current || fetchspanRef.current !== DateRange.YEAR) {
                setIsYearLoading(false)
                return
            }

            setIsYearLoading(false)
            setYearServerError(null)
            const data = response.data as (YearStatistics & {
                trace?: string
                slug?: string
                premiumRequired?: boolean
                error?: string
            }) | undefined
            const status = response.status as number | undefined

            // Server error (500+): show support message instead of premium overlay
            if (status && status >= 500) {
                const trace = data?.trace || data?.slug || ''
                setIsLoading(false)
                setYearServerError(
                    trace
                        ? `An unexpected server error occurred (Reference: ${trace}). Please contact support with this reference.`
                        : 'An unexpected server error occurred. Please contact support.'
                )
                setNoDataFound(false)
                setYearStatistics(null)
                setAvgPrice(0)
                return
            }

            // Premium required: only when backend explicitly says so
            if (
                (status === 401 || status === 403) ||
                (data && typeof data === 'object' && (data.slug === 'premium_required' || data.isPremiumRequired || data.premiumRequired || data.error === 'premium_required'))
            ) {
                setIsLoading(false)
                setYearStatistics({ ...EMPTY_YEAR_STATISTICS_BASE, isPremiumRequired: true })
                setNoDataFound(false)
                setAvgPrice(0)
                return
            }

            if (data && typeof data === 'object' && 'prices' in data) {
                setYearStatistics(data)

                const prices = getYearPrices(data)
                setAvgPrice(getAveragePrice(prices))
                setIsLoading(false)
                setNoDataFound(prices.length === 0)
                setChartOptions(previous => createChartOptions(previous, prices))
            } else {
                setIsLoading(false)
                setNoDataFound(true)
                setAvgPrice(0)
                setYearStatistics(null)
            }
        } else if (yearQuery.error) {
            const e = yearQuery.error as {
                status?: number
                message?: string
                trace?: string
                response?: { status?: number; data?: { trace?: string } }
            }
            console.error(e)
            setIsYearLoading(false)
            setIsLoading(false)
            setYearServerError(null)

            const status = e?.status || e?.response?.status
            const is401 = status === 401 || (e?.message && /\b401\b/.test(e.message))
            const is500 = (status ?? 0) >= 500

            if (is500) {
                const trace = e?.trace || e?.response?.data?.trace || ''
                setYearServerError(
                    trace
                        ? `An unexpected server error occurred (Reference: ${trace}). Please contact support with this reference.`
                        : 'An unexpected server error occurred. Please contact support.'
                )
                setNoDataFound(false)
                setYearStatistics(null)
            } else if (is401 || (e?.message && e.message.includes('premium'))) {
                setYearStatistics({ ...EMPTY_YEAR_STATISTICS_BASE, isPremiumRequired: true })
                setNoDataFound(false)
            } else {
                setNoDataFound(true)
                setYearStatistics(null)
            }
            setAvgPrice(0)
        }
    }, [yearQuery.data, yearQuery.error, isYearLoading])

    function getYearPrices(data: YearStatistics) {
        if (!customStartDate && !customEndDate) return data.prices || []
        const start = customStartDate ? new Date(customStartDate) : new Date(0)
        const end = customEndDate ? new Date(customEndDate) : new Date()
        return (data.prices || []).filter(price => {
            const time = new Date(price.time)
            return time >= start && time <= end
        })
    }

    const updateChart = (fetchspan: DateRange, itemFilter?: ItemFilter) => {
        const version = ++requestVersion.current
        setYearStatistics(null)
        setYearServerError(null)
        setIsYearLoading(false)
        setNoDataFound(false)
        setAvgPrice(0)
        setIsLoading(false)
        if (fetchspan === DateRange.ACTIVE || fetchspan === DateRange.HOUR) return

        setIsLoading(true)
        if (fetchspan === DateRange.YEAR) {
            startYearHistory(itemFilter)
            return
        }
        loadPriceHistory(fetchspan, itemFilter, version)
    }

    function startYearHistory(filter?: ItemFilter) {
        setIsYearLoading(true)
        const params = filter && Object.keys(filter).length ? { ...filter } : undefined
        const requestOptions: RequestInit = {}
        const googleId = typeof window !== 'undefined' && isSignedIn ? sessionStorage.getItem('googleId') : null
        if (googleId) {
            requestOptions.headers = { GoogleToken: googleId, 'Content-Type': 'application/json' }
        }
        setYearParams(params)
        setYearFetchOptions(requestOptions)
    }

    function isCurrentRequest(version: number) {
        return mounted.current && requestVersion.current === version
    }

    async function loadPriceHistory(range: DateRange, filter: ItemFilter | undefined, version: number) {
        try {
            const prices = await api.getItemPrices(props.item.tag, range as unknown as globalThis.DateRange, filter)
            if (!isCurrentRequest(version)) return
            const options = createChartOptions(chartOptions, prices || [])
            const annotations = prices?.length ? await loadMayorAnnotations(prices, options) : []
            if (!isCurrentRequest(version)) return
            setMayorData(annotations)
            setAvgPrice(getAveragePrice(prices || []))
            setNoDataFound(!prices?.length)
            setIsLoading(false)
            setChartOptions(options)
        } catch (error) {
            if (!isCurrentRequest(version)) return
            console.error(error)
            setIsLoading(false)
            setNoDataFound(true)
            setAvgPrice(0)
        }
    }

    async function loadMayorAnnotations(prices: Awaited<ReturnType<typeof api.getItemPrices>>, options: typeof graphConfig) {
        try {
            const annotations = await api.getMayorData(prices[0].time, prices[prices.length - 1].time)
            applyMayorDataToChart(options, annotations, 4)
            return annotations
        } catch {
            return []
        }
    }

    const onRangeChange = (timespan: DateRange) => {
        setFetchspan(timespan)
        if (itemFilter !== undefined) {
            updateChart(timespan, itemFilter)
        }
    }

    const onFilterChange = (filter: ItemFilter) => {
        setItemFilter({ ...filter })
        if (initialUrlFilter.current !== JSON.stringify(filter)) {
            initialUrlFilter.current = null
            setDefaultRangeSwitch(value => !value)
        }
        if (fetchspanRef.current !== DateRange.ACTIVE) {
            updateChart(fetchspanRef.current, filter)
        }
    }

    function loadFilters() {
        return api.getFilters(props.item.tag)
    }

    function setSelectedLegendOptionsFromLocalStorage() {
        const legendSelected = localStorage.getItem(AUCTION_GRAPH_LEGEND_SELECTION)
        setChartOptions(previous => ({
            ...previous,
            legend: { ...previous.legend, selected: legendSelected ? JSON.parse(legendSelected) : previous.legend.selected }
        }))
    }

    function onChartsEvents() {
        return {
            legendselectchanged: (e: { selected: Record<string, boolean> }) => {
                localStorage.setItem(AUCTION_GRAPH_LEGEND_SELECTION, JSON.stringify(e.selected))
            },
            datazoom: (e: { start: number; end: number }) => {
                const newChartOptions = { ...graphRef.current?.getEchartsInstance().getOption() }
                applyMayorDataToChart(newChartOptions, mayorData, 4, e)

                graphRef.current?.getEchartsInstance().setOption({
                    series: newChartOptions.series
                })
            }
        }
    }

    let graphOverlayElement = isLoading ? (
        <div className={styles.graphOverlay}>
            {isYearLoading && loadingMessage ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--bs-secondary)' }}>{loadingMessage}</p>
                </div>
            ) : (
                getLoadingElement()
            )}
        </div>
    ) : noDataFound && !isLoading ? (
        <div className={styles.graphOverlay}>
            <div style={{ textAlign: 'center' }}>
                <p>No data found</p>
            </div>
        </div>
    ) : null

    if (fetchspan === DateRange.YEAR && !isLoading && !isYearLoading) {
        if (yearServerError) {
            graphOverlayElement = (
                <div className={styles.graphOverlay} style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '42px', marginBottom: '10px' }}>⚠️</div>
                        <h5 className="text-danger mb-2">Server Error</h5>
                        <p className="text-light mb-3">
                            {yearServerError}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                            <a href="https://discord.gg/wvKXSHt" target="_blank" rel="noopener noreferrer">
                                <button className="btn btn-sm btn-info">Ask for Support</button>
                            </a>
                            <button
                                className="btn btn-sm btn-outline-light"
                                onClick={() => {
                                    setYearServerError(null)
                                    updateChart(DateRange.YEAR, itemFilter)
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )
        } else if (!hasPremium && (yearStatistics?.isPremiumRequired || !isSignedIn)) {
            graphOverlayElement = (
                <div className={styles.graphOverlay} style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '42px', marginBottom: '10px' }}>🔒</div>
                        <h5 className="text-warning mb-2">Year view requires Premium</h5>
                        <p className="text-light mb-3">
                            Detailed year statistics are a premium feature. Sign in to check your access or visit the premium page to learn more.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                            {!isSignedIn ? (
                                <GoogleSignIn onAfterLogin={handleAfterLoginForPremium} />
                            ) : (
                                <>
                                    <Link href="/premium?tier=premium">
                                        <button className="btn btn-sm btn-warning">Go to Premium</button>
                                    </Link>
                                    <button
                                        className="btn btn-sm btn-outline-light"
                                        onClick={() => {
                                            updateChart(DateRange.YEAR, itemFilter)
                                        }}
                                    >
                                        Retry
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )
        }
    }

    return (
        <div>
            <ItemFilter filters={filters} onFilterChange={onFilterChange} showModAdvert={true} showFilterInfoElement={true} />
            <ItemPriceRange
                key={rangeSelectKey}
                setToDefaultRangeSwitch={defaultRangeSwitch}
                onRangeChange={onRangeChange}
                disableAllTime={itemFilter && JSON.stringify(itemFilter) !== '{}'}
                disableYear={false}
                item={props.item}
                dateRangesToDisplay={
                    itemFilter && JSON.stringify(itemFilter) !== '{}'
                        ? [DateRange.ACTIVE, DateRange.DAY, DateRange.WEEK, DateRange.MONTH, DateRange.YEAR]
                        : [DateRange.ACTIVE, DateRange.DAY, DateRange.WEEK, DateRange.MONTH, DateRange.ALL]
                }
            />

            {fetchspan === DateRange.YEAR && (
                <QuickDateSelect
                    mayorPeriods={mayorPeriods}
                    itemFilter={itemFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    showCustomDatePicker={showCustomDatePicker}
                    setCustomStartDate={setCustomStartDate}
                    setCustomEndDate={setCustomEndDate}
                    setShowCustomDatePicker={setShowCustomDatePicker}
                    updateChart={updateChart}
                />
            )}

            <div style={fetchspan === DateRange.ACTIVE ? { display: 'none' } : {}}>
                <div className={styles.chartWrapper}>
                    {!isLoading && !noDataFound && !yearServerError && !(fetchspan === DateRange.YEAR && !hasPremium && (yearStatistics?.isPremiumRequired || !isSignedIn)) ? (
                        <ReactECharts option={chartOptions} className={styles.chart} ref={graphRef} onEvents={onChartsEvents()} />
                    ) : (
                        graphOverlayElement
                    )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div />
                    <div className='text-center'>
                        <b>Avg Price:</b>{' '}
                        {isLoading ? (
                            '-'
                        ) : (
                            <span>
                                <Number number={avgPrice} /> Coins
                            </span>
                        )}
                    </div>

                    <div className="d-flex align-items-center" style={{ gap: '8px', minWidth: '220px', justifyContent: 'flex-end' }}>
                        <SubscribeButton type="item" topic={props.item.tag} currentPrice={avgPrice || undefined} defaultFilter={itemFilter} />
                        <ShareButton
                            title={'Prices for ' + props.item.name}
                            text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock"
                        />
                    </div>
                </div>

                {fetchspan === DateRange.YEAR && yearStatistics && !yearStatistics.isPremiumRequired && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bs-secondary)', borderRadius: '5px' }}>
                        <h6 style={{ marginBottom: '15px', color: 'var(--bs-warning)' }}>📊 Statistics Summary</h6>

                        <div className="row">
                            <div className="col-md-6">
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>📈 Total Auctions:</strong> <Number number={yearStatistics.totalAuctions || 0} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>💰 Total Coins Transferred:</strong> <Number number={yearStatistics.totalCoinsTransferred || 0} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>🏪 Total Sellers:</strong> <Number number={yearStatistics.totalSellers || 0} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>🛒 Total Buyers:</strong> <Number number={yearStatistics.totalBuyers || 0} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>📦 Items Sold:</strong> <Number number={yearStatistics.totalItemsSold || 0} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>⚡ BIN Count:</strong> <Number number={yearStatistics.binCount || 0} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>🎯 Total Bids:</strong> <Number number={yearStatistics.totalBids || 0} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>⏱️ Avg Sell Time:</strong>{' '}
                                    {yearStatistics.averageSellTimeSeconds
                                        ? `${Math.round(yearStatistics.averageSellTimeSeconds / 3600)} hours`
                                        : 'N/A'}
                                </div>
                            </div>
                        </div>
                        {(yearStatistics.totalAuctions || 0) > 399000 && (
                            <div className="row">
                                <div className="col-12" style={{ marginTop: '12px', color: 'var(--bs-warning)' }}>
                                    <strong>Note:</strong> Yearly queries are limited to 400k auctions to manage data size. To get more insights, please
                                    add more filters or specify a different date range.
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <NitroAdSlot
                    slotId="below-auction-graph"
                    className='mt-2'
                    config={{
                        sizes: [[970, 90]],
                        delayLoading: true,
                        report: {
                            enabled: true,
                            icon: true,
                            wording: 'Report Ad',
                            position: 'bottom-right'
                        }
                    }}
                />
                <hr />
            </div>

            {fetchspan === DateRange.ACTIVE ? (
                <ActiveAuctions item={props.item} filter={itemFilter} />
            ) : (
                <div>
                    <MarketAnalysis tag={props.item.tag} itemFilter={itemFilter} />
                    <RecentAuctions
                        item={props.item}
                        itemFilter={itemFilter || {}}
                        yearRecentSamples={
                            fetchspan === DateRange.YEAR && yearStatistics
                                ? (yearStatistics.recentSamples || yearStatistics.recentAuctions || []).map(s => ({
                                    end: s.end ? new Date(s.end) : new Date(),
                                    price: s.price,
                                    seller: { name: s.seller || '', uuid: '', iconUrl: undefined },
                                    uuid: s.uuid || '',
                                    playerName: s.playerName || ''
                                }))
                                : undefined
                        }
                        isYearView={fetchspan === DateRange.YEAR}
                        onChangeToActiveAuctions={() => {
                            onRangeChange(DateRange.ACTIVE)
                            const searchParams = new URLSearchParams(window.location.search)
                            searchParams.set('range', 'active')
                            router.replace(`${pathname}?${searchParams.toString()}`)
                            setTimeout(() => {
                                setRangeSelectKey(generateUUID())
                            }, 500)
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default AuctionHousePriceGraph
