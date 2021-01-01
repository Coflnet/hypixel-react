import React, { useEffect, useRef, useState } from 'react';
import './PriceGraph.css';
import Chart, { ChartConfiguration } from 'chart.js';
import api from '../../api/ApiHelper';
import priceConfig from './PriceGraphConfig'
import { DEFAULT_DATE_RANGE, getTimeSpanFromDateRange, ItemPriceRange } from '../ItemPriceRange/ItemPriceRange';
import { getLoadingElement } from '../../utils/LoadingUtils'

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
        priceChart.data.labels = [];
        priceChart.data.datasets![0].data = [];
        priceChart.options.title!.text = "Price for 1 " + convertItemNameToTitle(props.item.tag);
        priceChart.update();
        setPriceChart(priceChart);

        api.getItemPrices(props.item.tag, fetchspan, undefined, props.enchantmentFilter).then((results) => {
            priceChart.clear();
            priceChart!.data.labels = results.map(item => item.end.getTime());
            priceChart!.data.datasets![0].data = results.map(item => {
                return item.price;
            });
            priceChart!.data.labels = priceChart!.data.labels.sort((a, b) => {
                return (a as number) - (b as number);
            });
            priceChart.update();
            setPriceChart(priceChart);
            setIsLoading(false);
        });
    };

    /**
     * Converts a tag (e.g. WOODEN_AXE) to a item name (e.g. Wooden Axe)
     * - replaces all _ with spaces
     * - lowercases the word exept first letter (with exception of the defined words)
     * @param item 
     */
    let convertItemNameToTitle = (itemTag: string) => {

        // words that should remain lowercase
        const exceptions = ["of", "the"];

        function capitalizeWords(text: string): string {
            return text.replace(/\w\S*/g, function (txt) {
                if (exceptions.findIndex(a => a === txt) > -1) {
                    return txt;
                }
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        let formatted: string = itemTag.replaceAll("_", " ").toLowerCase();
        formatted = capitalizeWords(formatted);
        return formatted;
    }

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
            <ItemPriceRange onRangeChange={onRangeChange} item={props.item} />
            { isLoading ? (
                <div style={{ top: "30vh", position: "absolute", left: "50%", fontSize: 30 }}>
                    <div style={{ position: "relative", left: "-50%" }}>
                        {getLoadingElement()}
                    </div>
                </div>) : ""}
            <canvas ref={priceChartCanvas} />
        </div >
    );
}

export default PriceGraph;
