'use client'
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { capitalize, getConfidenceBg, getMeasuredLabel, isMeasured, type BasisInfo } from './taskSetupUtils'

const ESTIMATE_HINT = 'Not enough player data yet, modelled from stats'

function EstimateBadge() {
    return (
        <OverlayTrigger placement="top" overlay={<Tooltip id="task-setup-estimate-hint">{ESTIMATE_HINT}</Tooltip>}>
            <Badge bg="secondary" data-cy="basis-badge" data-basis="estimate" tabIndex={0}>
                Estimate
            </Badge>
        </OverlayTrigger>
    )
}

/** Measured (with player count and hours) or estimate; locked setups have no basis and show nothing. */
export function BasisBadge({ basis }: { basis: BasisInfo }) {
    if (isMeasured(basis)) {
        return (
            <Badge bg="success" data-cy="basis-badge" data-basis="measured">
                {getMeasuredLabel(basis)}
            </Badge>
        )
    }
    return basis.basis === 'estimate' ? <EstimateBadge /> : null
}

export function ConfidenceBadge({ confidence }: { confidence?: string | null }) {
    if (!confidence) {
        return null
    }
    return <Badge bg={getConfidenceBg(confidence)}>{capitalize(confidence)} confidence</Badge>
}
