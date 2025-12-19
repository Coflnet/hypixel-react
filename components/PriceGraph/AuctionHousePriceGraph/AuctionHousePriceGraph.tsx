'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import ReactECharts from 'echarts-for-react'
import { useEffect, useId, useRef, useState } from 'react'
import useRotatingMessages from '../../../hooks/useRotatingMessages'
import api from '../../../api/ApiHelper'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { AUCTION_GRAPH_LEGEND_SELECTION } from '../../../utils/SettingsUtils'
import ActiveAuctions from '../../ActiveAuctions/ActiveAuctions'
import ItemFilter, { getPrefillFilter } from '../../ItemFilter/ItemFilter'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../../ItemPriceRange/ItemPriceRange'
import Number from '../../Number/Number'
import GoogleSignIn from '../../GoogleSignIn/GoogleSignIn'
import RecentAuctions from '../../RecentAuctions/RecentAuctions'
import RelatedItems from '../../RelatedItems/RelatedItems'
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
import type { PriceStatistics, CoflnetSkyMayorModelsModelElectionPeriod, AuctionPreview } from '../../../api/_generated/skyApi.schemas'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'

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
    isPremiumPreview?: boolean
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

let currentLoadingString

let mounted = true

function AuctionHousePriceGraph(props: Props) {
    let searchParams = useSearchParams()
    let [fetchspan, setFetchspan] = useState((searchParams.get('range') as DateRange) || DEFAULT_DATE_RANGE)
    let [isLoading, setIsLoading] = useState(false)
    let [noDataFound, setNoDataFound] = useState(false)
    let [avgPrice, setAvgPrice] = useState(0)
    let [filters, setFilters] = useState([] as FilterOptions[])
    let [itemFilter, setItemFilter] = useState<ItemFilter>()
    let [defaultRangeSwitch, setDefaultRangeSwitch] = useState(true)
    let [chartOptions, setChartOptions] = useState(graphConfig)
    let [mayorData, setMayorData] = useState<MayorData[]>([])
    let [rangeSelectKey, setRangeSelectKey] = useState(generateUUID)
    let [hasPremium, setHasPremium] = useState(false)
    let [yearStatistics, setYearStatistics] = useState<YearStatistics | null>(null)
    let [customStartDate, setCustomStartDate] = useState<string>('')
    let [customEndDate, setCustomEndDate] = useState<string>('')
    let [mayorPeriods, setMayorPeriods] = useState<CoflnetSkyMayorModelsModelElectionPeriod[]>([])
    let [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
    let [isYearLoading, setIsYearLoading] = useState(false)
    let [yearParams, setYearParams] = useState<any | undefined>(undefined)
    let [yearFetchOptions, setYearFetchOptions] = useState<RequestInit | undefined>(undefined)
    let loadingMessage = useRotatingMessages(
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
    let graphRef = useRef<EChartsReact>(null)
    let router = useRouter()
    let pathname = usePathname()

    const isSignedIn = typeof window !== 'undefined' && !!sessionStorage.getItem('googleId')

    let fetchspanRef = useRef(fetchspan)
    fetchspanRef.current = fetchspan

    useEffect(() => {
        mounted = true

        setSelectedLegendOptionsFromLocalStorage()

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        loadFilters().then(filters => {
            fetchspan = DEFAULT_DATE_RANGE
            setFetchspan(DEFAULT_DATE_RANGE)
            setFilters(filters)
            if (props.item) {
                updateChart(fetchspan, getPrefillFilter(filters))
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
            .catch(() => {})
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
            const sortedPeriods = periods.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())
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
            const response = yearQuery.data as any

            if (!mounted || currentLoadingString !== JSON.stringify({ tag: props.item.tag, fetchspan, itemFilter })) {
                setIsYearLoading(false)
                return
            }

            setIsYearLoading(false)
            const data = response.data

            if (
                data &&
                typeof data === 'object' &&
                data &&
                ((data as any).isPremiumRequired || (data as any).premiumRequired || (data as any).error === 'premium_required' || (data as any).status === 401)
            ) {
                setIsYearLoading(false)
                setIsLoading(false)
                setYearStatistics({ ...EMPTY_YEAR_STATISTICS_BASE, isPremiumRequired: true })
                setNoDataFound(false)
                setAvgPrice(0)
                return
            }

            if (data && typeof data === 'object' && 'prices' in data) {
                setYearStatistics(data as any)

                let filteredPrices = data.prices || []

                if (filteredPrices.length > 0) {
                    if (customStartDate || customEndDate) {
                        filteredPrices = filteredPrices.filter(item => {
                            const itemDate = new Date(item.time)
                            const startDate = customStartDate ? new Date(customStartDate) : new Date(0)
                            const endDate = customEndDate ? new Date(customEndDate) : new Date()

                            return itemDate >= startDate && itemDate <= endDate
                        })
                    }

                    chartOptions.xAxis[0].data = filteredPrices.map(item => new Date(item.time).getTime())
                    chartOptions.series[0].data = filteredPrices.map(item => item.avg.toFixed(2))
                    chartOptions.series[1].data = filteredPrices.map(item => item.min.toFixed(2))
                    chartOptions.series[2].data = filteredPrices.map(item => item.max.toFixed(2))
                    chartOptions.series[3].data = filteredPrices.map(item => item.volume.toFixed(2))

                    let priceSum = filteredPrices.reduce((sum, item) => sum + item.avg, 0)
                    setAvgPrice(Math.round(priceSum / filteredPrices.length))
                } else {
                    setAvgPrice(0)
                }

                setIsLoading(false)
                setNoDataFound(filteredPrices?.length === 0)
                setChartOptions(chartOptions)
            } else {
                setIsLoading(false)
                setNoDataFound(true)
                setAvgPrice(0)
                setYearStatistics(null)
            }
        } else if (yearQuery.error) {
            const e: any = yearQuery.error
            console.error(e)
            setIsYearLoading(false)
            setIsLoading(false)

            const is401 = e?.status === 401 || e?.response?.status === 401 || (e?.message && /\b401\b/.test(e.message))

            if (is401) {
                setYearStatistics({ ...EMPTY_YEAR_STATISTICS_BASE, isPremiumRequired: true })
                setNoDataFound(false)
            } else if (e?.message && e.message.includes('premium')) {
                setYearStatistics({ ...EMPTY_YEAR_STATISTICS_BASE, isPremiumPreview: true })
                setNoDataFound(false)
            } else {
                setNoDataFound(true)
                setYearStatistics(null)
            }
            setAvgPrice(0)
        }
    }, [yearQuery.data, yearQuery.error])

    let updateChart = (fetchspan: DateRange, itemFilter?: ItemFilter) => {
        if (fetchspan === DateRange.ACTIVE) {
            setIsLoading(false)
            return
        }

        if (fetchspan === DateRange.HOUR) {
            return
        }

        setIsLoading(true)

        chartOptions.xAxis[0].data = []
        chartOptions.series[0].data = []
        chartOptions.series[1].data = []
        chartOptions.series[2].data = []
        chartOptions.series[3].data = []

        currentLoadingString = JSON.stringify({
            tag: props.item.tag,
            fetchspan,
            itemFilter
        })

        if (fetchspan === DateRange.YEAR) {
            setIsYearLoading(true)

            let params: any = {}
            if (itemFilter && Object.keys(itemFilter).length > 0) {
                params = { ...itemFilter }
            }

            const requestOptions: RequestInit = {}
            if (typeof window !== 'undefined') {
                const googleId = isSignedIn ? sessionStorage.getItem('googleId') : null
                if (googleId) {
                    requestOptions.headers = {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    }
                }
            }

            setYearParams(Object.keys(params).length > 0 ? params : undefined)
            setYearFetchOptions(requestOptions)
            return
        }

        api.getItemPrices(props.item.tag, fetchspan as unknown as globalThis.DateRange, itemFilter)
            .then(async prices => {
                if (
                    !mounted ||
                    currentLoadingString !==
                        JSON.stringify({
                            tag: props.item.tag,
                            fetchspan,
                            itemFilter
                        })
                ) {
                    return
                }

                // Check if prices array has any data before accessing
                if (!prices || prices.length === 0) {
                    setIsLoading(false)
                    setNoDataFound(true)
                    setAvgPrice(0)
                    return
                }

                let minDate = prices[0].time
                let maxDate = prices[prices.length - 1].time

                chartOptions.xAxis[0].data = prices.map(item => item.time.getTime())

                let priceSum = 0

                prices.forEach(item => {
                    priceSum += item.avg
                    chartOptions.series[0].data.push(item.avg.toFixed(2))
                    chartOptions.series[1].data.push(item.min.toFixed(2))
                    chartOptions.series[2].data.push(item.max.toFixed(2))
                    chartOptions.series[3].data.push(item.volume.toFixed(2))
                })

                try {
                    let mayorData = await api.getMayorData(minDate, maxDate)
                    setMayorData(mayorData)
                    applyMayorDataToChart(chartOptions, mayorData, 4)
                } catch (e) {}

                setAvgPrice(Math.round(priceSum / prices.length))
                setNoDataFound(prices.length === 0)
                setIsLoading(false)
                setChartOptions(chartOptions)
            })
            .catch(e => {
                console.error(e)
                setIsLoading(false)
                setNoDataFound(true)
                setAvgPrice(0)
            })
    }

    let onRangeChange = (timespan: DateRange) => {
        setFetchspan(timespan)
        if (timespan !== DateRange.ACTIVE) {
            updateChart(timespan, itemFilter)
        }
    }

    let onFilterChange = (filter: ItemFilter) => {
        setItemFilter({ ...filter })
        setDefaultRangeSwitch(!defaultRangeSwitch)
        if (fetchspanRef.current !== DateRange.ACTIVE) {
            updateChart(fetchspanRef.current, filter)
        }
    }

    function loadFilters() {
        return api.getFilters(props.item.tag)
    }

    function setSelectedLegendOptionsFromLocalStorage() {
        let legendSelected = localStorage.getItem(AUCTION_GRAPH_LEGEND_SELECTION)
        chartOptions.legend.selected = legendSelected ? JSON.parse(legendSelected) : chartOptions.legend.selected
        setChartOptions(chartOptions)
    }

    function onChartsEvents(): Record<string, Function> {
        return {
            legendselectchanged: e => {
                localStorage.setItem(AUCTION_GRAPH_LEGEND_SELECTION, JSON.stringify(e.selected))
            },
            datazoom: (e: { start: number; end: number }) => {
                let newChartOptions = { ...graphRef.current?.getEchartsInstance().getOption() }
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

    if (fetchspan === DateRange.YEAR && !isLoading && !isYearLoading && !hasPremium) {
        graphOverlayElement = (
            <div className={styles.graphOverlay} style={{ padding: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>🔒</div>
                    <h5 style={{ color: 'var(--bs-warning)', marginBottom: '8px' }}>Year view requires Premium</h5>
                    <p style={{ color: 'var(--bs-secondary)', marginBottom: '12px' }}>
                        Detailed year statistics are a premium feature. Sign in to check your access or visit the premium page to learn more.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                        {!isSignedIn ? (
                            <GoogleSignIn onAfterLogin={handleAfterLoginForPremium} />
                        ) : (
                            <>
                                <Link href="/premium?tier=premium">
                                    <button className="btn btn-sm btn-outline-warning">Go to Premium</button>
                                </Link>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
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
                    {!isLoading && !noDataFound ? (
                        <ReactECharts option={chartOptions} className={styles.chart} ref={graphRef} onEvents={onChartsEvents()} />
                    ) : (
                        graphOverlayElement
                    )}
                </div>
                <div className={styles.additionalInfos}>
                    <span className={styles.avgPrice}>
                        <b>Avg Price:</b>{' '}
                        {isLoading ? (
                            '-'
                        ) : (
                            <span>
                                <Number number={avgPrice} /> Coins
                            </span>
                        )}
                    </span>
                </div>

                {/* Year Statistics Section */}
                {fetchspan === DateRange.YEAR && yearStatistics && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bs-secondary)', borderRadius: '5px' }}>
                        <h6 style={{ marginBottom: '15px', color: 'var(--bs-warning)' }}>📊 Statistics Summary</h6>

                        {!yearStatistics.isPremiumPreview ? (
                            <>
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
                            </>
                        ) : yearStatistics && yearStatistics.isPremiumRequired ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                                <h5 style={{ color: 'var(--bs-warning)', marginBottom: '10px' }}>Premium Feature</h5>
                                <p style={{ color: 'var(--bs-secondary)', marginBottom: '15px' }}>
                                    This feature requires a premium account. Sign in to check your access or visit the premium page to learn more.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                                    <GoogleSignIn onAfterLogin={handleAfterLoginForPremium} />
                                    <Link href="/premium">
                                        <button className="btn btn-sm btn-outline-warning">Go to Premium</button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                                <h5 style={{ color: 'var(--bs-warning)', marginBottom: '10px' }}>Premium Feature</h5>
                                <p style={{ color: 'var(--bs-secondary)', marginBottom: '15px' }}>Unlock detailed year statistics with premium access!</p>
                                <div style={{ fontSize: '14px', color: 'var(--bs-info)' }}>
                                    📊 View complete market analysis
                                    <br />
                                    💰 Track historical price trends
                                    <br />
                                    📈 Access seller/buyer statistics
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: '8px' }}>
                    <div style={{ flex: '1 1 auto' }} />
                    <div className="d-flex align-items-center" style={{ gap: '8px', minWidth: '220px', justifyContent: 'flex-end' }}>
                        <SubscribeButton type="item" topic={props.item.tag} />
                        <ShareButton
                            title={'Prices for ' + props.item.name}
                            text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock"
                        />
                    </div>
                </div>
                <hr />
            </div>

            {fetchspan === DateRange.ACTIVE ? (
                <ActiveAuctions item={props.item} filter={itemFilter} />
            ) : (
                <div>
                    {fetchspan !== DateRange.YEAR && <RelatedItems tag={props.item.tag} />}
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
                            let searchParams = new URLSearchParams(window.location.search)
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
