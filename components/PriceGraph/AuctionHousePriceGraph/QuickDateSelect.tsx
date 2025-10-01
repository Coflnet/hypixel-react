'use client'
import React, { useEffect, useRef, useState } from 'react'
import { DateRange } from '../../ItemPriceRange/ItemPriceRange'
import { Button, Row, Col, Form } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

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

    const [refreshKey, setRefreshKey] = useState(0)
    const prevMayorCountRef = useRef(mayorPeriods ? mayorPeriods.length : 0)

    useEffect(() => {
        const currentCount = mayorPeriods ? mayorPeriods.length : 0
        if (currentCount !== prevMayorCountRef.current) {
            prevMayorCountRef.current = currentCount
            setRefreshKey(k => k + 1)
        }
    }, [mayorPeriods])

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
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 style={{ margin: 0 }}>📅 Custom Date Range</h6>
                <Button variant="outline-light" size="sm" onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}>
                    {showCustomDatePicker ? 'Hide' : 'Show'} Date Picker
                </Button>
            </div>

            {/* Quick Select Options */}
            <div className="mb-3" key={`quick-select-${refreshKey}`}>
                <Form.Label className="d-block mb-2 fw-bold">🎯 Quick Select:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                    {/* Previous Mayor */}
                    {mayorPeriods.length > 1 && (
                        <Button
                            variant="outline-warning"
                            size="sm"
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
                        </Button>
                    )}

                    {/* Around Current Mayor Start */}
                    {mayorPeriods.length > 0 && (
                        <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => {
                                const currentMayor = mayorPeriods[0]
                                let mayorStartDate = currentMayor && currentMayor.start ? new Date(currentMayor.start) : new Date()

                                const currentName = currentMayor?.winner?.name
                                if (currentName) {
                                    const previousSame = mayorPeriods
                                        .filter(
                                            p =>
                                                p.start &&
                                                p.winner &&
                                                p.winner.name === currentName &&
                                                new Date(p.start).getTime() < new Date(currentMayor.start).getTime()
                                        )
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
                        </Button>
                    )}

                    {/* 1 Year Ago */}
                    <Button
                        variant="outline-success"
                        size="sm"
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
                    </Button>
                </div>
            </div>

            {/* Custom Date Inputs */}
            {showCustomDatePicker && (
                <Row className="align-items-end g-2">
                    <Col xs={12} md={5}>
                        <Form.Label className="d-block mb-1" style={{ fontSize: '0.9rem' }}>
                            Start Date:
                        </Form.Label>
                        <DatePicker
                            selected={customStartDate ? new Date(customStartDate + 'T00:00:00Z') : null}
                            onChange={(d: Date | null) => setCustomStartDate(d ? d.toISOString().split('T')[0] : '')}
                            maxDate={new Date()}
                            className="form-control form-control-sm"
                            dateFormat="yyyy-MM-dd"
                        />
                    </Col>
                    <Col xs={12} md={5}>
                        <Form.Label className="d-block mb-1" style={{ fontSize: '0.9rem' }}>
                            End Date:
                        </Form.Label>
                        <DatePicker
                            selected={customEndDate ? new Date(customEndDate + 'T00:00:00Z') : null}
                            onChange={(d: Date | null) => setCustomEndDate(d ? d.toISOString().split('T')[0] : '')}
                            maxDate={new Date()}
                            className="form-control form-control-sm"
                            dateFormat="yyyy-MM-dd"
                        />
                    </Col>
                    <Col xs={12} md={2} className="d-flex gap-2">
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => updateChart(DateRange.YEAR, buildCleanFilter())}
                            disabled={!customStartDate && !customEndDate}
                        >
                            Apply
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => {
                                setCustomStartDate('')
                                setCustomEndDate('')
                                updateChart(DateRange.YEAR, itemFilter)
                            }}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>
            )}
        </div>
    )
}
