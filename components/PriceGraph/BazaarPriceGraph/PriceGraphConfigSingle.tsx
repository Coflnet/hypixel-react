import { formatAsCoins, getLocalDateAndTime, numberWithThousandsSeparators } from '../../../utils/Formatter'

const ANIMATION_THRESHOLD = 200

function getPriceGraphConfigSingle() {
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
            data: [
                'Price (buy)',
                'Min (buy)',
                'Max (buy)',
                'Volume (buy)',
                'Moving (buy)',
                'Price (sell)',
                'Min (sell)',
                'Max (sell)',
                'Volume (sell)',
                'Moving (sell)'
            ],
            selected: {
                'Price (buy)': true,
                'Min (buy)': false,
                'Max (buy)': false,
                'Volume (buy)': false,
                'Moving (buy)': false,
                'Price (sell)': true,
                'Min (sell)': false,
                'Max (sell)': false,
                'Volume (sell)': false,
                'Moving (sell)': false
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
                    formatter: numberWithThousandsSeparators
                }
            }
        ],
        series: [
            {
                name: 'Price (buy)',
                type: 'k',
                color: '#22A7F0',
                smooth: true,
                symbol: 'none',
                yAxisIndex: 0,
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
                        return `${numberWithThousandsSeparators(value)} Coins`
                    }
                }
            },
            {
                name: 'Min (buy)',
                type: 'line',
                color: '#228B22',
                smooth: true,
                symbol: 'none',
                yAxisIndex: 0,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: formatAsCoins
                },
                data: []
            },
            {
                name: 'Max (buy)',
                type: 'line',
                color: '#B22222',
                symbol: 'none',
                yAxisIndex: 0,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: formatAsCoins
                },
                data: []
            },
            {
                name: 'Volume (buy)',
                type: 'line',
                color: '#4B0082',
                symbol: 'none',
                yAxisIndex: 1,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: numberWithThousandsSeparators
                },
                data: []
            },
            {
                name: 'Moving (buy)',
                type: 'line',
                symbol: 'none',
                yAxisIndex: 1,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: numberWithThousandsSeparators
                },
                data: []
            },
            {
                name: 'Price (sell)',
                type: 'k',
                color: '#32CD32',
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 4
                },
                yAxisIndex: 0,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: value => {
                        if (!value || (value && value.length === 0)) {
                            return ''
                        }
                        return `${numberWithThousandsSeparators(value)} Coins`
                    }
                }
            },
            {
                name: 'Min (sell)',
                type: 'line',
                color: '#228B22',
                smooth: true,
                symbol: 'none',
                yAxisIndex: 0,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: formatAsCoins
                },
                data: []
            },
            {
                name: 'Max (sell)',
                type: 'line',
                color: '#B22222',
                smooth: true,
                symbol: 'none',
                yAxisIndex: 0,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: formatAsCoins
                },
                data: []
            },
            {
                name: 'Volume (sell)',
                type: 'line',
                color: '#4B0082',
                smooth: true,
                symbol: 'none',
                yAxisIndex: 1,
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: numberWithThousandsSeparators
                },
                data: []
            },
            {
                name: 'Moving (sell)',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'none',
                animationThreshold: ANIMATION_THRESHOLD,
                tooltip: {
                    show: true,
                    valueFormatter: numberWithThousandsSeparators
                },
                data: []
            }
        ]
    }
}

export default getPriceGraphConfigSingle
