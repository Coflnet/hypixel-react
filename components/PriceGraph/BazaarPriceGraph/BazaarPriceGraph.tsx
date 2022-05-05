/* eslint-disable react-hooks/exhaustive-deps */
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import api from '../../../api/ApiHelper'
import getPriceGraphConfigSingle from './PriceGraphConfigSingle'
import getPriceGraphConfigSplit from './PriceGraphConfigSplit'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../../ItemPriceRange/ItemPriceRange'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { numberWithThousandsSeperators } from '../../../utils/Formatter'
import ShareButton from '../../ShareButton/ShareButton'
import SubscribeButton from '../../SubscribeButton/SubscribeButton'
import { isClientSideRendering } from '../../../utils/SSRUtils'
import styles from './BazaarPriceGraph.module.css'
import ReactECharts from 'echarts-for-react'
import BazaarSnapshot from './BazaarSnapshot/BazaarSnapshot'
import { getURLSearchParam } from '../../../utils/Parser/URLParser'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { BAZAAR_GRAPH_TYPE, getSetting, setSetting } from '../../../utils/SettingsUtils'
import { Form } from 'react-bootstrap'

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

    let fetchspanRef = useRef(fetchspan)
    fetchspanRef.current = fetchspan

    useEffect(() => {
        mounted = true

        setIsSSR(false)
        setGraphType((localStorage.getItem(BAZAAR_GRAPH_TYPE) as GRAPH_TYPE) || DEFAULT_GRAPH_TYPE)

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }

        let f = (getURLSearchParam('range') as DateRange) || DEFAULT_DATE_RANGE
        setFetchspan(f)
        updateChart(f)
    }, [props.item.tag])

    useEffect(() => {
        if (prices.length > 0) {
            let chartOptions = graphType === GRAPH_TYPE.SINGLE ? chartOptionsSingle : chartOptionsSplit
            setChartOptionsPrimary(chartOptions)
            chartOptionsPrimary = chartOptions
            setChartData(prices)
        }
    }, [graphType])

    let updateChart = (fetchspan: DateRange) => {
        // active auction is selected
        // no need to get new price data
        if (fetchspan === DateRange.ACTIVE) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        currentLoadingString = JSON.stringify({ tag: props.item.tag, fetchspan })

        api.getBazaarPrices(props.item.tag, fetchspan as any)
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

    let onRangeChange = (timespan: DateRange) => {
        setFetchspan(timespan)
        fetchspan = timespan
        updateChart(timespan)
    }

    function onChartsEvents(chartOptions): Record<string, Function> {
        return {
            datazoom: e => {
                let mid = (e.start + e.end) / 2
                let midDate = new Date(+chartOptions.xAxis[0].data[Math.ceil(chartOptions.xAxis[0].data.length * (mid / 100))])

                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, { detail: { timestamp: midDate } }))
                }, 1000)
            }
        }
    }

    function clearChartData() {
        chartOptionsPrimary.xAxis[0].data = []
        chartOptionsPrimary.series[0].data = []
        chartOptionsPrimary.series[1].data = []
        chartOptionsPrimary.series[2].data = []
        chartOptionsPrimary.series[3].data = []

        if (graphType === GRAPH_TYPE.SINGLE && chartOptionsPrimary.series.length >= 8) {
            chartOptionsPrimary.series[4].data = []
            chartOptionsPrimary.series[5].data = []
            chartOptionsPrimary.series[6].data = []
            chartOptionsPrimary.series[7].data = []
        } else {
            chartOptionsSecondary.xAxis[0].data = []
            chartOptionsSecondary.series[0].data = []
            chartOptionsSecondary.series[1].data = []
            chartOptionsSecondary.series[2].data = []
            chartOptionsSecondary.series[3].data = []
        }
    }

    function setChartData(prices: BazaarPrice[]) {

        clearChartData()

        setXAxisData(chartOptionsPrimary, prices)

        if (graphType === GRAPH_TYPE.SPLIT) {
            setXAxisData(chartOptionsSecondary, prices)
        }

        let sellPriceSum = 0
        let buyPriceSum = 0

        prices.forEach(item => {
            sellPriceSum += item.sellData.price
            buyPriceSum += item.buyData.price

            chartOptionsPrimary.series[0].data.push(item.buyData.price)
            chartOptionsPrimary.series[1].data.push(item.buyData.min)
            chartOptionsPrimary.series[2].data.push(item.buyData.max)
            chartOptionsPrimary.series[3].data.push(item.buyData.volume)
            chartOptionsPrimary.series[4].data.push(item.buyData.moving)

            if (graphType === GRAPH_TYPE.SINGLE) {
                chartOptionsPrimary.series[5].data.push(item.sellData.price)
                chartOptionsPrimary.series[6].data.push(item.sellData.min)
                chartOptionsPrimary.series[7].data.push(item.sellData.max)
                chartOptionsPrimary.series[8].data.push(item.sellData.volume)
                chartOptionsPrimary.series[9].data.push(item.sellData.moving)
            } else {
                chartOptionsSecondary.series[0].data.push(item.sellData.price)
                chartOptionsSecondary.series[1].data.push(item.sellData.min)
                chartOptionsSecondary.series[2].data.push(item.sellData.max)
                chartOptionsSecondary.series[3].data.push(item.sellData.volume)
                chartOptionsSecondary.series[4].data.push(item.sellData.moving)
            }
        })

        console.log(chartOptionsPrimary.series[0].data.length)

        setChartOptionsPrimary(chartOptionsPrimary)
        setChartOptionsSecondary(chartOptionsSecondary)
        setAvgBuyPrice(buyPriceSum / prices.length)
        setAvgSellPrice(sellPriceSum / prices.length)
    }

    function setXAxisData(chartOptions, prices: BazaarPrice[]) {
        chartOptions.xAxis[0].data = prices.map(p => p.timestamp).map(timestamp => timestamp.getTime())
        chartOptions.xAxis[0].data = chartOptions.xAxis[0].data.sort((a, b) => {
            return (a as number) - (b as number)
        })
    }

    function onGraphTypeChange(e: ChangeEvent<HTMLInputElement>) {
        let graphType = e.target.value
        setGraphType(graphType as GRAPH_TYPE)
        localStorage.setItem(BAZAAR_GRAPH_TYPE, graphType)
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
                dateRangesToDisplay={[DateRange.HOUR, DateRange.DAY, DateRange.WEEK]}
                onRangeChange={onRangeChange}
                disableAllTime={false}
                item={props.item}
            />

            <div>
                <div className={styles.chartsWrapper}>
                    {!isSSR ? (
                        <>
                            <div className={graphType === GRAPH_TYPE.SINGLE ? styles.chartWrapperSingle : styles.chartWrapperSplit}>
                                <h3 className={styles.graphHeadline}>Buy data</h3>
                                {graphOverlayElement}
                                <ReactECharts option={chartOptionsPrimary} className={styles.chart} onEvents={onChartsEvents(chartOptionsPrimary)} />
                            </div>
                            {graphType === GRAPH_TYPE.SPLIT ? (
                                <div className={styles.chartWrapperSplit}>
                                    <h3 className={styles.graphHeadline}>Sell data</h3>
                                    {graphOverlayElement}
                                    <ReactECharts option={chartOptionsSecondary} className={styles.chart} onEvents={onChartsEvents(chartOptionsSecondary)} />
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
                <div className={styles.additionalInfos}>
                    <span className={styles.avgPrice}>
                        <b>Avg Sell price:</b> {isLoading ? '-' : numberWithThousandsSeperators(avgSellPrice) + ' Coins'}
                    </span>
                    <span className={styles.avgPrice}>
                        <b>Avg Buy price:</b> {isLoading ? '-' : numberWithThousandsSeperators(avgBuyPrice) + ' Coins'}
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
                        <ShareButton
                            title={'Prices for ' + props.item.name}
                            text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock"
                        />
                    </div>
                </div>
                <hr />
                <BazaarSnapshot item={props.item} />
            </div>
        </div>
    )
}

export default BazaarPriceGraph
