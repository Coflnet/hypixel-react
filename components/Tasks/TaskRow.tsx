import Link from 'next/link'
import type { PublicTask } from '../../api/publicTaskApi'
import { TaskDoers } from './TaskDoers'
import { TaskTypeBadge } from './TaskTypeBadge'
import { formatCoins, getSourceLabel, getTaskPath } from './taskUtils'

export function TaskRow({ task }: { task: PublicTask }) {
    return (
        <tr>
            <td>
                <Link href={getTaskPath(task.slug)}>{task.name}</Link>
                <TaskTypeBadge type={task.type} />
            </td>
            <td title={getSourceLabel(task.source)}>{formatCoins(task.coinsPerHour)}</td>
            <td>
                <TaskDoers currentDoers={task.currentDoers} doersChange20m={task.doersChange20m} />
            </td>
            <td>{task.island || '–'}</td>
        </tr>
    )
}
