'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import ReactECharts from 'echarts-for-react'
import { useEffect, useId, useRef, useState } from 'react'
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
import styles from './AuctionHousePriceGraph.module.css'
import graphConfig from './PriceGraphConfig'
import { applyMayorDataToChart } from '../../../utils/GraphUtils'
import EChartsReact from 'echarts-for-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { v4 as generateUUID } from 'uuid'
import { useGetApiItemPriceItemTagHistoryYear, getApiMayor } from '../../../api/_generated/skyApi'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'

interface Props {
    item: Item
}

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function AuctionHousePriceGraph(props: Props) {
    let searchParams = useSearchParams()
    let [fetchspan, setFetchspan] = useState(searchParams.get('range') as DateRange || DEFAULT_DATE_RANGE)
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
    let [yearStatistics, setYearStatistics] = useState<any>(null)
    let [customStartDate, setCustomStartDate] = useState<string>('')
    let [customEndDate, setCustomEndDate] = useState<string>('')
    let [mayorPeriods, setMayorPeriods] = useState<any[]>([])
    let [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
    let [loadingMessage, setLoadingMessage] = useState('')
    let [isYearLoading, setIsYearLoading] = useState(false)
    let graphRef = useRef<EChartsReact>(null)
    let router = useRouter()
    let pathname = usePathname()

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

    useEffect(() => {
        // Check premium status
        if (typeof window !== 'undefined' && sessionStorage.getItem('googleId')) {
            api.getPremiumProducts().then(products => {
                setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM))
            }).catch(() => {
                setHasPremium(false)
            })
        }
    }, [])

    function handleAfterLoginForPremium() {
        // Re-check premium products after login and retry year chart if allowed
        api.getPremiumProducts().then(products => {
            const ok = hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM)
            setHasPremium(ok)
            if (ok) {
                updateChart(DateRange.YEAR, itemFilter)
            }
        }).catch(() => {})
    }

    useEffect(() => {
        // Load mayor data for quick select options
        if (fetchspan === DateRange.YEAR) {
            const currentDate = new Date()
            // Get data from 2 years ago to include more mayor periods
            const twoYearsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate())
            
            getApiMayor({
                from: twoYearsAgo.toISOString(),
                to: currentDate.toISOString()
            }).then(response => {
                const periods = response.data || []
                // Sort by start date descending to get most recent mayors first
                const sortedPeriods = periods.sort((a: any, b: any) => 
                    new Date(b.start).getTime() - new Date(a.start).getTime()
                )
                setMayorPeriods(sortedPeriods)
            }).catch(console.error)
        }
    }, [fetchspan])

    // Rotating loading messages for year data
    useEffect(() => {
        let intervalId: NodeJS.Timeout
        
        if (isYearLoading) {
            const messages = [
                "Loading year history data... This might take a while! 📊",
                "Crunching numbers from the past year... Stay tuned! 🔢",
                "Fetching auction data... It's a lot of information! 📈",
                "Almost there! Processing historical market trends... 📋",
                "Loading complete market analysis... Worth the wait! 🎯",
                "Gathering seller and buyer statistics... Hang tight! 👥",
                "Fun fact: We're processing millions of auction records! 🎪",
                "Did you know? Year data includes every single transaction! 💰"
            ]
            
            let messageIndex = 0
            setLoadingMessage(messages[0])
            
            intervalId = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length
                setLoadingMessage(messages[messageIndex])
            }, 10000) // Change message every 10 seconds
        } else {
            setLoadingMessage('')
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [isYearLoading])

    let updateChart = (fetchspan: DateRange, itemFilter?: ItemFilter) => {
        // active auction is selected
        // no need to get new price data
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
            // Start loading year data - always try the API first
            setIsYearLoading(true)

            // Use the year history API - use the generated client
            import('../../../api/_generated/skyApi').then(({ getApiItemPriceItemTagHistoryYear }) => {
                // Pass item filters directly as query parameters, not nested in a query object
                let params: any = {}
                
                // Add item filters directly to params
                if (itemFilter && Object.keys(itemFilter).length > 0) {
                    params = { ...itemFilter }
                }

                // Add authentication headers for premium access
                const requestOptions: RequestInit = {}
                if (typeof window !== 'undefined') {
                    const googleId = sessionStorage.getItem('googleId')
                    if (googleId) {
                        requestOptions.headers = {
                            'GoogleToken': googleId,
                            'Content-Type': 'application/json'
                        }
                    }
                }
                
                return getApiItemPriceItemTagHistoryYear(props.item.tag, Object.keys(params).length > 0 ? params : undefined, requestOptions)
            })
            .then(response => {
                if (!mounted || currentLoadingString !== JSON.stringify({ tag: props.item.tag, fetchspan, itemFilter })) {
                    return
                }
                
                setIsYearLoading(false)
                const data = response.data

                // If the server signals that this endpoint requires premium access
                if (data && typeof data === 'object' && (data && ((data as any).isPremiumRequired || (data as any).premiumRequired || (data as any).error === 'premium_required' || (data as any).status === 401))) {
                    setIsYearLoading(false)
                    setIsLoading(false)
                    setYearStatistics({
                        averageSellTimeSeconds: 0,
                        totalAuctionsSold: 0,
                        totalListed: 0,
                        totalSellers: 0,
                        totalBuyers: 0,
                        totalBids: 0,
                        totalCoinsTransferred: 0,
                        totalAuctions: 0,
                        totalItemsSold: 0,
                        binCount: 0,
                        isPremiumRequired: true
                    })
                    setNoDataFound(false)
                    setAvgPrice(0)
                    return
                }

                // Handle the PriceStatistics response
                if (data && typeof data === 'object' && 'prices' in data) {
                    setYearStatistics(data as any) // Type assertion for PriceStatistics
                    
                    let filteredPrices = data.prices || []
                    
                    // If there are price data points, display them in the chart
                    if (filteredPrices.length > 0) {
                        // Apply custom date filtering if dates are provided
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
                    // Handle non-success response (like premium_required error)
                    setIsLoading(false)
                    setNoDataFound(true)
                    setAvgPrice(0)
                    setYearStatistics(null)
                }
            })
            .catch(e => {
                console.error(e)
                setIsYearLoading(false)
                setIsLoading(false)

                // Detect HTTP 401 (unauthorized) from the year endpoint and show standard zeroed stats with a premium link
                const is401 = e?.status === 401 || e?.response?.status === 401 || (e?.message && /\b401\b/.test(e.message))

                if (is401) {
                    setYearStatistics({
                        averageSellTimeSeconds: 0,
                        totalAuctionsSold: 0,
                        totalListed: 0,
                        totalSellers: 0,
                        totalBuyers: 0,
                        totalBids: 0,
                        totalCoinsTransferred: 0,
                        totalAuctions: 0,
                        totalItemsSold: 0,
                        binCount: 0,
                        isPremiumRequired: true
                    })
                    setNoDataFound(false)
                } else if (e?.message && e.message.includes('premium')) {
                    // Show premium preview for users without premium access (legacy behavior)
                    setYearStatistics({
                        averageSellTimeSeconds: 0,
                        totalAuctionsSold: 0,
                        totalListed: 0,
                        totalSellers: 0,
                        totalBuyers: 0,
                        totalBids: 0,
                        totalCoinsTransferred: 0,
                        totalAuctions: 0,
                        totalItemsSold: 0,
                        binCount: 0,
                        isPremiumPreview: true
                    })
                    setNoDataFound(false)
                } else {
                    setNoDataFound(true)
                    setYearStatistics(null)
                }
                setAvgPrice(0)
            })
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
                } catch (e) { }

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
                    <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--bs-secondary)' }}>
                        {loadingMessage}
                    </p>
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
    ) : null;

    // Premium/Login overlay for YEAR view - ensure it's highly visible where the graph normally is
    if (fetchspan === DateRange.YEAR && !isLoading && !isYearLoading && !hasPremium) {
        const isSignedIn = typeof window !== 'undefined' && !!sessionStorage.getItem('googleId')

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
                                        // Retry year chart - this will re-check premium status if user recently upgraded
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

            {/* Custom Date Selection for Year View - placed above the graph and below filters */}
            {fetchspan === DateRange.YEAR && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bs-secondary)', borderRadius: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h6 style={{ margin: 0 }}>📅 Custom Date Range</h6>
                        <button 
                            className="btn btn-sm btn-outline-light"
                            onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                        >
                            {showCustomDatePicker ? 'Hide' : 'Show'} Date Picker
                        </button>
                    </div>

                    {/* Quick Select Options */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>🎯 Quick Select:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {/* Previous Mayor */}
                            {mayorPeriods.length > 1 && (
                                <button
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => {
                                        const prevMayor = mayorPeriods[1]
                                        const startDate = new Date(prevMayor.start || '').toISOString().split('T')[0]
                                        const endDate = new Date(prevMayor.end || '').toISOString().split('T')[0]
                                        setCustomStartDate(startDate)
                                        setCustomEndDate(endDate)
                                        const cleanFilter: ItemFilter = {}
                                        Object.keys(itemFilter || {}).forEach(key => {
                                            if (key !== '_hide' && typeof itemFilter![key] === 'string') {
                                                cleanFilter[key] = itemFilter![key] as string
                                            }
                                        })
                                        cleanFilter.EndAfter = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000).toString()
                                        cleanFilter.EndBefore = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000).toString()
                                        updateChart(DateRange.YEAR, cleanFilter)
                                    }}
                                >
                                    👑 Previous Mayor ({mayorPeriods[1]?.winner?.name || 'Unknown'})
                                </button>
                            )}
                            
                            {/* Around Current Mayor Start */}
                            {mayorPeriods.length > 0 && (
                                <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => {
                                        const currentMayor = mayorPeriods[0]
                                        let mayorStartDate = currentMayor && currentMayor.start ? new Date(currentMayor.start) : new Date()

                                        const currentName = currentMayor?.winner?.name
                                        if (currentName) {
                                            const previousSame = mayorPeriods
                                                .filter(p => p.start && p.winner && p.winner.name === currentName && new Date(p.start).getTime() < new Date(currentMayor.start).getTime())
                                                .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())

                                            if (previousSame.length > 0) {
                                                mayorStartDate = new Date(previousSame[0].start)
                                            }
                                        }

                                        const startDate = new Date(mayorStartDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                        const endDate = new Date(mayorStartDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                        setCustomStartDate(startDate)
                                        setCustomEndDate(endDate)
                                        const cleanFilter: ItemFilter = {}
                                        Object.keys(itemFilter || {}).forEach(key => {
                                            if (key !== '_hide' && typeof itemFilter![key] === 'string') {
                                                cleanFilter[key] = itemFilter![key] as string
                                            }
                                        })
                                        cleanFilter.EndAfter = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000).toString()
                                        cleanFilter.EndBefore = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000).toString()
                                        updateChart(DateRange.YEAR, cleanFilter)
                                    }}
                                >
                                    {`📅 Last time ${mayorPeriods[0]?.winner?.name || 'current mayor'} was elected (±5 days)`}
                                </button>
                            )}
                            
                            {/* 1 Year Ago */}
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => {
                                    const now = new Date()
                                    const yearAgoStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 365)
                                    const yearAgoEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 358)
                                    const startDate = yearAgoStart.toISOString().split('T')[0]
                                    const endDate = yearAgoEnd.toISOString().split('T')[0]
                                    setCustomStartDate(startDate)
                                    setCustomEndDate(endDate)
                                    const cleanFilter: ItemFilter = {}
                                    Object.keys(itemFilter || {}).forEach(key => {
                                        if (key !== '_hide' && typeof itemFilter![key] === 'string') {
                                            cleanFilter[key] = itemFilter![key] as string
                                        }
                                    })
                                    cleanFilter.EndAfter = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000).toString()
                                    cleanFilter.EndBefore = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000).toString()
                                    updateChart(DateRange.YEAR, cleanFilter)
                                }}
                            >
                                📈 1 Year Ago (7 days period)
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Inputs */}
                    {showCustomDatePicker && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Start Date:</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>End Date:</label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                        const dateRangeFilter: ItemFilter = { ...itemFilter }
                                        if (customStartDate) {
                                            dateRangeFilter.EndAfter = Math.floor(new Date(customStartDate + 'T00:00:00Z').getTime() / 1000).toString()
                                        }
                                        if (customEndDate) {
                                            dateRangeFilter.EndBefore = Math.floor(new Date(customEndDate + 'T23:59:59Z').getTime() / 1000).toString()
                                        }
                                        updateChart(DateRange.YEAR, dateRangeFilter)
                                    }}
                                    disabled={!customStartDate && !customEndDate}
                                >
                                    Apply
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        setCustomStartDate('')
                                        setCustomEndDate('')
                                        updateChart(DateRange.YEAR, itemFilter)
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
                                        <strong>⏱️ Avg Sell Time:</strong> {
                                            yearStatistics.averageSellTimeSeconds 
                                                ? `${Math.round(yearStatistics.averageSellTimeSeconds / 3600)} hours`
                                                : 'N/A'
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // If the API returned 401 -> show login + link to premium
                            yearStatistics && yearStatistics.isPremiumRequired ? (
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
                                    <p style={{ color: 'var(--bs-secondary)', marginBottom: '15px' }}>
                                        Unlock detailed year statistics with premium access!
                                    </p>
                                    <div style={{ fontSize: '14px', color: 'var(--bs-info)' }}>
                                        📊 View complete market analysis<br/>
                                        💰 Track historical price trends<br/>
                                        📈 Access seller/buyer statistics
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SubscribeButton type="item" topic={props.item.tag} />
                    <ShareButton
                        title={'Prices for ' + props.item.name}
                        text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock"
                    />
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
                        yearRecentSamples={fetchspan === DateRange.YEAR ? yearStatistics?.recentSamples || yearStatistics?.recentAuctions : undefined}
                        isYearView={fetchspan === DateRange.YEAR}
                        onChangeToActiveAuctions={() => {
                            onRangeChange(DateRange.ACTIVE)
                            let searchParams = new URLSearchParams(window.location.search)
                            searchParams.set('range', "active")
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
