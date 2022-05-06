import { numberWithThousandsSeperators } from '../../../utils/Formatter'

function getPriceGraphConfigSplit() {
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                },
                label: {
                    formatter: axisObject => {
                        if (axisObject.axisDimension === 'y') {
                            return `${numberWithThousandsSeperators(axisObject.value)}`
                        }
                        let d = new Date(+axisObject.value)
                        return d.toLocaleTimeString() + ', ' + d.toLocaleDateString()
                    }
                }
            }
        },
        legend: {
            data: ['Price', 'Min', 'Max', 'Volume', 'Moving'],
            selected: {
                Price: true,
                Min: true,
                Max: false,
                Volume: false,
                Moving: false
            },
            icon: 'roundRect',
            itemStyle: {},
            inactiveColor: '#545454',
            textStyle: {
                color: 'rgb(255, 255, 255)'
            }
        },
        dataZoom: [
            {
                id: 'dataZoomX',
                type: 'slider',
                xAxisIndex: [0],
                filterMode: 'filter'
            }
        ],
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
                },
                min: function ({ min }) {
                    return Math.round(min * 0.9)
                },
                max: function ({ max }) {
                    return Math.round(max * 1.1)
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
                symbol: 'none',
                tooltip: {
                    valueFormatter: value => `${numberWithThousandsSeperators(value)} Coins`
                }
            },
            {
                name: 'Min',
                type: 'line',
                color: '#228B22',
                yAxisIndex: 0,
                smooth: true,
                symbol: 'none',
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
                symbol: 'none',
                tooltip: {
                    valueFormatter: value => `${numberWithThousandsSeperators(value)} Coins`
                },
                data: []
            },
            {
                name: 'Volume',
                type: 'line',
                color: '#545454',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'none',
                tooltip: {
                    valueFormatter: value => `${numberWithThousandsSeperators(value)}`
                },
                data: []
            },
            {
                name: 'Moving',
                type: 'line',
                yAxisIndex: 0,
                smooth: true,
                symbol: 'none',
                tooltip: {
                    valueFormatter: value => `${numberWithThousandsSeperators(value)}`
                },
                data: []
            }
        ]
    }
}

export default getPriceGraphConfigSplit
