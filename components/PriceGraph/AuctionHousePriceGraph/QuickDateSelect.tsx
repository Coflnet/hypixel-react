"use client"
import React from 'react'
import { DateRange } from '../../ItemPriceRange/ItemPriceRange'

interface Props {
    mayorPeriods: any[]
    itemFilter?: ItemFilter
    customStartDate: string
    customEndDate: string
    showCustomDatePicker: boolean
    setCustomStartDate: (d: string) => void
    setCustomEndDate: (d: string) => void
    setShowCustomDatePicker: (b: boolean) => void
    updateChart: (range: DateRange, filter?: ItemFilter) => void
}

export default function QuickDateSelect(props: Props) {
    const {
        mayorPeriods,
        itemFilter,
        customStartDate,
        customEndDate,
        showCustomDatePicker,
        setCustomStartDate,
        setCustomEndDate,
        setShowCustomDatePicker,
        updateChart
    } = props

    function buildCleanFilter(overrides?: { start?: string; end?: string }) {
        const startDate = overrides?.start || customStartDate
        const endDate = overrides?.end || customEndDate
        const cleanFilter: ItemFilter = {}
        Object.keys(itemFilter || {}).forEach(key => {
            if (key !== '_hide' && typeof itemFilter![key] === 'string') {
                cleanFilter[key] = itemFilter![key] as string
            }
        })
        if (startDate) {
            cleanFilter.EndAfter = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000).toString()
        }
        if (endDate) {
            cleanFilter.EndBefore = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000).toString()
        }
        return cleanFilter
    }

    return (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bs-secondary)', borderRadius: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h6 style={{ margin: 0 }}>📅 Custom Date Range</h6>
                <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                >
                    {showCustomDatePicker ? 'Hide' : 'Show'} Date Picker
                </button>
            </div>

            {/* Quick Select Options */}
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>🎯 Quick Select:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {/* Previous Mayor */}
                    {mayorPeriods.length > 1 && (
                        <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => {
                                const prevMayor = mayorPeriods[1]
                                const startDate = new Date(prevMayor.start || '').toISOString().split('T')[0]
                                const endDate = new Date(prevMayor.end || '').toISOString().split('T')[0]
                                setCustomStartDate(startDate)
                                setCustomEndDate(endDate)
                                updateChart(DateRange.YEAR, buildCleanFilter({ start: startDate, end: endDate }))
                            }}
                        >
                            👑 Previous Mayor ({mayorPeriods[1]?.winner?.name || 'Unknown'})
                        </button>
                    )}

                    {/* Around Current Mayor Start */}
                    {mayorPeriods.length > 0 && (
                        <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => {
                                const currentMayor = mayorPeriods[0]
                                let mayorStartDate = currentMayor && currentMayor.start ? new Date(currentMayor.start) : new Date()

                                const currentName = currentMayor?.winner?.name
                                if (currentName) {
                                    const previousSame = mayorPeriods
                                        .filter(p => p.start && p.winner && p.winner.name === currentName && new Date(p.start).getTime() < new Date(currentMayor.start).getTime())
                                        .sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())

                                    if (previousSame.length > 0) {
                                        mayorStartDate = new Date(previousSame[0].start)
                                    }
                                }

                                const startDate = new Date(mayorStartDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                const endDate = new Date(mayorStartDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                setCustomStartDate(startDate)
                                setCustomEndDate(endDate)
                                updateChart(DateRange.YEAR, buildCleanFilter({ start: startDate, end: endDate }))
                            }}
                        >
                            {`📅 Last time ${mayorPeriods[0]?.winner?.name || 'current mayor'} was elected (±5 days)`}
                        </button>
                    )}

                    {/* 1 Year Ago */}
                    <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => {
                            const now = new Date()
                            const yearAgoStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 365)
                            const yearAgoEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 358)
                            const startDate = yearAgoStart.toISOString().split('T')[0]
                            const endDate = yearAgoEnd.toISOString().split('T')[0]
                            setCustomStartDate(startDate)
                            setCustomEndDate(endDate)
                            updateChart(DateRange.YEAR, buildCleanFilter({ start: startDate, end: endDate }))
                        }}
                    >
                        📈 1 Year Ago (7 days period)
                    </button>
                </div>
            </div>

            {/* Custom Date Inputs */}
            {showCustomDatePicker && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Start Date:</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>End Date:</label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                updateChart(DateRange.YEAR, buildCleanFilter())
                            }}
                            disabled={!customStartDate && !customEndDate}
                        >
                            Apply
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                setCustomStartDate('')
                                setCustomEndDate('')
                                updateChart(DateRange.YEAR, itemFilter)
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
