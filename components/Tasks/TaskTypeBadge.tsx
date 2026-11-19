import { Badge } from 'react-bootstrap'
import type { PublicTask } from '../../api/publicTaskApi'
import { getTypeBadge } from './taskUtils'

export function TaskTypeBadge({ type }: { type: PublicTask['type'] }) {
    const badge = getTypeBadge(type)
    if (!badge) {
        return null
    }
    return (
        <Badge bg={badge.bg} text="dark" className="ms-2">
            {badge.label}
        </Badge>
    )
}
