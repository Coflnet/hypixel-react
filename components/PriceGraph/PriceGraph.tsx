/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react'
import Chart, { ChartConfiguration } from 'chart.js'
import api from '../../api/ApiHelper'
import priceConfig from './PriceGraphConfig'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import ShareButton from '../ShareButton/ShareButton'
import ItemFilter, { getPrefillFilter } from '../ItemFilter/ItemFilter'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import RecentAuctions from '../RecentAuctions/RecentAuctions'
import { getItemFilterFromUrl } from '../../utils/Parser/URLParser'
import ActiveAuctions from '../ActiveAuctions/ActiveAuctions'
import { isClientSideRendering } from '../../utils/SSRUtils'
import styles from './PriceGraph.module.css'

interface Props {
    item: Item
}

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function PriceGraph(props: Props) {
    const priceChartCanvas = useRef<HTMLCanvasElement>(null)
    let [priceChart, setPriceChart] = useState<Chart>()
    let [fetchspan, setFetchspan] = useState(DEFAULT_DATE_RANGE)
    let [isLoading, setIsLoading] = useState(false)
    let [noDataFound, setNoDataFound] = useState(false)
    let [avgPrice, setAvgPrice] = useState(0)
    let [filters, setFilters] = useState([] as FilterOptions[])
    let [itemFilter, setItemFilter] = useState<ItemFilter>()
    let [defaultRangeSwitch, setDefaultRangeSwitch] = useState(true)

    let fetchspanRef = useRef(fetchspan)
    fetchspanRef.current = fetchspan

    useEffect(() => {
        mounted = true
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }
        api.filterFor(props.item).then(filters => {
            fetchspan = DEFAULT_DATE_RANGE
            setFetchspan(DEFAULT_DATE_RANGE)
            if (priceChartCanvas && priceChartCanvas.current) {
                if (Object.keys(getItemFilterFromUrl()).length === 0) {
                    let chart = priceChart || createChart(priceConfig)
                    priceChart = chart
                    setPriceChart(chart)
                    if (props.item) {
                        updateChart(chart, fetchspan, getPrefillFilter(filters))
                    }
                }
            }
            setFilters(filters)
        })
    }, [props.item.tag])

    let updateChart = (priceChart: Chart, fetchspan: DateRange, itemFilter?: ItemFilter) => {
        // active auction is selected
        // no need to get new price data
        if (fetchspan === DateRange.ACTIVE) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        priceChart.data.labels = []
        priceChart.data.datasets![0].data = []
        priceChart.update()
        setPriceChart(priceChart)

        currentLoadingString = JSON.stringify({
            tag: props.item.tag,
            fetchspan,
            itemFilter
        })

        api.getItemPrices(props.item.tag, fetchspan as any, itemFilter)
            .then(prices => {
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

                priceChart!.data.labels = prices.map(item => item.time.getTime())
                priceChart!.data.labels = priceChart!.data!.labels!.sort((a, b) => {
                    return (a as number) - (b as number)
                })

                let priceSum = 0
                priceChart!.data.datasets![0].data = []
                priceChart!.data.datasets![1].data = []
                priceChart!.data.datasets![2].data = []
                priceChart!.data.datasets![3].data = []

                prices.forEach(item => {
                    priceSum += item.avg
                    priceChart!.data!.datasets![0].data!.push(item.avg)
                    priceChart!.data!.datasets![1].data!.push(item.min)
                    priceChart!.data!.datasets![2].data!.push(item.max)
                    priceChart!.data!.datasets![3].data!.push(item.volume)
                })

                priceChart.update()
                setAvgPrice(Math.round(priceSum / prices.length))
                setPriceChart(priceChart)
                setNoDataFound(prices.length === 0)
                setIsLoading(false)
            })
            .catch(() => {
                setIsLoading(false)
                setNoDataFound(true)
                setAvgPrice(0)
            })
    }

    let createChart = (chartConfig: ChartConfiguration): Chart => {
        return new Chart(priceChartCanvas.current as HTMLCanvasElement, chartConfig)
    }

    let onRangeChange = (timespan: DateRange) => {
        setFetchspan(timespan)
        if (priceChart && timespan !== DateRange.ACTIVE) {
            updateChart(priceChart!, timespan, itemFilter)
        }
    }

    let onFilterChange = (filter: ItemFilter) => {
        setItemFilter(filter)
        setDefaultRangeSwitch(!defaultRangeSwitch)
        if (fetchspanRef.current !== DateRange.ACTIVE) {
            updateChart(priceChart || createChart(priceConfig), fetchspanRef.current, filter)
        }
    }

    let graphOverlayElement = isLoading ? (
        <div className={styles.graphOverlay}>{getLoadingElement()}</div>
    ) : noDataFound && !isLoading ? (
        <div className={styles.graphOverlay}>
            <div style={{ textAlign: 'center' }}>
                <p>No data found</p>
            </div>
        </div>
    ) : (
        ''
    )

    return (
        <div>
            <ItemFilter filters={filters} onFilterChange={onFilterChange} />
            <ItemPriceRange
                setToDefaultRangeSwitch={defaultRangeSwitch}
                onRangeChange={onRangeChange}
                disableAllTime={itemFilter && JSON.stringify(itemFilter) !== '{}'}
                item={props.item}
            />

            <div style={fetchspan === DateRange.ACTIVE ? { display: 'none' } : {}}>
                <div className={styles.graphCanvasContainer}>
                    {graphOverlayElement}
                    <canvas ref={priceChartCanvas} />
                </div>
                <div className={styles.additionalInfos}>
                    <span className={styles.avgPrice}>
                        <b>Avg Price:</b> {isLoading ? '-' : numberWithThousandsSeperators(avgPrice) + ' Coins'}
                    </span>
                    <div style={{ float: 'left' }} className={styles.additionalInfosButton}>
                        <SubscribeButton type="item" topic={props.item.tag} />
                    </div>
                    <div style={{ float: 'right' }}>
                        <ShareButton
                            title={'Prices for ' + props.item.name}
                            text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock"
                        />
                    </div>
                </div>
                <hr />
                {props.item?.bazaar || fetchspan === DateRange.ACTIVE ? (
                    <p className={styles.bazaarNotice}>This is a bazaar item. There are no recent auctions.</p>
                ) : (
                    <RecentAuctions item={props.item} itemFilter={itemFilter} />
                )}
            </div>
            {fetchspan === DateRange.ACTIVE ? <ActiveAuctions item={props.item} filter={itemFilter} /> : ''}
        </div>
    )
}

export default PriceGraph
