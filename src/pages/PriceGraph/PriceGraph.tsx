import React, { useEffect, useRef } from 'react';
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

    let updateChart = (priceChart: Chart) => {
        api.getItemPrices(props.item.name, props.fetchStart, undefined, props.enchantmentFilter).then((results) => {
            priceChart!.data.labels = results.map(item => item.end);
            priceChart!.data.datasets![0].data = results.map(item => {
                return item.price;
            });
            priceChart.update();
        });
    };

    let createChart = (chartConfig: ChartConfiguration): Chart => {
        return new Chart(priceChartCanvas.current as HTMLCanvasElement, chartConfig);
    };

    useEffect(() => {
        if (priceChartCanvas && priceChartCanvas.current) {
            updateChart(createChart(priceConfig));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceChartCanvas])

    return (
        <div className="price-graph">
            <canvas ref={priceChartCanvas} />
        </div >
    );
}

export default PriceGraph;
