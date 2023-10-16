import { formatAsCoins, getLocalDateAndTime, numberWithThousandsSeparators } from '../../../utils/Formatter'

const ANIMATION_THRESHOLD = 200

function getPriceGraphConfigSplit() {
    return {
        tooltip: {
            trigger: 'axis',
            className: 'priceGraphTooltip',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                },
                label: {
                    formatter: axisObject => {
                        if (axisObject.axisDimension === 'y') {
                            return `${numberWithThousandsSeparators(axisObject.value)}`
                        }
                        return getLocalDateAndTime(new Date(+axisObject.value))
                    }
                }
            }
        },
        legend: {
            data: ['Price', 'Min', 'Max', 'Volume', 'Moving'],
            selected: {
                Price: true,
                Min: false,
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
                filterMode: 'filter',
                labelFormatter: (index, value) => `${new Date(+value).toLocaleDateString()}`
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
                    formatter: formatAsCoins
                },
                min: function ({ min, max }) {
                    return Math.floor(min - (max - min) * 0.1)
                },
                max: function ({ min, max }) {
                    return Math.ceil(max + (max - min) * 0.1)
                }
            },
            {
                type: 'value',
                name: 'Number of traded items',
                position: 'right',
                axisLabel: {
                    formatter: numberWithThousandsSeparators
                }
            }
        ],
        series: [
            {
                name: 'Price',
                type: 'k',
                color: '#32CD32',
                yAxisIndex: 0,
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 4
                },
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: value => {
                        if (!value || (value && value.length === 0)) {
                            return ''
                        }
                        return formatAsCoins(value)
                    }
                },
                data: [] as any[]
            },
            {
                name: 'Min',
                type: 'line',
                color: '#228B22',
                yAxisIndex: 0,
                smooth: true,
                symbol: 'none',
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: formatAsCoins
                },
                data: [] as any[]
            },
            {
                name: 'Max',
                type: 'line',
                color: '#B22222',
                yAxisIndex: 0,
                smooth: true,
                symbol: 'none',
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: formatAsCoins
                },
                data: [] as any[]
            },
            {
                name: 'Volume',
                type: 'line',
                color: '#4B0082',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'none',
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: numberWithThousandsSeparators
                },
                data: [] as any[]
            },
            {
                name: 'Moving',
                type: 'line',
                yAxisIndex: 0,
                smooth: true,
                symbol: 'none',
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: numberWithThousandsSeparators
                },
                data: [] as any[]
            }
        ]
    }
}

export default getPriceGraphConfigSplit
