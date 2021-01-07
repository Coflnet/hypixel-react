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

interface Props {
    item: Item,
    enchantmentFilter?: EnchantmentFilter,
    onPriceGraphLoadingChange?(state: boolean): void
}

function PriceGraph(props: Props) {

    const priceChartCanvas = useRef<HTMLCanvasElement>(null);
    let [priceChart, setPriceChart] = useState<Chart>();
    let [fetchspan, setFetchspan] = useState(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE));
    let [isLoading, setIsLoadingState] = useState(false);
    let [noDataFound, setNoDataFound] = useState(false);
    let [avgPrice, setAvgPrice] = useState(0);

    useEffect(() => {
        if (priceChartCanvas && priceChartCanvas.current && props.enchantmentFilter) {
            let chart = priceChart || createChart(priceConfig);
            setPriceChart(chart);
            if (props.item) {
                updateChart(chart, fetchspan);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.enchantmentFilter])

    useEffect(() => {
        fetchspan = getTimeSpanFromDateRange(DEFAULT_DATE_RANGE);
        setFetchspan(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE))
        if (priceChartCanvas && priceChartCanvas.current && props.enchantmentFilter === undefined) {
            let chart = priceChart || createChart(priceConfig);
            setPriceChart(chart);
            if (props.item) {
                updateChart(chart, fetchspan);
            }
        }
    }, [props.item.tag])

    let updateChart = (priceChart: Chart, fetchspan: number) => {
        setIsLoading(true);
        priceChart.data.labels = [];
        priceChart.data.datasets![0].data = [];
        priceChart.update();
        setPriceChart(priceChart);

        api.getItemPrices(props.item.tag, fetchspan, undefined, props.enchantmentFilter).then((results) => {
            priceChart!.data.labels = results.map(item => item.end.getTime());

            let priceSum = 0;
            priceChart!.data.datasets![0].data = results.map(item => {
                priceSum += item.price;
                return item.price;
            });
            setAvgPrice(Math.round(priceSum / results.length))
            priceChart!.data.labels = priceChart!.data.labels.sort((a, b) => {
                return (a as number) - (b as number);
            });
            priceChart.update();

            setPriceChart(priceChart);
            setNoDataFound(results.length === 0)
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

    let setIsLoading = (state: boolean) => {
        setIsLoadingState(state);
        if (props.onPriceGraphLoadingChange) {
            props.onPriceGraphLoadingChange(state);
        }
    }

    return (
        <div className="price-graph">
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
                <p style={{float: "left", marginLeft: "10px"}}><b>Avg:</b> {isLoading ? "-" : numberWithThousandsSeperators(avgPrice) + " Coins"}</p>
                <ShareButton title={"Prices for " + props.item.name} text="See list, search and filter item prices from the auction house and bazar in Hypixel Skyblock" />
            </div>
        </div >
    );
}

export default PriceGraph;
