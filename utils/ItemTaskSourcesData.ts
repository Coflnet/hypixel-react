import type { ItemTaskLink, ItemTaskLinkMap } from './ItemTaskSources'

/**
 * The item to tasks map written by generateItemTaskSources.mjs during `npm run build` (gitignored).
 * It is bundled into the build, so it only changes with a deploy. Missing (dev, tests) means no entries.
 */
function loadGeneratedMap(): ItemTaskLinkMap {
    try {
        return require('../data/generated/itemTaskSources.json') as ItemTaskLinkMap
    } catch {
        return {}
    }
}

const generatedMap = loadGeneratedMap()

export function getBuiltTaskLinks(tag: string): ItemTaskLink[] {
    return Object.hasOwn(generatedMap, tag) ? generatedMap[tag] : []
}
