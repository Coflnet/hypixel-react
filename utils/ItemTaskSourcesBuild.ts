import { getPublicTasks } from '../api/publicTaskApi'
import { buildItemTaskLinkMap, type ItemTaskLinkMap } from './ItemTaskSources'

/** Build time entry (bundled by generateItemTaskSources.mjs): the item to tasks map, or null when the task API is unreachable. */
export async function generateItemTaskLinkMap(): Promise<ItemTaskLinkMap | null> {
    const tasks = await getPublicTasks()
    return tasks ? buildItemTaskLinkMap(tasks) : null
}
