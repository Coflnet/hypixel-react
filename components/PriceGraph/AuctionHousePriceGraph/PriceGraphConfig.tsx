import { numberWithThousandsSeperators } from '../../../utils/Formatter'

let option = {
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
        data: ['Price', 'Min', 'Max', 'Number of traded items'],
        selected: {
            Price: true,
            Min: true,
            Max: false,
            'Number of traded items': false
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
            type: 'inside',
            xAxisIndex: [0],
            filterMode: 'filter'
        }
    ],
    toolbox: {
        feature: {
            dataZoom: {},
            magicType: {
                type: ['line', 'bar']
            }
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
            areaStyle: {},
            yAxisIndex: 0,
            smooth: true,
            tooltip: {
                valueFormatter: value => `${numberWithThousandsSeperators(value)} Coins`
            }
        },
        {
            name: 'Min',
            type: 'line',
            color: '#228B22',
            areaStyle: {},
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
            areaStyle: {},
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
            color: '#545454',
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
