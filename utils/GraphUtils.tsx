export function applyMayorDataToChart(chartOptions, mayorData: MayorData[], seriesIndex: number) {
    let minDate = new Date(chartOptions.xAxis[0].data[0])
    let maxDate = new Date(chartOptions.xAxis[0].data[chartOptions.xAxis[0].data.length - 1])
    chartOptions.series[seriesIndex].markArea = {
        label: { show: true, color: '#fff' },
        data: mayorData.map((data, i) => {
            let startPercentage = calculateDatePercentage(minDate, maxDate, data.start)
            let endPercentage = calculateDatePercentage(minDate, maxDate, data.end)
            return [
                {
                    name: data.winner.name,
                    valueDim: 'x',
                    x: `${10 + startPercentage * 100 * 0.8}%`,
                    y: 'min',
                    label: {
                        show: mayorData.length <= 10
                    },
                    emphasis:
                        mayorData.length > 10
                            ? {
                                  label: {
                                      show: true
                                  }
                              }
                            : undefined,
                    itemStyle: {
                        color: i % 2 === 0 ? 'RGBA(123, 125, 125, 0.3)' : 'RGBA(31, 97, 141, 0.3)'
                    }
                },
                {
                    x: `${10 + endPercentage * 100 * 0.8}%`,
                    y: 'max'
                }
            ]
        })
    }
}

function calculateDatePercentage(start: Date, end: Date, dateInBetween: Date) {
    if (dateInBetween < start) {
        return 0
    } else if (dateInBetween > end) {
        return 1
    } else {
        const totalMilliseconds = end.getTime() - start.getTime()
        const passedMilliseconds = dateInBetween.getTime() - start.getTime()
        return passedMilliseconds / totalMilliseconds
    }
}
