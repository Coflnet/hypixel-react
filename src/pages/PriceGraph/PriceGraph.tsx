import React, { useEffect, useRef, useState } from 'react';
import './PriceGraph.css';
import Chart, { ChartConfiguration } from 'chart.js';
import api from '../../api/ApiHelper';
import priceConfig from './PriceGraphConfig'

interface Props {
    item: Item,
    fetchStart: Date,
    enchantmentFilter?: EnchantmentFilter
}

function PriceGraph(props: Props) {

    const priceChartCanvas = useRef<HTMLCanvasElement>(null);
    let [priceChart, setPriceChart] = useState<Chart>();

    let updateChart = (priceChart: Chart) => {
        api.getItemPrices(props.item.name, props.fetchStart, undefined, props.enchantmentFilter).then((results) => {
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

    useEffect(() => {
        if (priceChartCanvas && priceChartCanvas.current) {
            let chart = priceChart || createChart(priceConfig);
            setPriceChart(chart);
            updateChart(chart);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceChartCanvas, props.item])

    return (
        <div className="price-graph">
            <canvas ref={priceChartCanvas} />
        </div >
    );
}

export default PriceGraph;
