import type { PublicTask } from '../../api/publicTaskApi'
import { formatToPriceToShorten, numberWithThousandsSeparators, toVariantItemTag } from '../../utils/Formatter'

export interface TaskCategoryGroup {
    category: string
    anchor: string
    tasks: PublicTask[]
}

/** Deterministic (SSR-safe) coin formatting, e.g. 12.3M */
export function formatCoins(value: number): string {
    if (!value || value < 0) {
        return '0'
    }
    return formatToPriceToShorten(value, value >= 1000 ? 1 : 0)
}

/** Deterministic thousands separators so server and client render the same text. */
export function formatCount(value: number): string {
    return numberWithThousandsSeparators(Math.round(value), ',', '.')
}

export function formatDoersChange(change: number): string {
    if (!change) {
        return '±0'
    }
    return change > 0 ? `+${formatCount(change)}` : `-${formatCount(Math.abs(change))}`
}

export function getSourceLabel(source: PublicTask['source']): string {
    return source === 'formula' ? 'estimated from drop rates' : 'community data'
}

/** Only non-default task types get a badge, active tasks are the norm. */
export function getTypeBadge(type: PublicTask['type']): { label: string; bg: string } | null {
    if (type === 'passive') {
        return { label: 'Passive', bg: 'info' }
    }
    if (type === 'limited') {
        return { label: 'Limited', bg: 'warning' }
    }
    return null
}

export function getCategoryAnchor(category: string): string {
    const slug = category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return `category-${slug || 'other'}`
}

/** Groups tasks by category; groups are ordered by their best task, tasks within by coins/hour. */
export function groupTasksByCategory(tasks: PublicTask[]): TaskCategoryGroup[] {
    const groups = new Map<string, PublicTask[]>()
    for (const task of tasks) {
        groups.set(task.category, [...(groups.get(task.category) ?? []), task])
    }
    return Array.from(groups.entries())
        .map(([category, groupTasks]) => ({
            category,
            anchor: getCategoryAnchor(category),
            tasks: [...groupTasks].sort((a, b) => b.coinsPerHour - a.coinsPerHour)
        }))
        .sort((a, b) => b.tasks[0].coinsPerHour - a.tasks[0].coinsPerHour)
}

export function getTaskPath(slug: string): string {
    return `/tasks/${encodeURIComponent(slug)}`
}

/** Same icon URL the API helper builds for items during SSR. */
export function getItemIconUrl(itemTag: string): string {
    return `https://sky.coflnet.com/static/icon/${toVariantItemTag(itemTag)}`
}

/** Drop rates can be fractional (rare drops), so small values keep decimals. */
export function formatRate(value: number): string {
    if (!value || value < 0) {
        return '0'
    }
    if (value < 10) {
        return value.toFixed(value < 1 ? 2 : 1)
    }
    return formatCoins(value)
}
