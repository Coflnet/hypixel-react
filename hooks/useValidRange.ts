import { useState, Dispatch, SetStateAction } from 'react'
import { useSearchParams } from 'next/navigation'

export enum DateRange {
    ACTIVE = 'active',
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
    ALL = 'full'
}

export const DEFAULT_DATE_RANGE = DateRange.DAY

export const VALID_RANGES = Object.values(DateRange) as string[]

export function getValidatedRange(urlRange: string | null | undefined, defaultRange: DateRange = DEFAULT_DATE_RANGE): DateRange {
    return urlRange && VALID_RANGES.includes(urlRange) ? (urlRange as DateRange) : defaultRange
}

export function useValidRange(defaultRange: DateRange = DEFAULT_DATE_RANGE): [DateRange, Dispatch<SetStateAction<DateRange>>] {
    let searchParams = useSearchParams()

    return useState<DateRange>(() => {
        let urlRange = searchParams.get('range')
        return getValidatedRange(urlRange, defaultRange)
    })
}
