import { ChartConfiguration } from "chart.js";
import { numberWithThousandsSeperators } from "../../utils/Formatter";

export let data: ChartConfiguration = {
    type: "line",
    data: {
        datasets: [
            {
                label: "price",
                borderColor: "#22A7F0",
                fill: false
            },
            {
                label: "min",
                borderColor: "#228B22",
                fill: false
            },
            {
                label: "max",
                borderColor: "#B22222",
                hidden: true,
                fill: false
            },
            {
                label: "number of items traded",
                borderColor: "#000000",
                fill: true
            }
        ]
    },
    options: {
        maintainAspectRatio: false,
        title: {
            display: false,
        },
        animation: {
            duration: 0
        },
        tooltips: {
            mode: "index",
            intersect: false,
            callbacks: {
                label: function (tooltipItem, data): string {
                    if (tooltipItem.datasetIndex) {
                        let dataSetName = data.datasets![tooltipItem.datasetIndex!].label;
                        if (dataSetName === data.datasets![3].label) {
                            return numberWithThousandsSeperators(Math.round(parseInt(tooltipItem.value || "0"))).toString() + " items sold"
                        }
                    }

                    return numberWithThousandsSeperators(Math.round(parseInt(tooltipItem.value || "0"))).toString() + " coins";
                },
                title: function (tooltipItem, data) {
                    if (tooltipItem[0] && tooltipItem[0].label) {
                        let d = new Date(tooltipItem[0].label);
                        return d.toLocaleTimeString() + ", " + d.toLocaleDateString();
                    } else {
                        return "-";
                    }
                }
            }
        },
        elements: {
            point: {
                radius: 0
            }
        },
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true,
                        callback: function (value, index, values) {
                            return numberWithThousandsSeperators(Math.round(parseInt(value.toString())));
                        }
                    }
                }
            ],
            xAxes: [
                {
                    type: "time"
                }
            ]
        }
    }
}

export default data;