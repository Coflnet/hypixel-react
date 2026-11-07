import { getApiTasks, getApiTasksSlug } from './_generated/skyApi'
import type { ErrorResponse, PublicTaskDrop, PublicTaskEstimate, PublicTaskStep } from './_generated/skyApi.schemas'

/**
 * Server side loaders for the public money-making task estimates (`GET /api/tasks[/{slug}]`), built on the generated client.
 * Every call is cached for 10 minutes and never throws: callers decide between an empty state and an error.
 */

/** A drop that can be linked, i.e. has an item tag. */
export type PublicTaskItemDrop = PublicTaskDrop & { itemTag: string }

/** A step with instruction text. */
export type PublicTaskTextStep = PublicTaskStep & { text: string }

/** A task after {@link normalizeTask}: the fields the pages render are always set and links are https only. */
export type PublicTask = PublicTaskEstimate & {
    name: string
    slug: string
    category: string
    wikiUrl?: string
    whereWikiUrl?: string
    steps: PublicTaskTextStep[]
    drops: PublicTaskItemDrop[]
    bestZones: NonNullable<PublicTaskEstimate['bestZones']>
}

export type PublicTaskResult = { status: 'ok'; task: PublicTask } | { status: 'notFound' } | { status: 'error' }

const REVALIDATE_SECONDS = 600
const TIMEOUT_MS = 8000

/** Error slug SkyApi returns for an unknown task; any other 404 (missing route, gateway) is an outage. */
const TASK_NOT_FOUND_SLUG = 'task_not_found'

function getRequestOptions(): RequestInit {
    return {
        headers: { Accept: 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    }
}

/**
 * Loads all public task estimates, sorted by coins per hour descending.
 * @returns The tasks, or null when the endpoint is unreachable or returns an error
 */
export async function getPublicTasks(): Promise<PublicTask[] | null> {
    try {
        const res = await getApiTasks(getRequestOptions())
        if (res.status !== 200 || !Array.isArray(res.data)) {
            return null
        }
        return res.data
            .filter(hasSlug)
            .map(normalizeTask)
            .sort((a, b) => b.coinsPerHour - a.coinsPerHour)
    } catch (error) {
        console.error('Failed to load public tasks', error)
        return null
    }
}

/**
 * Loads one task estimate by slug.
 * @returns ok with the task, notFound for an unknown slug, error when the endpoint failed
 */
export async function getPublicTask(slug: string): Promise<PublicTaskResult> {
    try {
        // the generated url builder interpolates the slug as is
        const res = await getApiTasksSlug(encodeURIComponent(slug), getRequestOptions())
        if (res.status === 404) {
            return isTaskNotFound(res.data) ? { status: 'notFound' } : { status: 'error' }
        }
        if (res.status !== 200 || !hasSlug(res.data)) {
            return { status: 'error' }
        }
        return { status: 'ok', task: normalizeTask(res.data) }
    } catch (error) {
        console.error(`Failed to load public task ${slug}`, error)
        return { status: 'error' }
    }
}

/** The generated client hands back non-JSON bodies as text, so the body may be anything. */
function isTaskNotFound(body: unknown): boolean {
    return (body as ErrorResponse | undefined)?.slug === TASK_NOT_FOUND_SLUG
}

function hasSlug(task: unknown): task is PublicTaskEstimate & { slug: string } {
    const slug: unknown = (task as PublicTaskEstimate | undefined)?.slug
    return typeof slug === 'string' && slug.length > 0
}

function hasText(step: PublicTaskStep): step is PublicTaskTextStep {
    return !!step.text
}

function hasItemTag(drop: PublicTaskDrop): drop is PublicTaskItemDrop {
    return !!drop.itemTag
}

/** Only https links from the API may end up in an href. */
function toSafeHttpsUrl(url?: string | null): string | undefined {
    if (!url) {
        return undefined
    }
    try {
        return new URL(url).protocol === 'https:' ? url : undefined
    } catch {
        return undefined
    }
}

/** Guards against missing arrays/numbers and unsafe links so the render code does not have to. */
function normalizeTask(task: PublicTaskEstimate & { slug: string }): PublicTask {
    return {
        ...task,
        name: task.name || task.slug,
        wikiUrl: toSafeHttpsUrl(task.wikiUrl),
        whereWikiUrl: toSafeHttpsUrl(task.whereWikiUrl),
        category: task.category || 'Other',
        coinsPerHour: task.coinsPerHour ?? 0,
        communityTrackedHours: task.communityTrackedHours ?? 0,
        contributors: task.contributors ?? 0,
        currentDoers: task.currentDoers ?? 0,
        doersChange20m: task.doersChange20m ?? 0,
        steps: (task.steps ?? []).filter(hasText),
        drops: (task.drops ?? []).filter(hasItemTag),
        bestZones: task.bestZones ?? []
    }
}
