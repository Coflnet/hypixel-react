'use client'
/* eslint-disable react-hooks/exhaustive-deps */
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import ReactECharts from 'echarts-for-react'
import { ChangeEvent, RefObject, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import {
    getApiBazaarItemTagHistory,
    getApiBazaarItemTagHistoryDay,
    getApiBazaarItemTagHistoryWeek,
    getApiMayor
} from '../../../api/_generated/skyApi'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { getURLSearchParam } from '../../../utils/Parser/URLParser'
import { BAZAAR_GRAPH_LEGEND_SELECTION, BAZAAR_GRAPH_TYPE } from '../../../utils/SettingsUtils'
import { isClientSideRendering } from '../../../utils/SSRUtils'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../../ItemPriceRange/ItemPriceRange'
import Number from '../../Number/Number'
import RelatedItems from '../../RelatedItems/RelatedItems'
import ShareButton from '../../ShareButton/ShareButton'
import styles from './BazaarPriceGraph.module.css'
import BazaarSnapshot from './BazaarSnapshot/BazaarSnapshot'
import getPriceGraphConfigSingle from './PriceGraphConfigSingle'
import getPriceGraphConfigSplit from './PriceGraphConfigSplit'
import { applyMayorDataToChart } from '../../../utils/GraphUtils'
import { toast } from 'react-toastify'
import SubscribeButton from '../../SubscribeButton/SubscribeButton'
import { parseBazaarPrice } from '../../../utils/Parser/APIResponseParser'

interface Props {
    item: Item
}

enum GRAPH_TYPE {
    SPLIT = 'split',
    SINGLE = 'single'
}

const DEFAULT_GRAPH_TYPE = GRAPH_TYPE.SPLIT

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
            const newPrimaryOptions = graphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit()
            const newSecondaryOptions = getPriceGraphConfigSplit()

            checkForSpecialFetchspanConfiguration(newPrimaryOptions, newSecondaryOptions)
            setSelectedLegendOptionsFromLocalStorage(newPrimaryOptions, newSecondaryOptions)
            
            setChartData(prices, mayorData, newPrimaryOptions, newSecondaryOptions)
            
            setChartOptionsPrimary(newPrimaryOptions)
            setChartOptionsSecondary(newSecondaryOptions)
            
            // Force chart refresh to ensure all series display correctly
            requestAnimationFrame(() => {
                if (primaryChartRef.current) {
                    primaryChartRef.current.getEchartsInstance().setOption(newPrimaryOptions as any, true)
                }
                if (secondaryChartRef.current && graphType === GRAPH_TYPE.SPLIT) {
                    secondaryChartRef.current.getEchartsInstance().setOption(newSecondaryOptions as any, true)
                }
            })
        }
    }, [graphType])

    function init() {
        const initialFetchspan = (getURLSearchParam('range') as DateRange) || DEFAULT_DATE_RANGE
        setFetchspan(initialFetchspan)

        const initialGraphType = (localStorage.getItem(BAZAAR_GRAPH_TYPE) as GRAPH_TYPE) || DEFAULT_GRAPH_TYPE
        setGraphType(initialGraphType)
        
        const initialPrimaryOptions = initialGraphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit()
        const initialSecondaryOptions = getPriceGraphConfigSplit()
        
        checkForSpecialFetchspanConfiguration(initialPrimaryOptions, initialSecondaryOptions)
        setSelectedLegendOptionsFromLocalStorage(initialPrimaryOptions, initialSecondaryOptions)
        
        setChartOptionsPrimary(initialPrimaryOptions)
        setChartOptionsSecondary(initialSecondaryOptions)

        // Start chart update immediately without setTimeout to reduce blocking time
        updateChart(initialFetchspan)
    }

    const updateChart = (function () {
        let timerId

        return (fetchspan: DateRange) => {
            clearTimeout(timerId)
            // Reduced debounce from 150ms to 50ms for faster response
            timerId = setTimeout(() => {
                debouncedUpdateChart(fetchspan)
            }, 50)
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
            let mayorData: MayorData[] = []
            if (prices.length > 0) {
                    try {
                        // Ensure we request mayor data for the full time range (safe if API returns descending)
                        const timestamps = prices.map(p => p.timestamp.getTime())
                        const from = new Date(Math.min(...timestamps)).toISOString()
                        const to = new Date(Math.max(...timestamps)).toISOString()
                        const mayorResponse = await getApiMayor({
                            from,
                            to
                        })
                    const rawMayorData = (mayorResponse.data as any) || []
                    // Convert date strings to Date objects
                    mayorData = rawMayorData.map((item: any) => ({
                        ...item,
                        start: new Date(item.start),
                        end: new Date(item.end)
                    }))
                } catch (e) {
                    console.warn('Failed to fetch mayor data', e)
                }
            }
            if (!mounted || currentLoadingString !== JSON.stringify({ tag: props.item.tag, fetchspan })) {
                return
            }
            setPrices(prices)
            setMayorData(mayorData)
            
            const currentPrimaryOptions = graphType === GRAPH_TYPE.SINGLE ? getPriceGraphConfigSingle() : getPriceGraphConfigSplit()
            const currentSecondaryOptions = getPriceGraphConfigSplit()
            
            checkForSpecialFetchspanConfiguration(currentPrimaryOptions, currentSecondaryOptions)
            setSelectedLegendOptionsFromLocalStorage(currentPrimaryOptions, currentSecondaryOptions)
            
            if (prices.length > 0) {
                setChartData(prices, mayorData, currentPrimaryOptions, currentSecondaryOptions)
            }
            
            setChartOptionsPrimary(currentPrimaryOptions)
            setChartOptionsSecondary(currentSecondaryOptions)
            
            setIsLoading(false)
            setNoDataFound(prices.length === 0)
        } catch (e) {
            console.error(e)
            setIsLoading(false)
            setNoDataFound(true)
            setAvgBuyPrice(0)
            setAvgSellPrice(0)
        }
    }

    function checkForSpecialFetchspanConfiguration(primary = chartOptionsPrimary, secondary = chartOptionsSecondary) {
        if (fetchspan === DateRange.HOUR) {
            primary.legend.data = primary.legend.data.filter(s => !s.includes('Min') && !s.includes('Max'))
            secondary.legend.data = secondary.legend.data.filter(s => !s.includes('Min') && !s.includes('Max'))
            primary.series.forEach((s, i) => {
                s.type = 'line'
                if (s.name === 'Min' || s.name === 'Max') {
                    s.tooltip.show = false
                    s.data = []
                }
            })
            secondary.series.forEach(s => {
                s.type = 'line'
                if (s.name.includes('Min') || s.name.includes('Max')) {
                    s.tooltip.show = false
                    s.data = []
                }
            })
        } else {
            primary.series[0].type = 'k'
            secondary.series[0].type = 'k'

            primary.series.forEach(s => {
                s.tooltip.show = true
            })
            secondary.series.forEach(s => {
                s.tooltip.show = true
            })

            if (graphType === GRAPH_TYPE.SINGLE) {
                primary.legend.data = getPriceGraphConfigSingle().legend.data
                primary.series[3].type = 'k'
            } else {
                primary.legend.data = getPriceGraphConfigSplit().legend.data
            }
            secondary.legend.data = getPriceGraphConfigSplit().legend.data
        }

        setSelectedLegendOptionsFromLocalStorage(primary, secondary)
    }

    async function loadBazaarPrices(tag: string, fetchspan: DateRange): Promise<BazaarPrice[]> {
        let response;
        if (fetchspan === DateRange.ALL) {
            response = await getApiBazaarItemTagHistory(tag, {
                start: new Date(0).toISOString(),
                end: new Date().toISOString()
            })
        } else if (fetchspan === DateRange.WEEK) {
            response = await getApiBazaarItemTagHistoryWeek(tag)
        } else {
            response = await getApiBazaarItemTagHistoryDay(tag)
        }
        
        const data = Array.isArray(response.data) ? response.data : []
        const parsedData = data.map(parseBazaarPrice)
        
        // Sample data on mobile to reduce rendering load
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        if (isMobile && parsedData.length > 100) {
            const step = Math.ceil(parsedData.length / 100)
            return parsedData.filter((_, index) => index % step === 0)
        }
        
        return parsedData
    }

    function getLegendLocalStorageKey(primary: boolean) {
        return `${graphType}-${primary ? 'primary' : 'secondary'}${fetchspan === DateRange.HOUR ? '-hour' : ''}`
    }

    function onRangeChange(timespan: DateRange) {
        setFetchspan(timespan)
        updateChart(timespan)
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, { detail: { timestamp: new Date() } }))
    }

    function setSelectedLegendOptionsFromLocalStorage(primary = chartOptionsPrimary, secondary = chartOptionsSecondary) {
        let legendSelected = localStorage.getItem(BAZAAR_GRAPH_LEGEND_SELECTION)
        if (graphType === GRAPH_TYPE.SPLIT) {
            primary.legend.selected = legendSelected
                ? JSON.parse(legendSelected)[getLegendLocalStorageKey(true)]
                : primary.legend.selected
            secondary.legend.selected = legendSelected
                ? JSON.parse(legendSelected)[getLegendLocalStorageKey(false)]
                : secondary.legend.selected
        } else {
            primary.legend.selected = legendSelected
                ? JSON.parse(legendSelected)[getLegendLocalStorageKey(true)]
                : primary.legend.selected
        }
    }

    const onChartsEvents = useCallback((chartOptions, localStorageKey: string, chartRef: RefObject<ReactECharts | null>): Record<string, Function> => {
        return {
            datazoom: e => {
                let newChartOptions = { ...chartRef.current?.getEchartsInstance().getOption() }
                applyMayorDataToChart(newChartOptions, mayorData, graphType === GRAPH_TYPE.SINGLE ? 10 : 5, e)
                chartRef.current?.getEchartsInstance().setOption({
                    series: newChartOptions.series
                })

                let midPercentage = (e.start + e.end) / 2 / 100
                let midDate = new Date(+chartOptions.xAxis[0].data[Math.ceil(chartOptions.xAxis[0].data.length * midPercentage)])
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
    }, [mayorData, graphType])

    function clearChartData(primary = chartOptionsPrimary, secondary = chartOptionsSecondary) {
        primary.xAxis[0].data = []
        secondary.xAxis[0].data = []

        primary.series.forEach(s => {
            s.data = []
        })

        secondary.series.forEach(s => {
            s.data = []
        })
    }

    function setChartData(prices: BazaarPrice[], mayorData: MayorData[], primary = chartOptionsPrimary, secondary = chartOptionsSecondary) {
        clearChartData(primary, secondary)

        // Ensure chronological order: oldest -> newest
        const ordered = prices.slice().sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        setXAxisData(primary, ordered)

        if (graphType === GRAPH_TYPE.SPLIT) {
            setXAxisData(secondary, ordered)
        }

        ordered.forEach((item, i) => {
            const buyCandle = fetchspan === DateRange.HOUR
                ? item.buyData.price
                : [item.buyData.price, prices[i + 1] ? prices[i + 1].buyData.price : item.buyData.price, item.buyData.min, item.buyData.max]
            
            const sellCandle = fetchspan === DateRange.HOUR
                ? item.sellData.price
                : [item.sellData.price, prices[i + 1] ? prices[i + 1].sellData.price : item.sellData.price, item.sellData.min, item.sellData.max]

            if (graphType === GRAPH_TYPE.SINGLE) {
                primary.series[0].data.push(buyCandle)
                primary.series[1].data.push(item.buyData.min)
                primary.series[2].data.push(item.buyData.max)
                primary.series[3].data.push(item.buyData.volume)
                primary.series[4].data.push(item.buyData.moving)

                primary.series[5].data.push(sellCandle)
                primary.series[6].data.push(item.sellData.min)
                primary.series[7].data.push(item.sellData.max)
                primary.series[8].data.push(item.sellData.volume)
                primary.series[9].data.push(item.sellData.moving)
                applyMayorDataToChart(primary, mayorData, 10)
            } else {
                primary.series[0].data.push(buyCandle)
                primary.series[1].data.push(item.buyData.min)
                primary.series[2].data.push(item.buyData.max)
                primary.series[3].data.push(item.buyData.volume)
                primary.series[4].data.push(item.buyData.moving)

                secondary.series[0].data.push(sellCandle)
                secondary.series[1].data.push(item.sellData.min)
                secondary.series[2].data.push(item.sellData.max)
                secondary.series[3].data.push(item.sellData.volume)
                secondary.series[4].data.push(item.sellData.moving)

                applyMayorDataToChart(primary, mayorData, 5)
                applyMayorDataToChart(secondary, mayorData, 5)
            }
        })

        if (ordered.length > 0) {
            // latest datapoint is the last element after ordering
            setAvgBuyPrice(ordered[ordered.length - 1].buyData.moving)
            setAvgSellPrice(ordered[ordered.length - 1].sellData.moving)
        }
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

    const graphOverlayElement = useMemo(() => {
        return isLoading ? (
            <div className={styles.graphOverlay}>{getLoadingElement()}</div>
        ) : noDataFound && !isLoading ? (
            <div className={styles.graphOverlay}>
                <div style={{ textAlign: 'center' }}>
                    <p>No data found</p>
                </div>
            </div>
        ) : null
    }, [isLoading, noDataFound])

    return (
        <div>
            <Suspense>
                <ItemPriceRange
                    dateRangesToDisplay={[DateRange.HOUR, DateRange.DAY, DateRange.WEEK, DateRange.ALL]}
                    onRangeChange={onRangeChange}
                    disableAllTime={false}
                    item={props.item}
                />
            </Suspense>

            <div>
                <div className={styles.chartsWrapper}>
                    {isSSR ? (
                        <div className={styles.chartWrapperSingle} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={graphType === GRAPH_TYPE.SINGLE ? styles.chartWrapperSingle : styles.chartWrapperSplit}>
                                <h3 className={styles.graphHeadline}>{graphType === GRAPH_TYPE.SINGLE ? 'Bazaar data' : 'Buy data'}</h3>
                                {!isLoading && !noDataFound ? (
                                    <ReactECharts
                                        ref={primaryChartRef}
                                        option={chartOptionsPrimary}
                                        className={styles.chart}
                                        onEvents={onChartsEvents(chartOptionsPrimary, getLegendLocalStorageKey(true), primaryChartRef)}
                                        lazyUpdate={true}
                                        notMerge={false}
                                        opts={{ renderer: 'canvas', locale: 'EN' }}
                                        showLoading={false}
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
                                            onEvents={onChartsEvents(chartOptionsSecondary, getLegendLocalStorageKey(false), secondaryChartRef)}
                                            lazyUpdate={true}
                                            notMerge={false}
                                            opts={{ renderer: 'canvas', locale: 'EN' }}
                                            showLoading={false}
                                        />
                                    ) : (
                                        graphOverlayElement
                                    )}
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
                <div className={styles.additionalInfos}>
                    <span className={styles.avgPrice}>
                        <b>Avg Sell Price:</b>{' '}
                        {isLoading ? (
                            '-'
                        ) : (
                            <span>
                                <Number number={+avgSellPrice.toFixed(1)} /> Coins
                            </span>
                        )}
                    </span>
                    <span className={styles.avgPrice}>
                        <b>Avg Buy Price:</b>{' '}
                        {isLoading ? (
                            '-'
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
                            <SubscribeButton type="bazaar" topic={props.item.tag} />
                        </div>
                        <div>
                            <ShareButton title={'Prices for ' + props.item.name} text="Browse the Bazaar history in Hypixel Skyblock" />
                        </div>
                    </div>
                </div>
                <hr />
                <RelatedItems tag={props.item.tag} isBazaarItem={true} />
                <BazaarSnapshot item={props.item} />
            </div>
        </div>
    )
}

export default BazaarPriceGraph
