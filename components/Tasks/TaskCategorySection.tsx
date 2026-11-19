import { Table } from 'react-bootstrap'
import { TaskRow } from './TaskRow'
import type { TaskCategoryGroup } from './taskUtils'

export function TaskCategorySection({ group }: { group: TaskCategoryGroup }) {
    return (
        <section id={group.anchor} className="mt-4" style={{ scrollMarginTop: '1rem' }}>
            <h2 className="h4">{group.category}</h2>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th style={{ width: '40%' }}>Task</th>
                        <th style={{ width: '18%' }}>Coins/hour</th>
                        <th style={{ width: '24%' }}>Playing now</th>
                        <th style={{ width: '18%' }}>Island</th>
                    </tr>
                </thead>
                <tbody>
                    {group.tasks.map(task => (
                        <TaskRow key={task.slug} task={task} />
                    ))}
                </tbody>
            </Table>
        </section>
    )
}
