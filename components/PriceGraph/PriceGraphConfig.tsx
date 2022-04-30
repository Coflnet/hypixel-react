import { ChartConfiguration } from 'chart.js'
import moment from 'moment'
import { numberWithThousandsSeperators } from '../../utils/Formatter'

let data: ChartConfiguration = {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'price',
                borderColor: '#22A7F0',
                fill: false
            },
            {
                label: 'min',
                borderColor: '#228B22',
                fill: false
            },
            {
                label: 'max',
                borderColor: '#B22222',
                hidden: true,
                fill: false
            },
            {
                label: 'number of items traded',
                borderColor: '#000000',
                fill: true
            }
        ]
    },
    options: {
        maintainAspectRatio: false,
        title: {
            display: false
        },
        animation: {
            duration: 0
        },
        tooltips: {
            mode: 'index',
            intersect: false,
            callbacks: {
                label: function (tooltipItem, data): string {
                    if (tooltipItem.datasetIndex) {
                        let dataSetName = data.datasets![tooltipItem.datasetIndex!].label
                        if (dataSetName === data.datasets![3].label) {
                            return numberWithThousandsSeperators(Math.round(parseInt(tooltipItem.value || '0'))).toString() + ' items sold'
                        }
                    }

                    return numberWithThousandsSeperators(Math.round(parseInt(tooltipItem.value || '0'))).toString() + ' coins'
                },
                title: function (tooltipItem, data) {
                    if (tooltipItem[0] && tooltipItem[0].label) {
                        let d = new Date(tooltipItem[0].label)
                        return d.toLocaleTimeString() + ', ' + d.toLocaleDateString()
                    } else {
                        return '-'
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
                            return numberWithThousandsSeperators(Math.round(parseInt(value.toString())))
                        }
                    }
                }
            ],
            xAxes: [
                {
                    type: 'time'
                }
            ]
        }
    }
}

let option = {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            crossStyle: {
                color: '#999'
            }
        }
    },
    legend: {
        data: ['Price', 'Min', 'Max', 'Number of traded items'],
        selected: {
            Price: true,
            Min: true,
            Max: false,
            'Number of traded items': false
        }
    },
    xAxis: [
        {
            type: 'category',
            data: [],
            axisPointer: {
                type: 'shadow'
            },
            axisLabel: {
                formatter: value => `${new Date(+value).toLocaleDateString()}`
            }
        }
    ],
    yAxis: [
        {
            type: 'value',
            name: 'Price',
            position: 'left',
            axisLabel: {
                formatter: value => `${numberWithThousandsSeperators(value)} Coins`
            }
        },
        {
            type: 'value',
            name: 'Number of traded items',
            position: 'right',
            axisLabel: {
                formatter: value => `${numberWithThousandsSeperators(value)}`
            }
        }
    ],
    series: [
        {
            name: 'Price',
            type: 'line',
            color: '#22A7F0',
            yAxisIndex: 0,
            smooth: true,
            tooltip: {
                valueFormatter: value => `${numberWithThousandsSeperators(value)} Coins`
            },
        },
        {
            name: 'Min',
            type: 'line',
            color: '#228B22',
            yAxisIndex: 0,
            smooth: true,
            tooltip: {
                valueFormatter: value => `${numberWithThousandsSeperators(value)} Coins`
            },
            data: []
        },
        {
            name: 'Max',
            type: 'line',
            color: '#B22222',
            yAxisIndex: 0,
            smooth: true,
            tooltip: {
                valueFormatter: value => `${numberWithThousandsSeperators(value)} Coins`
            },
            data: []
        },
        {
            name: 'Number of traded items',
            type: 'bar',
            color: '#000000',
            areaStyle: {},
            yAxisIndex: 1,
            smooth: true,
            tooltip: {
                valueFormatter: value => `${numberWithThousandsSeperators(value)}`
            },
            data: []
        }
    ]
}

export default option
