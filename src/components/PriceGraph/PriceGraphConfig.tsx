import { ChartConfiguration } from "chart.js";

export let data: ChartConfiguration = {
    type: "line",
    data: {
        datasets: [
            {
                label: "price",
                borderColor: "#22A7F0",
                fill: false
            }
        ]
    },
    options: {
        maintainAspectRatio: false,
        title: {
            display: true,
            text: "Item price"
        },
        tooltips: {
            mode: "index",
            intersect: false,
            callbacks: {
                label: function (tooltipItem, data): string {
                    return Math.round(parseInt(tooltipItem.value || "0")).toString();
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
                            return Math.round(parseInt(value.toString()));
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