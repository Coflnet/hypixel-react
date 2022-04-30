/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react'
import api from '../../api/ApiHelper'
import graphConfig from './PriceGraphConfig'
import { DateRange, DEFAULT_DATE_RANGE, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import ShareButton from '../ShareButton/ShareButton'
import ItemFilter from '../ItemFilter/ItemFilter'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import RecentAuctions from '../RecentAuctions/RecentAuctions'
import { getItemFilterFromUrl } from '../../utils/Parser/URLParser'
import ActiveAuctions from '../ActiveAuctions/ActiveAuctions'
import { isClientSideRendering } from '../../utils/SSRUtils'
import styles from './PriceGraph.module.css'
import ReactECharts from 'echarts-for-react'

interface Props {
    item: Item
}

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function PriceGraph(props: Props) {
    let [fetchspan, setFetchspan] = useState(DEFAULT_DATE_RANGE)
    let [isLoading, setIsLoading] = useState(false)
    let [noDataFound, setNoDataFound] = useState(false)
    let [avgPrice, setAvgPrice] = useState(0)
    let [filters, setFilters] = useState([] as FilterOptions[])
    let [itemFilter, setItemFilter] = useState<ItemFilter>()
    let [isItemFilterPrefill, setIsItemFilterPrefill] = useState<boolean>(true)
    let [defaultRangeSwitch, setDefaultRangeSwitch] = useState(true)
    let [chartOptions, setChartOptions] = useState(graphConfig)

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
        loadFilters()
    }, [props.item.tag])

    useEffect(() => {
        fetchspan = DEFAULT_DATE_RANGE
        setFetchspan(DEFAULT_DATE_RANGE)
        if (Object.keys(getItemFilterFromUrl()).length === 0) {
            setIsItemFilterPrefill(false)
            if (props.item) {
                updateChart(fetchspan, undefined)
            }
        }
    }, [props.item.tag])

    let updateChart = (fetchspan: DateRange, itemFilter?: ItemFilter) => {
        // active auction is selected
        // no need to get new price data
        if (fetchspan === DateRange.ACTIVE) {
            setIsLoading(false)
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

                chartOptions.xAxis[0].data = prices.map(item => item.time.getTime())
                chartOptions.xAxis[0].data = chartOptions.xAxis[0].data.sort((a, b) => {
                    return (a as number) - (b as number)
                })

                let priceSum = 0

                prices.forEach(item => {
                    priceSum += item.avg
                    chartOptions.series[0].data.push(item.avg)
                    chartOptions.series[1].data.push(item.min)
                    chartOptions.series[2].data.push(item.max)
                    chartOptions.series[3].data.push(item.volume)
                })

                setAvgPrice(Math.round(priceSum / prices.length))
                setNoDataFound(prices.length === 0)
                setIsLoading(false)
                setTimeout(() => {
                    setIsItemFilterPrefill(false)
                }, 100)

                setChartOptions(chartOptions)
            })
            .catch(() => {
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
        setItemFilter(filter)
        setDefaultRangeSwitch(!defaultRangeSwitch)
        if (fetchspanRef.current !== DateRange.ACTIVE) {
            updateChart(fetchspanRef.current, filter)
        }
    }

    function loadFilters() {
        api.filterFor(props.item).then(filters => {
            setFilters(filters)
        })
    }

    return (
        <div>
            <ItemFilter filters={filters} onFilterChange={onFilterChange} isPrefill={isItemFilterPrefill} />
            <ItemPriceRange
                setToDefaultRangeSwitch={defaultRangeSwitch}
                onRangeChange={onRangeChange}
                disableAllTime={itemFilter && JSON.stringify(itemFilter) !== '{}'}
                item={props.item}
            />

            <div style={fetchspan === DateRange.ACTIVE ? { display: 'none' } : {}}>
                {chartOptions.xAxis[0].data.length > 0 ? <ReactECharts option={chartOptions} className={styles.chart} /> : null}
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
