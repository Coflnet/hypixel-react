import type { TaskCategoryGroup } from './taskUtils'

/** Anchor navigation to the category sections of the task list. */
export function TaskCategoryNav({ groups }: { groups: TaskCategoryGroup[] }) {
    if (groups.length < 2) {
        return null
    }
    return (
        <nav aria-label="Task categories" className="mb-3">
            <ul className="list-inline mb-0">
                {groups.map(group => (
                    <li key={group.anchor} className="list-inline-item mb-1">
                        <a href={`#${group.anchor}`} className="btn btn-sm btn-secondary">
                            {group.category} ({group.tasks.length})
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
