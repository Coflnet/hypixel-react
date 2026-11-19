import type { PublicTask } from '../../api/publicTaskApi'
import { getCanonicalUrl } from '../../utils/SSRUtils'
import { formatCoins, getTaskPath } from './taskUtils'

export function buildTaskItemList(tasks: PublicTask[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Hypixel SkyBlock money making methods by coins per hour',
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: tasks.length,
        itemListElement: tasks.map((task, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `${task.name} – ${formatCoins(task.coinsPerHour)} coins/hour`,
            url: getCanonicalUrl(getTaskPath(task.slug))
        }))
    }
}

/** HowTo JSON-LD, only meaningful when the task has steps. */
export function buildTaskHowTo(task: PublicTask) {
    if (task.steps.length === 0) {
        return null
    }
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to make money with ${task.name} in Hypixel SkyBlock`,
        description: task.description || `${task.name} earns about ${formatCoins(task.coinsPerHour)} coins per hour.`,
        url: getCanonicalUrl(getTaskPath(task.slug)),
        step: [...task.steps]
            .sort((a, b) => a.number - b.number)
            .map(step => ({
                '@type': 'HowToStep',
                position: step.number,
                text: step.text
            }))
    }
}
