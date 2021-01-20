/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import './PriceGraph.css';
import Chart, { ChartConfiguration } from 'chart.js';
import api from '../../api/ApiHelper';
import priceConfig from './PriceGraphConfig'
import { DEFAULT_DATE_RANGE, getTimeSpanFromDateRange, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange';
import { getLoadingElement } from '../../utils/LoadingUtils'
import { numberWithThousandsSeperators } from '../../utils/Formatter';
import ShareButton from '../ShareButton/ShareButton';
import EnchantmentFilter from '../EnchantmentFilter/EnchantmentFilter';
import SubscribeButton from '../SubscribeButton/SubscribeButton';

interface Props {
    item: Item
}

function PriceGraph(props: Props) {

    const priceChartCanvas = useRef<HTMLCanvasElement>(null);
    let [priceChart, setPriceChart] = useState<Chart>();
    let [fetchspan, setFetchspan] = useState(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE));
    let [isLoading, setIsLoading] = useState(false);
    let [noDataFound, setNoDataFound] = useState(false);
    let [avgPrice, setAvgPrice] = useState(0);
    let [isFilterable, setIsFilterable] = useState(false);

    useEffect(() => {
        fetchspan = getTimeSpanFromDateRange(DEFAULT_DATE_RANGE);
        setFetchspan(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE))
        if (priceChartCanvas && priceChartCanvas.current) {
            let chart = priceChart || createChart(priceConfig);
            setPriceChart(chart);
            if (props.item) {
                updateChart(chart, fetchspan, undefined);
            }
        }
    }, [props.item.tag])

    let updateChart = (priceChart: Chart, fetchspan: number, enchantmentFilter?: EnchantmentFilter) => {
        setIsLoading(true);
        priceChart.data.labels = [];
        priceChart.data.datasets![0].data = [];
        priceChart.update();
        setPriceChart(priceChart);

        api.getItemPrices(props.item.tag, fetchspan, undefined, enchantmentFilter).then((result) => {

            priceChart!.data.labels = result.prices.map(item => item.time.getTime());
            priceChart!.data.labels = priceChart!.data.labels.sort((a, b) => {
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
            setIsFilterable(result.filterable);
            setAvgPrice(Math.round(priceSum / result.prices.length))
            setPriceChart(priceChart);
            setNoDataFound(result.prices.length === 0)
            setIsLoading(false);
        });
    };

    let createChart = (chartConfig: ChartConfiguration): Chart => {
        return new Chart(priceChartCanvas.current as HTMLCanvasElement, chartConfig);
    };

    let onRangeChange = (timespan: number) => {
        setFetchspan(timespan);
        if (priceChart) {
            updateChart(priceChart!, timespan);
        }
    }

    return (
        <div className="price-graph">
            {isFilterable ? <EnchantmentFilter disabled={isLoading} onFilterChange={(filter) => { updateChart(priceChart || createChart(priceConfig), fetchspan, filter) }} /> : ""}
            <ItemPriceRange onRangeChange={onRangeChange} disabled={isLoading} item={props.item} />
            { isLoading ? (
                <div className="graph-overlay">
                    <div style={{ position: "relative", left: "-50%" }}>
                        {getLoadingElement()}
                    </div>
                </div>) : ""}
            {noDataFound && !isLoading ?
                <div className="graph-overlay">
                    <div style={{ position: "relative", left: "-50%" }}>
                        <div style={{ textAlign: "center" }}>
                            <p>No data found</p>
                        </div>
                    </div>
                </div> : ""}
            <div className="graph-canvas-container">
                <canvas ref={priceChartCanvas} />
            </div>
            <div className="additional-infos">
                <span style={{ position: "relative", width: "80px", textAlign: "left" }}><b>Avg Price:</b> {isLoading ? "-" : numberWithThousandsSeperators(avgPrice) + " Coins"}</span>
                <div style={{ position: "relative", flex: "1 1 auto" }}><SubscribeButton topic={props.item.tag} /></div>
                <div style={{ position: "relative", flex: "1 1 auto" }}><ShareButton title={"Prices for " + props.item.name} text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock" /></div>
            </div>
        </div >
    );
}

export default PriceGraph;
