/* eslint-disable react-hooks/exhaustive-deps */
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import api from '../../../api/ApiHelper'
import getPriceGraphConfigSingle from './PriceGraphConfigSingle'
import getPriceGraphConfigSplit from './PriceGraphConfigSplit'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../../ItemPriceRange/ItemPriceRange'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { numberWithThousandsSeperators } from '../../../utils/Formatter'
import ShareButton from '../../ShareButton/ShareButton'
import { isClientSideRendering } from '../../../utils/SSRUtils'
import styles from './BazaarPriceGraph.module.css'
import ReactECharts from 'echarts-for-react'
import BazaarSnapshot from './BazaarSnapshot/BazaarSnapshot'
import { getURLSearchParam } from '../../../utils/Parser/URLParser'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { BAZAAR_GRAPH_LEGEND_SELECTION, BAZAAR_GRAPH_TYPE, getSetting, setSetting } from '../../../utils/SettingsUtils'
import { Form } from 'react-bootstrap'
import { useMatomo } from '@datapunt/matomo-tracker-react'

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
    let [isSSR, setIsSSR] = useState(true)
    let { trackEvent } = useMatomo()

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
            setChartData(prices)
        }
    }, [graphType])

    function init() {
        fetchspan = (getURLSearchParam('range') as DateRange) || DEFAULT_DATE_RANGE
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

    function updateChart(fetchspan: DateRange) {
        // active auction is selected
        // no need to get new price data
        if (fetchspan === DateRange.ACTIVE) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        currentLoadingString = JSON.stringify({ tag: props.item.tag, fetchspan })

        loadBazaarPrices(props.item.tag, fetchspan)
            .then(prices => {
                if (!mounted || currentLoadingString !== JSON.stringify({ tag: props.item.tag, fetchspan })) {
                    return
                }
                setPrices(prices)
                setChartData(prices)
                setIsLoading(false)
                setNoDataFound(prices.length === 0)
            })
            .catch(() => {
                setIsLoading(false)
                setNoDataFound(true)
                setAvgBuyPrice(0)
                setAvgBuyPrice(0)
            })
    }

    function checkForSpecialFetchspanConfiguration() {
        if (fetchspan === DateRange.HOUR) {
            // TODO: Fix if switched from day to hour, the min max graph musnt be shown
            chartOptionsPrimary.legend.data = chartOptionsPrimary.legend.data.filter(s => !s.includes('Min') && !s.includes('Max'))
            chartOptionsSecondary.legend.data = chartOptionsSecondary.legend.data.filter(s => !s.includes('Min') && !s.includes('Max'))
            chartOptionsPrimary.series.forEach((s, i) => {
                s.type = 'line'
                if (s.name === 'Min' || s.name === 'Max') {
                    s.tooltip.show = false
                }
            })
            chartOptionsSecondary.series.forEach(s => {
                s.type = 'line'
                if (s.name.includes('Min') || s.name.includes('Max')) {
                    s.tooltip.show = false
                }
            })
        } else {
            chartOptionsPrimary.series[0].type = 'k'
            chartOptionsSecondary.series[0].type = 'k'

            chartOptionsPrimary.series.forEach(s => {
                s.tooltip.show = true
            })
            chartOptionsSecondary.series.forEach(s => {
                s.tooltip.show = true
            })

            if (graphType === GRAPH_TYPE.SINGLE) {
                chartOptionsPrimary.legend.data = getPriceGraphConfigSingle().legend.data
                chartOptionsPrimary.series[3].type = 'k'
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
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, { detail: { timestamp: new Date() } }))
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

    function onChartsEvents(chartOptions, localStorageKey: string): Record<string, Function> {
        return {
            datazoom: e => {
                /*
                if (e.preventDefault) {
                    return
                }
                */
                let mid = (e.start + e.end) / 2
                let midDate = new Date(+chartOptions.xAxis[0].data[Math.ceil(chartOptions.xAxis[0].data.length * (mid / 100))])

                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, { detail: { timestamp: midDate } }))

                    /*
                        primaryChartRef.current.getEchartsInstance().dispatchAction({
                            type: 'dataZoom',
                            start: 0,
                            end: 90,
                            preventDefault: true
                        })
                    */
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

    function setChartData(prices: BazaarPrice[]) {
        clearChartData()

        setXAxisData(chartOptionsPrimary, prices)

        if (graphType === GRAPH_TYPE.SPLIT) {
            setXAxisData(chartOptionsSecondary, prices)
        }

        let sellPriceSum = 0
        let buyPriceSum = 0

        prices.forEach((item, i) => {
            sellPriceSum += item.sellData.price
            buyPriceSum += item.buyData.price

            chartOptionsPrimary.series[0].data.push(
                fetchspan === DateRange.HOUR
                    ? item.buyData.price
                    : [item.buyData.price, prices[i + 1] ? prices[i + 1].buyData.price : item.buyData.price, item.buyData.min, item.buyData.max]
            )

            if (graphType === GRAPH_TYPE.SINGLE) {
                chartOptionsPrimary.series[1].data.push(item.buyData.min?.toFixed(2))
                chartOptionsPrimary.series[2].data.push(item.buyData.max?.toFixed(2))
                chartOptionsPrimary.series[3].data.push(item.buyData.volume?.toFixed(2))
                chartOptionsPrimary.series[4].data.push(item.buyData.moving?.toFixed(2))

                chartOptionsPrimary.series[5].data.push(
                    fetchspan === DateRange.HOUR
                        ? item.sellData.price?.toFixed(2)
                        : [item.sellData.price?.toFixed(2), prices[i + 1] ? prices[i + 1].sellData.price?.toFixed(2) : item.sellData.price?.toFixed(2), item.sellData.min?.toFixed(2), item.sellData.max?.toFixed(2)]
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
                        : [item.sellData.price?.toFixed(2), prices[i + 1] ? prices[i + 1].sellData.price?.toFixed(2) : item.sellData.price?.toFixed(2), item.sellData.min?.toFixed(2), item.sellData.max?.toFixed(2)]
                )
                chartOptionsSecondary.series[1].data.push(item.sellData.min?.toFixed(2))
                chartOptionsSecondary.series[2].data.push(item.sellData.max?.toFixed(2))
                chartOptionsSecondary.series[3].data.push(item.sellData.volume?.toFixed(2))
                chartOptionsSecondary.series[4].data.push(item.sellData.moving?.toFixed(2))
            }
        })

        setChartOptionsPrimary(chartOptionsPrimary)
        setChartOptionsSecondary(chartOptionsSecondary)
        setAvgBuyPrice(buyPriceSum / prices.length)
        setAvgSellPrice(sellPriceSum / prices.length)
    }

    function setXAxisData(chartOptions, prices: BazaarPrice[]) {
        chartOptions.xAxis[0].data = prices.map(p => p.timestamp.getTime())
    }

    function onGraphTypeChange(e: ChangeEvent<HTMLInputElement>) {
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
            <ItemPriceRange
                dateRangesToDisplay={[DateRange.HOUR, DateRange.DAY, DateRange.WEEK, DateRange.ALL]}
                onRangeChange={onRangeChange}
                disableAllTime={false}
                item={props.item}
            />

            <div>
                <div className={styles.chartsWrapper}>
                    {!isSSR ? (
                        <>
                            <div className={graphType === GRAPH_TYPE.SINGLE ? styles.chartWrapperSingle : styles.chartWrapperSplit}>
                                <h3 className={styles.graphHeadline}>{graphType === GRAPH_TYPE.SINGLE ? 'Bazaar data' : 'Buy data'}</h3>
                                {!isLoading && !noDataFound ? (
                                    <ReactECharts
                                        option={chartOptionsPrimary}
                                        className={styles.chart}
                                        onEvents={onChartsEvents(chartOptionsPrimary, getLegendLocalStorageKey(true))}
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
                                            option={chartOptionsSecondary}
                                            className={styles.chart}
                                            onEvents={onChartsEvents(chartOptionsSecondary, getLegendLocalStorageKey(false))}
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
                        <b>Avg Sell Price:</b> {isLoading ? '-' : numberWithThousandsSeperators(+avgSellPrice.toFixed(1)) + ' Coins'}
                    </span>
                    <span className={styles.avgPrice}>
                        <b>Avg Buy Price:</b> {isLoading ? '-' : numberWithThousandsSeperators(+avgBuyPrice.toFixed(1)) + ' Coins'}
                    </span>
                    <div style={{ float: 'left' }} className={styles.additionalInfosButton}>
                        {!isSSR ? (
                            <Form.Control
                                as="select"
                                defaultValue={localStorage.getItem(BAZAAR_GRAPH_TYPE) || DEFAULT_GRAPH_TYPE}
                                className={styles.recentAuctionsFetchType}
                                onChange={onGraphTypeChange}
                            >
                                <option value={GRAPH_TYPE.SINGLE}>Single</option>
                                <option value={GRAPH_TYPE.SPLIT}>Split</option>
                            </Form.Control>
                        ) : null}
                    </div>
                    <div style={{ float: 'right' }}>
                        <ShareButton title={'Prices for ' + props.item.name} text="Browse the Bazaar history in Hypixel Skyblock" />
                    </div>
                </div>
                <hr />
                <BazaarSnapshot item={props.item} />
            </div>
        </div>
    )
}

export default BazaarPriceGraph
