import { Alert } from 'react-bootstrap'
import type { PublicTask } from '../../api/publicTaskApi'
import { isUnavailableAt } from './taskUtils'

const NEXT_AVAILABLE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })

/** Deterministic (SSR-safe) UTC date of the next time the task is possible, null when unknown or invalid. */
export function formatNextAvailable(iso?: string | null): string | null {
    if (!iso) {
        return null
    }
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? null : `${NEXT_AVAILABLE_FORMAT.format(date)} UTC`
}

/**
 * Says when a task needs a SkyBlock event or mayor perk: a warning while it can't be done (such tasks are hidden from the
 * task list but keep their page), a hint when the API could not tell for sure.
 */
export function TaskAvailabilityNote({ task }: { task: PublicTask }) {
    if (isUnavailableAt(task, new Date())) {
        return <UnavailableWarning task={task} />
    }
    if (task.available && task.availabilityNote) {
        return (
            <Alert variant="info" className="py-2" data-testid="task-availability-note">
                {task.availabilityNote}
            </Alert>
        )
    }
    return null
}

function UnavailableWarning({ task }: { task: PublicTask }) {
    const next = formatNextAvailable(task.nextAvailableAt)
    return (
        <Alert variant="warning" data-testid="task-unavailable">
            {/* Alert.Heading is a static member, which a server component can't reach through the client boundary */}
            <h2 className="h5 alert-heading">Not possible right now{task.requiredEvent ? ` – needs ${task.requiredEvent}` : ''}</h2>
            <p className="mb-0">{task.availabilityNote || 'This task can only be done during a SkyBlock event that is not running at the moment.'}</p>
            {next ? (
                <p className="mb-0 mt-2">
                    Possible again: <time dateTime={task.nextAvailableAt ?? undefined}>{next}</time>
                </p>
            ) : null}
        </Alert>
    )
}
