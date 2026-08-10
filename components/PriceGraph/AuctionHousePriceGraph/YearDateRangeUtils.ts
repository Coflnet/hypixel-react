import type { CoflnetSkyMayorModelsModelElectionPeriod } from '../../../api/_generated/skyApi.schemas'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export interface CustomDateRange {
    startDate?: string
    endDate?: string
}

function formatUtcDate(date: Date) {
    return date.toISOString().slice(0, 10)
}

function formatDate(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parsePeriodTime(value: string) {
    const utcParts = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(?: \+00:00)?$/)
    if (utcParts) {
        const [, month, day, year, hour, minute, second] = utcParts.map(Number)
        return Date.UTC(year, month - 1, day, hour, minute, second)
    }

    return new Date(value).getTime()
}

function getPeriodTime(period: CoflnetSkyMayorModelsModelElectionPeriod, field: 'start' | 'end') {
    const value = period[field]
    const time = value ? parsePeriodTime(value) : Number.NaN
    return Number.isNaN(time) ? null : time
}

export function buildYearHistoryFilter(itemFilter?: ItemFilter, dateRange?: CustomDateRange | null): ItemFilter {
    const filter: ItemFilter = {}

    Object.entries(itemFilter ?? {}).forEach(([key, value]) => {
        if (key !== '_hide' && typeof value === 'string') {
            filter[key] = value
        }
    })

    if (dateRange?.startDate) {
        filter.EndAfter = Math.floor(new Date(`${dateRange.startDate}T00:00:00Z`).getTime() / 1000).toString()
    }
    if (dateRange?.endDate) {
        filter.EndBefore = Math.floor(new Date(`${dateRange.endDate}T23:59:59Z`).getTime() / 1000).toString()
    }

    return filter
}

export function getMonthAYearAgo(now = new Date()): CustomDateRange {
    const year = now.getFullYear() - 1
    const month = now.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()

    return {
        startDate: formatDate(year, month, 1),
        endDate: formatDate(year, month, lastDay)
    }
}

export function getLastCompletedMayor(
    mayorPeriods: CoflnetSkyMayorModelsModelElectionPeriod[],
    now = new Date()
): CoflnetSkyMayorModelsModelElectionPeriod | undefined {
    return [...mayorPeriods]
        .filter(period => {
            const end = getPeriodTime(period, 'end')
            return end !== null && end <= now.getTime()
        })
        .sort((a, b) => (getPeriodTime(b, 'end') ?? 0) - (getPeriodTime(a, 'end') ?? 0))[0]
}

export function getLastElectionRange(mayorPeriods: CoflnetSkyMayorModelsModelElectionPeriod[], mayorName: string, now = new Date()): CustomDateRange | null {
    const matchingPeriod = [...mayorPeriods]
        .filter(period => {
            const start = getPeriodTime(period, 'start')
            return period.winner?.name === mayorName && start !== null && start <= now.getTime()
        })
        .sort((a, b) => (getPeriodTime(b, 'start') ?? 0) - (getPeriodTime(a, 'start') ?? 0))[0]

    const electionTime = matchingPeriod ? getPeriodTime(matchingPeriod, 'start') : null
    if (electionTime === null) {
        return null
    }

    return {
        startDate: formatUtcDate(new Date(electionTime - 5 * DAY_IN_MS)),
        endDate: formatUtcDate(new Date(Math.min(electionTime + 5 * DAY_IN_MS, now.getTime())))
    }
}

export function getMayorTermRange(period?: CoflnetSkyMayorModelsModelElectionPeriod): CustomDateRange | null {
    const start = period ? getPeriodTime(period, 'start') : null
    const end = period ? getPeriodTime(period, 'end') : null

    return start === null || end === null
        ? null
        : {
              startDate: formatUtcDate(new Date(start)),
              endDate: formatUtcDate(new Date(end))
          }
}
