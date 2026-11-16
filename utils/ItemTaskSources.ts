import type { PublicTask } from '../api/publicTaskApi'

/** A money-making task that drops a given item, reduced to what the item FAQ shows. */
export interface ItemTaskSource {
    slug: string
    name: string
    /** How many of the item the task drops per hour. */
    ratePerHour: number
    coinsPerHour: number
    /** Coins per hour the item adds to the task. */
    contributionPerHour: number
}

export const MAX_ITEM_TASK_SOURCES = 5

function toTaskSource(task: PublicTask, tag: string): ItemTaskSource | null {
    const drop = task.drops.find(d => d.itemTag === tag && d.ratePerHour > 0)
    if (!drop) {
        return null
    }
    return {
        slug: task.slug,
        name: task.name,
        ratePerHour: drop.ratePerHour,
        coinsPerHour: task.coinsPerHour,
        contributionPerHour: drop.contributionPerHour ?? 0
    }
}

function compareSources(a: ItemTaskSource, b: ItemTaskSource): number {
    return b.contributionPerHour - a.contributionPerHour || b.ratePerHour - a.ratePerHour || b.coinsPerHour - a.coinsPerHour
}

/**
 * The tasks that drop the item (rate above zero), best source first: by the coins the item contributes, then by drop rate.
 * Does not rely on the order of the API's drops or tasks.
 */
export function getTaskSourcesForItem(tasks: PublicTask[] | null | undefined, tag: string, max = MAX_ITEM_TASK_SOURCES): ItemTaskSource[] {
    if (!tasks || !tag) {
        return []
    }
    return tasks
        .map(task => toTaskSource(task, tag))
        .filter((source): source is ItemTaskSource => source !== null)
        .sort(compareSources)
        .slice(0, max)
}

/** What the item FAQ keeps per task: static between deploys, so no live numbers. */
export interface ItemTaskLink {
    slug: string
    name: string
}

/** Item tag to its best task sources. */
export type ItemTaskLinkMap = Record<string, ItemTaskLink[]>

function getDroppedItemTags(tasks: PublicTask[]): string[] {
    const tags = new Set<string>()
    for (const task of tasks) {
        for (const drop of task.drops) {
            if (drop.itemTag && drop.ratePerHour > 0) {
                tags.add(drop.itemTag)
            }
        }
    }
    return Array.from(tags)
}

/** Maps every dropped item tag to its (max 5) best tasks, ordered like {@link getTaskSourcesForItem}. */
export function buildItemTaskLinkMap(tasks: PublicTask[]): ItemTaskLinkMap {
    const map: ItemTaskLinkMap = {}
    for (const tag of getDroppedItemTags(tasks)) {
        map[tag] = getTaskSourcesForItem(tasks, tag).map(({ slug, name }) => ({ slug, name }))
    }
    return map
}
