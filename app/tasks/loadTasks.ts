import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { cache } from 'react'
import { getPublicTask, getPublicTasks, type PublicTask } from '../../api/publicTaskApi'

/** One fetch per request for metadata and page; the fetch `signal` opts out of Next's own dedupe. */
export const loadTasks = cache(getPublicTasks)
const loadTask = cache(getPublicTask)

/** The build (and local dev) must not fail when the API is down, it renders the empty state instead. */
function mayRenderWithoutData(): boolean {
    return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD || process.env.NODE_ENV === 'development'
}

/**
 * Loads the task list for the /tasks page.
 * At runtime a failed fetch throws, so an ISR revalidation during an outage keeps serving the last good page.
 */
export async function loadTasksOrThrow(): Promise<PublicTask[] | null> {
    const tasks = await loadTasks()
    if (tasks || mayRenderWithoutData()) {
        return tasks
    }
    throw new Error('Public task estimates are unavailable')
}

/**
 * Loads one task: null for an unknown slug, throws on an API failure so the response is a 5xx
 * (and a cached good page stays) instead of an indexable or noindexed empty page.
 */
export async function loadTaskOrThrow(slug: string): Promise<PublicTask | null> {
    const result = await loadTask(slug)
    if (result.status === 'error') {
        throw new Error(`Public task estimate ${slug} is unavailable`)
    }
    return result.status === 'ok' ? result.task : null
}
