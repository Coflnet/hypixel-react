import Link from 'next/link'
import { Alert } from 'react-bootstrap'

/** Shown when the task estimates could not be loaded. */
export function TaskEmptyState() {
    return (
        <Alert variant="secondary" className="my-4">
            <p className="mb-2">Live task estimates are not available right now. Please check back in a few minutes.</p>
            <p className="mb-0">
                You can always see the current money-making tasks in-game: install the <Link href="/mod">SkyCofl mod</Link> and run <code>/cofl task</code>.
            </p>
        </Alert>
    )
}
