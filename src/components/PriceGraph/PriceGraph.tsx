import React, { useEffect, useRef, useState } from 'react';
import './PriceGraph.css';
import Chart, { ChartConfiguration } from 'chart.js';
import api from '../../api/ApiHelper';
import priceConfig from './PriceGraphConfig'
import { DEFAULT_DATE_RANGE, getTimeSpanFromDateRange, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange';
import { Spinner } from 'react-bootstrap';

interface Props {
    item: Item,
    enchantmentFilter?: EnchantmentFilter
}

function PriceGraph(props: Props) {

    const priceChartCanvas = useRef<HTMLCanvasElement>(null);
    let [priceChart, setPriceChart] = useState<Chart>();
    let [fetchspan, setFetchspan] = useState(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE));
    let [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (priceChartCanvas && priceChartCanvas.current) {
            let chart = priceChart || createChart(priceConfig);
            setPriceChart(chart);
            updateChart(chart, fetchspan);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceChartCanvas, props.item, props.enchantmentFilter])

    let updateChart = (priceChart: Chart, fetchspan: number) => {
        setIsLoading(true);
        priceChart!.data.labels = [];
        priceChart!.data.datasets![0].data = [];
        priceChart!.update();
        setPriceChart(priceChart);

        api.getItemPrices(props.item.name, fetchspan, undefined, props.enchantmentFilter).then((results) => {
            priceChart.clear();
            priceChart!.data.labels = results.map(item => item.end.getTime());
            priceChart!.data.datasets![0].data = results.map(item => {
                return item.price;
            });
            priceChart!.data.labels = priceChart!.data.labels.sort((a, b) => {
                return (a as number) - (b as number);
            });
            priceChart!.options.title!.text =
                "Price for 1 " + props.item.name;
            priceChart.update();
            setPriceChart(priceChart);
            setIsLoading(false);
        });
    };

    let createChart = (chartConfig: ChartConfiguration): Chart => {
        return new Chart(priceChartCanvas.current as HTMLCanvasElement, chartConfig);
    };

    let onRangeChange = (timespan: number) => {
        setFetchspan(timespan);
        updateChart(priceChart!, timespan);
    }

    return (
        <div className="price-graph">
            <ItemPriceRange onRangeChange={onRangeChange} />
            { isLoading ? (<div style={{ top: "30vh", position: "absolute", left: "50%", fontSize: 30, textAlign: "center" }}>
                <div style={{ position: "relative", left: "-50%" }}>
                    <span><Spinner animation="grow" variant="primary"></Spinner>
                        <Spinner animation="grow" variant="primary"></Spinner>
                        <Spinner animation="grow" variant="primary"></Spinner></span>
                    <p>Loading Data...</p>
                </div>
            </div>) : ""}
            <canvas ref={priceChartCanvas} />
        </div >
    );
}

export default PriceGraph;
