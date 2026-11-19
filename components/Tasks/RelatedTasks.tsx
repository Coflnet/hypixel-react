import Link from 'next/link'
import type { PublicTask } from '../../api/publicTaskApi'
import { TaskTypeBadge } from './TaskTypeBadge'
import { formatCoins, getTaskPath } from './taskUtils'

const MAX_RELATED = 8

interface Props {
    task: PublicTask
    allTasks: PublicTask[] | null
}

export function RelatedTasks({ task, allTasks }: Props) {
    const related = (allTasks ?? []).filter(other => other.category === task.category && other.slug !== task.slug).slice(0, MAX_RELATED)
    if (related.length === 0) {
        return null
    }
    return (
        <section className="mt-4">
            <h2 className="h4">Related tasks in {task.category}</h2>
            <ul>
                {related.map(other => (
                    <li key={other.slug}>
                        <Link href={getTaskPath(other.slug)}>{other.name}</Link> – {formatCoins(other.coinsPerHour)} coins/hour
                        <TaskTypeBadge type={other.type} />
                    </li>
                ))}
            </ul>
        </section>
    )
}
