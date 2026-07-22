'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Col, Form, Row } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import type { CoflnetSkyMayorModelsModelElectionPeriod } from '../../../api/_generated/skyApi.schemas'
import styles from './AuctionHousePriceGraph.module.css'
import { type CustomDateRange, getLastCompletedMayor, getLastElectionRange, getMayorTermRange, getMonthAYearAgo } from './YearDateRangeUtils'

const FIVE_MINUTES = 5 * 60 * 1000

interface ElectionCandidate {
    name: string
    votes: number
}

interface ElectionResource {
    success: boolean
    current?: {
        candidates?: ElectionCandidate[]
    }
}

interface Props {
    mayorPeriods: CoflnetSkyMayorModelsModelElectionPeriod[]
    value: CustomDateRange | null
    onChange: (range: CustomDateRange | null) => void
}

async function getNextMayor() {
    const response = await fetch('https://api.hypixel.net/v2/resources/skyblock/election')
    if (!response.ok) {
        throw new Error('Unable to load the current mayor election')
    }

    const election = (await response.json()) as ElectionResource
    if (!election.success) {
        throw new Error('Unable to load the current mayor election')
    }

    return (
        election.current?.candidates?.reduce<ElectionCandidate | null>(
            (leader, candidate) => (!leader || candidate.votes > leader.votes ? candidate : leader),
            null
        )?.name ?? null
    )
}

function parseDateInput(value?: string) {
    if (!value) return null

    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function formatDateInput(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default function QuickDateSelect({ mayorPeriods, value, onChange }: Props) {
    const [startDate, setStartDate] = useState(value?.startDate ?? '')
    const [endDate, setEndDate] = useState(value?.endDate ?? '')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const nextMayorQuery = useQuery({
        queryKey: ['hypixel', 'skyblock', 'nextMayor'],
        queryFn: getNextMayor,
        staleTime: FIVE_MINUTES,
        retry: false
    })

    useEffect(() => {
        setStartDate(value?.startDate ?? '')
        setEndDate(value?.endDate ?? '')
    }, [value])

    const lastMayor = useMemo(() => getLastCompletedMayor(mayorPeriods), [mayorPeriods])
    const lastMayorRange = useMemo(() => getMayorTermRange(lastMayor), [lastMayor])
    const nextMayorRange = useMemo(
        () => (nextMayorQuery.data ? getLastElectionRange(mayorPeriods, nextMayorQuery.data) : null),
        [mayorPeriods, nextMayorQuery.data]
    )
    const invalidRange = Boolean(startDate && endDate && startDate > endDate)

    function applyRange(range: CustomDateRange) {
        setStartDate(range.startDate ?? '')
        setEndDate(range.endDate ?? '')
        onChange(range)
    }

    return (
        <section className={styles.dateRangePanel} aria-labelledby="custom-date-range-heading">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <h6 id="custom-date-range-heading" className="m-0">
                    📅 Custom Date Range
                </h6>
                <Button
                    variant="outline-light"
                    size="sm"
                    aria-expanded={showDatePicker}
                    aria-controls="custom-date-picker"
                    onClick={() => setShowDatePicker(current => !current)}
                >
                    {showDatePicker ? 'Hide' : 'Show'} Date Picker
                </Button>
            </div>

            <Form.Label className="d-block mb-2 fw-bold">🎯 Quick Select:</Form.Label>
            <div className="d-flex flex-wrap gap-2 mb-3">
                <Button variant="outline-warning" size="sm" disabled={!lastMayorRange} onClick={() => lastMayorRange && applyRange(lastMayorRange)}>
                    👑 Last Mayor{lastMayor?.winner?.name ? ` (${lastMayor.winner.name})` : ''}
                </Button>
                <Button variant="outline-success" size="sm" onClick={() => applyRange(getMonthAYearAgo())}>
                    📈 Month a Year Ago
                </Button>
                <Button
                    variant="outline-info"
                    size="sm"
                    disabled={!nextMayorRange}
                    title={nextMayorQuery.isError ? 'The current election could not be loaded' : undefined}
                    onClick={() => nextMayorRange && applyRange(nextMayorRange)}
                >
                    📅 Last Time {nextMayorQuery.data ?? 'Next Mayor'} Was Elected (±5 Days)
                </Button>
            </div>

            {showDatePicker && (
                <Row id="custom-date-picker" className="align-items-end g-2">
                    <Col xs={12} md={5}>
                        <Form.Label className="d-block mb-1 small">Start Date</Form.Label>
                        <DatePicker
                            selected={parseDateInput(startDate)}
                            onChange={(date: Date | null) => setStartDate(date ? formatDateInput(date) : '')}
                            maxDate={parseDateInput(endDate) ?? new Date()}
                            className="form-control form-control-sm"
                            wrapperClassName="w-100"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select a start date"
                        />
                    </Col>
                    <Col xs={12} md={5}>
                        <Form.Label className="d-block mb-1 small">End Date</Form.Label>
                        <DatePicker
                            selected={parseDateInput(endDate)}
                            onChange={(date: Date | null) => setEndDate(date ? formatDateInput(date) : '')}
                            minDate={parseDateInput(startDate) ?? undefined}
                            maxDate={new Date()}
                            className="form-control form-control-sm"
                            wrapperClassName="w-100"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Select an end date"
                        />
                    </Col>
                    <Col xs={12} md={2} className="d-flex gap-2">
                        <Button
                            size="sm"
                            variant="primary"
                            disabled={(!startDate && !endDate) || invalidRange}
                            onClick={() => applyRange({ startDate: startDate || undefined, endDate: endDate || undefined })}
                        >
                            Apply
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-light"
                            disabled={!startDate && !endDate && !value}
                            onClick={() => {
                                setStartDate('')
                                setEndDate('')
                                onChange(null)
                            }}
                        >
                            Reset
                        </Button>
                    </Col>
                    {invalidRange && (
                        <Col xs={12}>
                            <Form.Text className="text-danger">The end date must be on or after the start date.</Form.Text>
                        </Col>
                    )}
                </Row>
            )}
        </section>
    )
}
