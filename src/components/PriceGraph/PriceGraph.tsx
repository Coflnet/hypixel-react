/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import './PriceGraph.css';
import Chart, { ChartConfiguration } from 'chart.js';
import api from '../../api/ApiHelper';
import priceConfig from './PriceGraphConfig'
import { useLocation } from "react-router-dom";
import { DEFAULT_DATE_RANGE, getTimeSpanFromDateRange, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange';
import { getLoadingElement } from '../../utils/LoadingUtils'
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import ShareButton from '../ShareButton/ShareButton';
import ItemFilter from '../ItemFilter/ItemFilter';
import SubscribeButton from '../SubscribeButton/SubscribeButton';
import RecentAuctions from '../RecentAuctions/RecentAuctions';
import { getItemFilterFromUrl } from '../../utils/Parser/URLParser';
import ActiveAuctions from '../ActiveAuctions/ActiveAuctions';

interface Props {
    item: Item
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function PriceGraph(props: Props) {

    const priceChartCanvas = useRef<HTMLCanvasElement>(null);
    let [priceChart, setPriceChart] = useState<Chart>();
    let [fetchspan, setFetchspan] = useState(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE));
    let [isLoading, setIsLoading] = useState(false);
    let [noDataFound, setNoDataFound] = useState(false);
    let [avgPrice, setAvgPrice] = useState(0);
    let [filters, setFilters] = useState([] as string[]);
    let [itemFilter, setItemFilter] = useState<ItemFilter>();
    let [isItemFilterPrefill, setIsItemFilterPrefill] = useState<boolean>(true);
    let [defaultRangeSwitch, setDefaultRangeSwitch] = useState(true);


    let fetchspanRef = useRef(fetchspan);
    fetchspanRef.current = fetchspan;

    useEffect(() => {
        mounted = true;
        loadFilters();
    }, [])

    useEffect(() => {
        fetchspan = getTimeSpanFromDateRange(DEFAULT_DATE_RANGE);
        setFetchspan(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE))
        if (priceChartCanvas && priceChartCanvas.current) {
            if (Object.keys(getItemFilterFromUrl()).length === 0) {
                setIsItemFilterPrefill(false);
                let chart = priceChart || createChart(priceConfig);
                priceChart = chart;
                setPriceChart(chart);
                if (props.item) {
                    updateChart(chart, fetchspan, undefined);
                }
            }

        }

        return () => {
            mounted = false;
        };

    }, [props.item.tag])

    let updateChart = (priceChart: Chart, fetchspan: number, itemFilter?: ItemFilter) => {
        setIsLoading(true);
        priceChart.data.labels = [];
        priceChart.data.datasets![0].data = [];
        priceChart.update();
        setPriceChart(priceChart);

        api.getItemPrices(props.item.tag, fetchspan, itemFilter).then((result) => {

            if (!mounted) {
                return;
            }

            priceChart!.data.labels = result.prices.map(item => item.time.getTime());
            priceChart!.data.labels = priceChart!.data!.labels!.sort((a, b) => {
                return (a as number) - (b as number);
            });

            let priceSum = 0;
            priceChart!.data.datasets![0].data = [];
            priceChart!.data.datasets![1].data = [];
            priceChart!.data.datasets![2].data = [];
            priceChart!.data.datasets![3].data = [];

            result.prices.forEach(item => {
                priceSum += item.avg;
                priceChart!.data!.datasets![0].data!.push(item.avg);
                priceChart!.data!.datasets![1].data!.push(item.min);
                priceChart!.data!.datasets![2].data!.push(item.max);
                priceChart!.data!.datasets![3].data!.push(item.volume);
            });

            priceChart.update();
            setAvgPrice(Math.round(priceSum / result.prices.length))
            setPriceChart(priceChart);
            setNoDataFound(result.prices.length === 0)
            setIsLoading(false);
            setTimeout(() => {
                setIsItemFilterPrefill(false);
            }, 100);
        }).catch(() => {
            setIsLoading(false);
            setNoDataFound(true);
            setAvgPrice(0);
        });
    };

    let createChart = (chartConfig: ChartConfiguration): Chart => {
        return new Chart(priceChartCanvas.current as HTMLCanvasElement, chartConfig);
    };

    let onRangeChange = (timespan: number) => {
        setFetchspan(timespan);
        if (priceChart && timespan > 0) {
            updateChart(priceChart!, timespan, itemFilter);
        }
    }

    let onFilterChange = (filter: ItemFilter) => {
        setItemFilter(filter);
        setDefaultRangeSwitch(!defaultRangeSwitch);
        setTimeout(() => {
            if (fetchspanRef.current > 0) {
                updateChart(priceChart || createChart(priceConfig), fetchspanRef.current, filter);
            }
        }, 100)
    }

    function loadFilters() {
        api.filterFor(props.item).then(filters => {
            setFilters(filters.map(f => f.name));
        });
    }

    let graphOverlayElement = (
        isLoading ?
            <div className="graph-overlay">
                {getLoadingElement()}
            </div> :
            noDataFound && !isLoading ?
                <div className="graph-overlay">
                    <div style={{ textAlign: "center" }}>
                        <p>No data found</p>
                    </div>
                </div> : ""
    );

    return (
        <div className="price-graph">

            <ItemFilter disabled={isLoading} filters={filters} onFilterChange={onFilterChange} isPrefill={isItemFilterPrefill} />
            <ItemPriceRange setToDefaultRangeSwitch={defaultRangeSwitch} onRangeChange={onRangeChange} disabled={isLoading} disableAllTime={itemFilter && JSON.stringify(itemFilter) !== "{}"} item={props.item} />

            <div style={fetchspan <= 0 ? { display: "none" } : {}}>
                <div className="graph-canvas-container">
                    {graphOverlayElement}
                    <canvas ref={priceChartCanvas} />
                </div>
                <div className="additional-infos">
                    <span className="avg-price"><b>Avg Price:</b> {isLoading ? "-" : numberWithThousandsSeperators(avgPrice) + " Coins"}</span>
                    <div style={{ float: "left" }} className="additional-infos-button"><SubscribeButton type="item" topic={props.item.tag} /></div>
                    <div style={{ float: "right" }}><ShareButton title={"Prices for " + props.item.name} text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock" /></div>
                </div>
                <hr />
                {props.item?.bazaar || fetchspan <= 0 ? <p className="bazaar-notice">This is a bazaar item. There are no recent auctions.</p> : <RecentAuctions fetchspan={fetchspan} item={props.item} itemFilter={itemFilter} />}
            </div>
            <div style={fetchspan > 0 ? { display: "none" } : {}}>
                <ActiveAuctions item={props.item} filter={itemFilter} />
            </div>
        </div >
    );
}

export default PriceGraph;
