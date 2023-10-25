export function applyMayorDataToChart(chartOptions, mayorData: MayorData[], seriesIndex: number, zoomData?: { start: number; end: number }) {
    let minDate = new Date(chartOptions.xAxis[0].data[0])
    let maxDate = new Date(chartOptions.xAxis[0].data[chartOptions.xAxis[0].data.length - 1])

    let mayorDataCopy = [...mayorData].map((data, i) => {
        return {
            ...data,
            startPercentage: calculateDatePercentage(minDate, maxDate, data.start) * 100,
            endPercentage: calculateDatePercentage(minDate, maxDate, data.end) * 100,
            color: i % 2 === 0 ? 'RGBA(123, 125, 125, 0.3)' : 'RGBA(31, 97, 141, 0.3)'
        }
    })

    if (zoomData) {
        mayorDataCopy = mayorDataCopy.filter(data => {
            if (!zoomData) {
                return true
            }
            let valid = data.startPercentage < zoomData.end && data.endPercentage > zoomData.start
            if (valid) {
                if (data.startPercentage < zoomData.start) {
                    data.startPercentage = zoomData.start
                }
                if (data.endPercentage > zoomData.end) {
                    data.endPercentage = zoomData.end
                }
                data.startPercentage = (data.startPercentage - zoomData.start) / ((zoomData.end - zoomData.start) / 100)
                data.endPercentage = (data.endPercentage - zoomData.start) / ((zoomData.end - zoomData.start) / 100)
            }
            return valid
        })
    }

    chartOptions.series[seriesIndex].markArea = {
        label: { show: true, color: '#fff' },
        data: mayorDataCopy.map((data, i) => {
            return [
                {
                    name: data.winner.name,
                    valueDim: 'x',
                    x: `${10 + data.startPercentage * 0.8}%`,
                    y: 'min',
                    label: {
                        show: mayorDataCopy.length <= 10
                    },
                    emphasis:
                        mayorDataCopy.length > 10
                            ? {
                                  label: {
                                      show: true
                                  }
                              }
                            : undefined,
                    itemStyle: {
                        color: data.color
                    }
                },
                {
                    x: `${10 + data.endPercentage * 0.8}%`,
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
