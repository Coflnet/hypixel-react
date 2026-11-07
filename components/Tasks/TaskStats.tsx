import type { ReactNode } from 'react'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import type { PublicTask } from '../../api/publicTaskApi'
import { TaskDoers } from './TaskDoers'
import { formatCoins, formatCount, getSourceLabel } from './taskUtils'

function Stat({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Col xs={6} md={3} className="mb-3">
            <Card className="h-100">
                <CardBody>
                    <div className="text-muted small">{label}</div>
                    <div className="fs-5">{children}</div>
                </CardBody>
            </Card>
        </Col>
    )
}

/** Headline numbers of a task: coins/hour, players now and how much data backs the estimate. */
export function TaskStats({ task }: { task: PublicTask }) {
    return (
        <Row className="mt-3">
            <Stat label="Coins/hour">{formatCoins(task.coinsPerHour)}</Stat>
            <Stat label="Playing now">
                <TaskDoers currentDoers={task.currentDoers} doersChange20m={task.doersChange20m} />
            </Stat>
            <Stat label="Community tracked hours">{formatCount(task.communityTrackedHours)}</Stat>
            <Stat label="Contributors">{formatCount(task.contributors)}</Stat>
            <Col xs={12}>
                <p className="text-muted small">Source: {getSourceLabel(task.source)}</p>
            </Col>
        </Row>
    )
}
