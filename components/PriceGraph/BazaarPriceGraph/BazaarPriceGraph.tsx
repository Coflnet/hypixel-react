'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import ReactECharts from 'echarts-for-react'
import { ChangeEvent, RefObject, Suspense, useEffect, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { getURLSearchParam } from '../../../utils/Parser/URLParser'
import { BAZAAR_GRAPH_LEGEND_SELECTION, BAZAAR_GRAPH_TYPE } from '../../../utils/SettingsUtils'
import { isClientSideRendering } from '../../../utils/SSRUtils'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../../ItemPriceRange/ItemPriceRange'
import { getValidatedRange } from '../../../hooks/useValidRange'
import Number from '../../Number/Number'
import ShareButton from '../../ShareButton/ShareButton'
import styles from './BazaarPriceGraph.module.css'
import BazaarSnapshot from './BazaarSnapshot/BazaarSnapshot'
import getPriceGraphConfigSingle from './PriceGraphConfigSingle'
import getPriceGraphConfigSplit from './PriceGraphConfigSplit'
import { appendLiveSnapshotPoint, applyMayorDataToChart, getChartZoomTimestamp } from '../../../utils/GraphUtils'
import SubscribeButton from '../../SubscribeButton/SubscribeButton'
import NitroAdSlot from '../../Ads/NitroAdSlot'

interface Props {
    item: Item
}

enum GRAPH_TYPE {
    SPLIT = 'split',
    SINGLE = 'single'
}

const DEFAULT_GRAPH_TYPE = GRAPH_TYPE.SINGLE

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function BazaarPriceGraph(props: Props) {
    let [fetchspan, setFetchspan] = useState(DEFAULT_DATE_RANGE)
    let [isLoading, setIsLoading] = useState(false)
    let [noDataFound, setNoDataFound] = useState(false)
    let [avgBuyPrice, setAvgBuyPrice] = useState(0)
    let [avgSellPrice, setAvgSellPrice] = useState(0)
    let [graphType, setGraphType] = useState(DEFAULT_GRAPH_TYPE)
    let [chartOptionsPrimary, setChartOptionsPrimary] = useState(graphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit())
    let [chartOptionsSecondary, setChartOptionsSecondary] = useState(getPriceGraphConfigSplit())
    let [prices, setPrices] = useState<BazaarPrice[]>([])
    let [mayorData, setMayorData] = useState<MayorData[]>([])
    let [isSSR, setIsSSR] = useState(true)
    let { trackEvent } = useMatomo()

    let primaryChartRef = useRef<ReactECharts>(null)
    let secondaryChartRef = useRef<ReactECharts>(null)
    // Kept in a ref so the ~25s snapshot poll never re-renders (and thereby re-zooms) the charts.
    let liveSnapshotRef = useRef<BazaarSnapshot | undefined>(undefined)
    let appliedLivePointKeyRef = useRef('')

    useEffect(() => {
        mounted = true

        init()
        setIsSSR(false)

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        checkForSpecialFetchspanConfiguration()
    }, [fetchspan])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }
        init()
    }, [props.item.tag])

    useEffect(() => {
        if (prices.length > 0) {
            let chartOptions = graphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit()

            chartOptionsPrimary = chartOptions

            checkForSpecialFetchspanConfiguration()

            setSelectedLegendOptionsFromLocalStorage()
            setChartOptionsPrimary(chartOptions)
            setChartData(prices, mayorData)
        }
    }, [graphType])

    function init() {
        fetchspan = getValidatedRange(getURLSearchParam('range'))
        setFetchspan(fetchspan)

        graphType = (localStorage.getItem(BAZAAR_GRAPH_TYPE) as GRAPH_TYPE) || DEFAULT_GRAPH_TYPE
        setGraphType(graphType)
        chartOptionsPrimary = graphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit()
        setChartOptionsPrimary(graphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit())
        checkForSpecialFetchspanConfiguration()

        setTimeout(() => {
            updateChart(fetchspan)
        }, 100)
    }

    const updateChart = (function () {
        let timerId

        return (fetchspan: DateRange) => {
            clearTimeout(timerId)
            timerId = setTimeout(() => {
                debouncedUpdateChart(fetchspan)
            }, 500)
        }
    })()

    async function debouncedUpdateChart(fetchspan: DateRange) {
        // active auction is selected
        // no need to get new price data
        if (fetchspan === DateRange.ACTIVE) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        currentLoadingString = JSON.stringify({ tag: props.item.tag, fetchspan })

        try {
            let prices = await loadBazaarPrices(props.item.tag, fetchspan)
            let mayorData
            try {
                mayorData = await api.getMayorData(prices[0].timestamp, prices[prices.length - 1].timestamp)
            } catch {
                mayorData = []
            }
            if (!mounted || currentLoadingString !== JSON.stringify({ tag: props.item.tag, fetchspan })) {
                return
            }
            setPrices(prices)
            setMayorData(mayorData)
            setChartData(prices, mayorData)
            setIsLoading(false)
            setNoDataFound(prices.length === 0)
        } catch (e) {
            console.error(e)
            setIsLoading(false)
            setNoDataFound(true)
            setAvgBuyPrice(0)
            setAvgBuyPrice(0)
        }
    }

    function setSeriesType(chartOptions, seriesName: string, type: string) {
        let series = chartOptions.series.find(series => series.name === seriesName)
        if (series) {
            series.type = type
        }
    }

    function checkForSpecialFetchspanConfiguration() {
        if (fetchspan === DateRange.HOUR) {
            chartOptionsPrimary.legend.data = chartOptionsPrimary.legend.data.filter(s => !s.includes('Min') && !s.includes('Max'))
            chartOptionsSecondary.legend.data = chartOptionsSecondary.legend.data.filter(s => !s.includes('Min') && !s.includes('Max'))
            chartOptionsPrimary.series.forEach((s, i) => {
                s.type = 'line'
                if (s.name === 'Min' || s.name === 'Max') {
                    s.tooltip.show = false
                    s.data = []
                }
            })
            chartOptionsSecondary.series.forEach(s => {
                s.type = 'line'
                if (s.name.includes('Min') || s.name.includes('Max')) {
                    s.tooltip.show = false
                    s.data = []
                }
            })
        } else {
            setSeriesType(chartOptionsPrimary, graphType === GRAPH_TYPE.SINGLE ? 'Price (buy)' : 'Price', 'k')
            setSeriesType(chartOptionsSecondary, 'Price', 'k')

            chartOptionsPrimary.series.forEach(s => {
                s.tooltip.show = true
            })
            chartOptionsSecondary.series.forEach(s => {
                s.tooltip.show = true
            })

            if (graphType === GRAPH_TYPE.SINGLE) {
                chartOptionsPrimary.legend.data = getPriceGraphConfigSingle().legend.data
                setSeriesType(chartOptionsPrimary, 'Price (sell)', 'k')
            } else {
                chartOptionsPrimary.legend.data = getPriceGraphConfigSplit().legend.data
            }
            chartOptionsSecondary.legend.data = getPriceGraphConfigSplit().legend.data
        }

        setSelectedLegendOptionsFromLocalStorage()
        setChartOptionsPrimary(chartOptionsPrimary)
        setChartOptionsSecondary(chartOptionsSecondary)
    }

    function loadBazaarPrices(tag: string, fetchspan: DateRange): Promise<BazaarPrice[]> {
        if (fetchspan === DateRange.ALL) {
            return api.getBazaarPricesByRange(tag, new Date(0), new Date())
        } else if (fetchspan === DateRange.MONTH) {
            let monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return api.getBazaarPricesByRange(tag, monthAgo, new Date())
        } else {
            return api.getBazaarPrices(tag, fetchspan as any)
        }
    }

    function getLegendLocalStorageKey(primary: boolean) {
        return `${graphType}-${primary ? 'primary' : 'secondary'}${fetchspan === DateRange.HOUR ? '-hour' : ''}`
    }

    function onRangeChange(timespan: DateRange) {
        setFetchspan(timespan)
        fetchspan = timespan
        updateChart(timespan)
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, { detail: { timestamp: new Date(), isLive: true } }))
    }

    function setSelectedLegendOptionsFromLocalStorage() {
        let legendSelected = localStorage.getItem(BAZAAR_GRAPH_LEGEND_SELECTION)
        if (graphType === GRAPH_TYPE.SPLIT) {
            chartOptionsPrimary.legend.selected = legendSelected
                ? JSON.parse(legendSelected)[getLegendLocalStorageKey(true)]
                : chartOptionsPrimary.legend.selected
            chartOptionsSecondary.legend.selected = legendSelected
                ? JSON.parse(legendSelected)[getLegendLocalStorageKey(false)]
                : chartOptionsSecondary.legend.selected
        } else {
            chartOptionsPrimary.legend.selected = legendSelected
                ? JSON.parse(legendSelected)[getLegendLocalStorageKey(true)]
                : chartOptionsPrimary.legend.selected
        }
        setChartOptionsPrimary(chartOptionsPrimary)
        setChartOptionsSecondary(chartOptionsSecondary)
    }

    function onChartsEvents(localStorageKey: string, chartRef: RefObject<ReactECharts | null>): Record<string, Function> {
        return {
            datazoom: e => {
                const chart = chartRef.current?.getEchartsInstance()
                if (!chart) return
                const newChartOptions = { ...chart.getOption() }
                const zoom = e.batch?.[0] ?? e
                const timestamps = (newChartOptions.xAxis as { data: number[] }[])[0].data
                const midDate = getChartZoomTimestamp(timestamps, zoom)
                if (!midDate) return
                applyMayorDataToChart(newChartOptions, mayorData, graphType === GRAPH_TYPE.SINGLE ? 10 : 5, zoom)
                chart.setOption({
                    series: newChartOptions.series
                })

                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, { detail: { timestamp: midDate } }))
                }, 100)
            },
            legendselectchanged: e => {
                let current = JSON.parse(localStorage.getItem(BAZAAR_GRAPH_LEGEND_SELECTION) || '{}')
                current[localStorageKey] = e.selected
                localStorage.setItem(BAZAAR_GRAPH_LEGEND_SELECTION, JSON.stringify(current))
            }
        }
    }

    function clearChartData() {
        chartOptionsPrimary.xAxis[0].data = []
        chartOptionsSecondary.xAxis[0].data = []

        chartOptionsPrimary.series.forEach(s => {
            s.data = []
        })

        chartOptionsSecondary.series.forEach(s => {
            s.data = []
        })
        setChartOptionsPrimary(chartOptionsPrimary)
        setChartOptionsSecondary(chartOptionsSecondary)
    }

    function onLiveSnapshotChange(snapshot: BazaarSnapshot | undefined) {
        liveSnapshotRef.current = snapshot
        if (isLoading || prices.length === 0) {
            return
        }
        // Most polls return an unchanged book (or one that cannot be appended) - leave the chart alone then.
        if (getLivePointKey(getPricesWithLivePoint(prices), prices) === appliedLivePointKeyRef.current) {
            return
        }
        setChartData(prices, mayorData)
        pushChartDataToChart(primaryChartRef, chartOptionsPrimary, graphType === GRAPH_TYPE.SINGLE ? 10 : 5)
        if (graphType === GRAPH_TYPE.SPLIT) {
            pushChartDataToChart(secondaryChartRef, chartOptionsSecondary, 5)
        }
    }

    // Merges the new data into the mounted chart instead of re-rendering it, which keeps the user's zoom.
    function pushChartDataToChart(chartRef: RefObject<ReactECharts | null>, chartOptions, mayorSeriesIndex: number) {
        const chart = chartRef.current?.getEchartsInstance()
        // A chart that has not received its first option yet picks the new data up when it does.
        const currentOption = chart?.getOption()
        if (!chart || !currentOption) return
        const zoom = (currentOption.dataZoom as { start: number; end: number }[] | undefined)?.[0]
        if (zoom && isFinite(zoom.start) && isFinite(zoom.end)) {
            applyMayorDataToChart(chartOptions, mayorData, mayorSeriesIndex, zoom)
        }
        chart.setOption({ xAxis: chartOptions.xAxis, series: chartOptions.series })
    }

    function getPricesWithLivePoint(history: BazaarPrice[]): BazaarPrice[] {
        // The snapshot panel keeps the previous item's order book until the new one has loaded.
        let liveSnapshot = liveSnapshotRef.current?.item.tag === props.item.tag ? liveSnapshotRef.current : undefined
        return appendLiveSnapshotPoint(history, liveSnapshot, fetchspan !== DateRange.ACTIVE)
    }

    // Identifies the appended live point (empty when there is none) to tell whether a redraw is needed.
    function getLivePointKey(prices: BazaarPrice[], history: BazaarPrice[]): string {
        return prices.length > history.length ? JSON.stringify(prices[prices.length - 1]) : ''
    }

    function setChartData(history: BazaarPrice[], mayorData: MayorData[]) {
        let prices = getPricesWithLivePoint(history)
        appliedLivePointKeyRef.current = getLivePointKey(prices, history)

        clearChartData()

        setXAxisData(chartOptionsPrimary, prices)

        if (graphType === GRAPH_TYPE.SPLIT) {
            setXAxisData(chartOptionsSecondary, prices)
        }

        // A candle closes on the next historic price only: the live point is a separate observation and
        // must not rewrite the close of the last aggregated candle.
        prices.forEach((item, i) => {
            chartOptionsPrimary.series[0].data.push(
                fetchspan === DateRange.HOUR
                    ? item.buyData.price
                    : [item.buyData.price, history[i + 1] ? history[i + 1].buyData.price : item.buyData.price, item.buyData.min, item.buyData.max]
            )

            if (graphType === GRAPH_TYPE.SINGLE) {
                chartOptionsPrimary.series[1].data.push(item.buyData.min?.toFixed(2))
                chartOptionsPrimary.series[2].data.push(item.buyData.max?.toFixed(2))
                chartOptionsPrimary.series[3].data.push(item.buyData.volume?.toFixed(2))
                chartOptionsPrimary.series[4].data.push(item.buyData.moving?.toFixed(2))

                chartOptionsPrimary.series[5].data.push(
                    fetchspan === DateRange.HOUR
                        ? item.sellData.price?.toFixed(2)
                        : [
                            item.sellData.price?.toFixed(2),
                            history[i + 1] ? history[i + 1].sellData.price?.toFixed(2) : item.sellData.price?.toFixed(2),
                            item.sellData.min?.toFixed(2),
                            item.sellData.max?.toFixed(2)
                        ]
                )
                chartOptionsPrimary.series[6].data.push(item.sellData.min?.toFixed(2))
                chartOptionsPrimary.series[7].data.push(item.sellData.max?.toFixed(2))
                chartOptionsPrimary.series[8].data.push(item.sellData.volume?.toFixed(2))
                chartOptionsPrimary.series[9].data.push(item.sellData.moving?.toFixed(2))
            } else {
                chartOptionsPrimary.series[1].data.push(item.buyData.min?.toFixed(2))
                chartOptionsPrimary.series[2].data.push(item.buyData.max?.toFixed(2))
                chartOptionsPrimary.series[3].data.push(item.buyData.volume?.toFixed(2))
                chartOptionsPrimary.series[4].data.push(item.buyData.moving?.toFixed(2))

                chartOptionsSecondary.series[0].data.push(
                    fetchspan === DateRange.HOUR
                        ? item.sellData.price?.toFixed(2)
                        : [
                            item.sellData.price?.toFixed(2),
                            history[i + 1] ? history[i + 1].sellData.price?.toFixed(2) : item.sellData.price?.toFixed(2),
                            item.sellData.min?.toFixed(2),
                            item.sellData.max?.toFixed(2)
                        ]
                )
                chartOptionsSecondary.series[1].data.push(item.sellData.min?.toFixed(2))
                chartOptionsSecondary.series[2].data.push(item.sellData.max?.toFixed(2))
                chartOptionsSecondary.series[3].data.push(item.sellData.volume?.toFixed(2))
                chartOptionsSecondary.series[4].data.push(item.sellData.moving?.toFixed(2))
            }
        })

        if (graphType === GRAPH_TYPE.SINGLE) {
            applyMayorDataToChart(chartOptionsPrimary, mayorData, 10)
        } else {
            applyMayorDataToChart(chartOptionsPrimary, mayorData, 5)
            applyMayorDataToChart(chartOptionsSecondary, mayorData, 5)
        }

        setChartOptionsPrimary(chartOptionsPrimary)
        setChartOptionsSecondary(chartOptionsSecondary)
        // The averages describe the loaded history; the live point would only make them drift on every poll.
        setAvgBuyPrice(history.reduce((sum, item) => sum + item.buyData.price, 0) / history.length)
        setAvgSellPrice(history.reduce((sum, item) => sum + item.sellData.price, 0) / history.length)
    }

    function setXAxisData(chartOptions, prices: BazaarPrice[]) {
        chartOptions.xAxis[0].data = prices.map(p => p.timestamp.getTime())
    }

    function onGraphTypeChange(e: ChangeEvent<HTMLSelectElement>) {
        let graphType = e.target.value
        setGraphType(graphType as GRAPH_TYPE)
        localStorage.setItem(BAZAAR_GRAPH_TYPE, graphType)

        trackEvent({
            category: 'graphTypeChange',
            action: graphType
        })
    }

    let graphOverlayElement = isLoading ? (
        <div className={styles.graphOverlay}>{getLoadingElement()}</div>
    ) : noDataFound && !isLoading ? (
        <div className={styles.graphOverlay}>
            <div style={{ textAlign: 'center' }}>
                <p>No data found</p>
            </div>
        </div>
    ) : null

    return (
        <div>
            <Suspense>
                <ItemPriceRange
                    dateRangesToDisplay={[DateRange.HOUR, DateRange.DAY, DateRange.WEEK, DateRange.MONTH, DateRange.ALL]}
                    onRangeChange={onRangeChange}
                    disableAllTime={false}
                    item={props.item}
                />
            </Suspense>

            <div>
                <div className={styles.chartsWrapper}>
                    {!isSSR ? (
                        <>
                            <div className={graphType === GRAPH_TYPE.SINGLE ? styles.chartWrapperSingle : styles.chartWrapperSplit}>
                                <h3 className={styles.graphHeadline}>{graphType === GRAPH_TYPE.SINGLE ? 'Bazaar data' : 'Buy data'}</h3>
                                {!isLoading && !noDataFound ? (
                                    <ReactECharts
                                        ref={primaryChartRef}
                                        option={chartOptionsPrimary}
                                        className={styles.chart}
                                        onEvents={onChartsEvents(getLegendLocalStorageKey(true), primaryChartRef)}
                                    />
                                ) : (
                                    graphOverlayElement
                                )}
                            </div>
                            {graphType === GRAPH_TYPE.SPLIT ? (
                                <div className={styles.chartWrapperSplit}>
                                    <h3 className={styles.graphHeadline}>Sell data</h3>
                                    {!isLoading && !noDataFound ? (
                                        <ReactECharts
                                            ref={secondaryChartRef}
                                            option={chartOptionsSecondary}
                                            className={styles.chart}
                                            onEvents={onChartsEvents(getLegendLocalStorageKey(false), secondaryChartRef)}
                                        />
                                    ) : (
                                        graphOverlayElement
                                    )}
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
                <div className={styles.additionalInfos}>
                    <span className={styles.avgPrice}>
                        <b>Avg Sell Price:</b>{' '}
                        {isLoading ? (
                            <span>-</span>
                        ) : (
                            <span>
                                <Number number={+avgSellPrice.toFixed(1)} /> Coins
                            </span>
                        )}
                    </span>
                    <span className={styles.avgPrice}>
                        <b>Avg Buy Price:</b>{' '}
                        {isLoading ? (
                            <span>-</span>
                        ) : (
                            <span>
                                <Number number={+avgBuyPrice.toFixed(1)} /> Coins
                            </span>
                        )}
                    </span>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className={styles.additionalInfosButton}>
                            {!isSSR ? (
                                <Form.Select
                                    defaultValue={localStorage.getItem(BAZAAR_GRAPH_TYPE) || DEFAULT_GRAPH_TYPE}
                                    className={styles.recentAuctionsFetchType}
                                    onChange={onGraphTypeChange}
                                >
                                    <option value={GRAPH_TYPE.SINGLE}>Single</option>
                                    <option value={GRAPH_TYPE.SPLIT}>Split</option>
                                </Form.Select>
                            ) : null}
                        </div>
                        <div>
                            <SubscribeButton
                                type="bazaar"
                                topic={props.item.tag}
                                currentPrice={avgBuyPrice || undefined}
                                currentSellPrice={avgSellPrice || undefined}
                            />
                        </div>
                        <div>
                            <ShareButton title={'Prices for ' + props.item.name} text="Browse the Bazaar history in Hypixel Skyblock" />
                        </div>
                    </div>

                </div>
                <NitroAdSlot
                    slotId="below-bazaar-graph"
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
                <BazaarSnapshot item={props.item} onLiveSnapshotChange={onLiveSnapshotChange} />
            </div>
        </div>
    )
}

export default BazaarPriceGraph
