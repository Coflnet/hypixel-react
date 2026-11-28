import { getPublicTasks } from '../api/publicTaskApi'
import { buildItemTaskLinkMap, type ItemTaskLinkMap } from './ItemTaskSources'

/** Build time entry (bundled by generateItemTaskSources.mjs): the item to tasks map, or null when the task API is unreachable. */
export async function generateItemTaskLinkMap(): Promise<ItemTaskLinkMap | null> {
    // an item still drops from a seasonal task while its event isn't running
    const tasks = await getPublicTasks({ includeUnavailable: true })
    return tasks ? buildItemTaskLinkMap(tasks) : null
}
