import { formatAsCoins, getLocalDateAndTime, numberWithThousandsSeparators } from '../../../utils/Formatter'

const ANIMATION_THRESHOLD = 200

let option = {
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
        data: ['Price', 'Min', 'Max', 'Volume', 'Mayors'],
        selected: {
            Price: true,
            Min: true,
            Max: false,
            Volume: false,
            Mayors: false
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
            data: [] as any[],
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
            symbol: 'none',
            axisLabel: {
                formatter: formatAsCoins
            }
        },
        {
            type: 'value',
            name: 'Volume',
            position: 'right',
            symbol: 'none',
            axisLabel: {
                formatter: numberWithThousandsSeparators
            }
        }
    ],
    series: [
        {
            name: 'Price',
            type: 'line',
            color: '#22A7F0',
            symbol: 'none',
            lineStyle: {
                width: 4
            },
            yAxisIndex: 0,
            smooth: true,
            animationThreshold: ANIMATION_THRESHOLD,
            tooltip: {
                valueFormatter: formatAsCoins
            },
            data: [] as any[]
        },
        {
            name: 'Min',
            type: 'line',
            color: '#228B22',
            symbol: 'none',
            yAxisIndex: 0,
            smooth: true,
            animationThreshold: ANIMATION_THRESHOLD,
            tooltip: {
                valueFormatter: formatAsCoins
            },
            data: [] as any[]
        },
        {
            name: 'Max',
            type: 'line',
            color: '#B22222',
            symbol: 'none',
            yAxisIndex: 0,
            smooth: true,
            animationThreshold: ANIMATION_THRESHOLD,
            tooltip: {
                valueFormatter: formatAsCoins
            },
            data: [] as any[]
        },
        {
            name: 'Volume',
            type: 'line',
            color: '#4B0082',
            symbol: 'none',
            yAxisIndex: 1,
            smooth: true,
            animationThreshold: ANIMATION_THRESHOLD,
            tooltip: {
                valueFormatter: numberWithThousandsSeparators
            },
            data: [] as any[]
        },
        {
            name: 'Mayors',
            type: 'line',
            color: 'RGBA(31, 97, 141, 0.3)',
            symbol: 'none',
            lineStyle: {
                width: 4
            },
            yAxisIndex: 0,
            smooth: true,
            animationThreshold: ANIMATION_THRESHOLD,
            data: [] as any[]
        }
    ]
}

export default option
