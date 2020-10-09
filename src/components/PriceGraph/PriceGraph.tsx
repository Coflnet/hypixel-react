import React, { useEffect, useRef, useState } from 'react';
import './PriceGraph.css';
import Chart, { ChartConfiguration } from 'chart.js';
import api from '../../api/ApiHelper';
import priceConfig from './PriceGraphConfig'
import { DEFAULT_DATE_RANGE, getTimeSpanFromDateRange, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange';

interface Props {
    item: Item,
    enchantmentFilter?: EnchantmentFilter
}

function PriceGraph(props: Props) {

    const priceChartCanvas = useRef<HTMLCanvasElement>(null);
    let [priceChart, setPriceChart] = useState<Chart>();
    let [fetchspan, setFetchspan] = useState(getTimeSpanFromDateRange(DEFAULT_DATE_RANGE));

    useEffect(() => {
        if (priceChartCanvas && priceChartCanvas.current) {
            let chart = priceChart || createChart(priceConfig);
            setPriceChart(chart);
            updateChart(chart, fetchspan);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceChartCanvas, props.item])

    let updateChart = (priceChart: Chart, fetchspan: number) => {
        api.getItemPrices(props.item.name, fetchspan, undefined, props.enchantmentFilter).then((results) => {
            priceChart!.data.labels = results.map(item => item.end);
            priceChart!.data.datasets![0].data = results.map(item => {
                return item.price;
            });
            priceChart!.options.title!.text =
                "Price for 1 " + props.item.name;
            priceChart.update();
            setPriceChart(priceChart);
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
            <canvas ref={priceChartCanvas} />
        </div >
    );
}

export default PriceGraph;
