'use client'
import { useState } from 'react'
import { Badge, Button, Card, Collapse, ProgressBar } from 'react-bootstrap'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
    deleteApiModGoalsId,
    getGetApiModGoalsQueryKey,
    postApiModGoalsIdFocus,
    postApiModGoalsIdReset
} from '../../api/_generated/skyApi'
import type { ModGoalProgress, ModGoalStep } from '../../api/_generated/skyApi.schemas'
import { getGeneratedApiErrorMessage } from '../../utils/GeneratedApiResponseUtils'
import { getStepKindLabel, getStepStatusVariant } from '../../utils/GoalUtils'
import { useModGoals } from './useModGoals'
import styles from './GoalList.module.css'

function StepTree({ step }: { step: ModGoalStep }) {
    const variant = getStepStatusVariant(step.status)
    const children = step.children ?? []
    return (
        <li>
            <div className={styles.step}>
                <Badge bg={variant === 'orange' ? undefined : variant} className={variant === 'orange' ? styles.orange : undefined}>
                    {step.status}
                </Badge>
                <span>
                    <strong>{getStepKindLabel(step.kind)}</strong> {step.quantity}× {step.itemName}
                </span>
            </div>
            {children.length > 0 && (
                <ul className={styles.steps}>
                    {children.map(child => (
                        <StepTree key={child.id} step={child} />
                    ))}
                </ul>
            )}
        </li>
    )
}

export function GoalList() {
    const { token, data } = useModGoals()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState<boolean | null>(null)

    if (!token || !data) {
        return null
    }

    const isOpen = open ?? !!data.focusId
    const goals = data.goals ?? []

    async function run(action: (id: string, options?: RequestInit) => Promise<{ status: number; data: unknown }>, goal: ModGoalProgress) {
        if (!goal.id) {
            return
        }
        try {
            const response = await action(goal.id, { headers: { GoogleToken: token! } })
            if (response.status < 200 || response.status >= 300) {
                toast.error(getGeneratedApiErrorMessage(response, null, 'Unable to update the goal'))
            }
        } catch (error) {
            toast.error(getGeneratedApiErrorMessage(null, error, 'Unable to update the goal'))
        }
        queryClient.invalidateQueries({ queryKey: getGetApiModGoalsQueryKey() })
    }

    return (
        <Card className="mb-3">
            <Card.Header className={styles.toggle} onClick={() => setOpen(!isOpen)} aria-expanded={isOpen}>
                {isOpen ? '▾' : '▸'} Your in-game goals <Badge bg="secondary">{goals.length}</Badge>
            </Card.Header>
            <Collapse in={isOpen}>
                <div>
                    <Card.Body>
                        {goals.length === 0 && <p className="mb-0">No goals tracked yet. Use &quot;Track in game&quot; on a craft or forge flip.</p>}
                        {goals.map(goal => {
                            const focused = goal.id === data.focusId
                            return (
                                <Card key={goal.id} className={`mb-2 ${focused ? styles.focused : ''}`}>
                                    <Card.Body>
                                        <div className={styles.goalHeader}>
                                            <span className={styles.goalTitle}>{goal.title}</span>
                                            <Button
                                                size="sm"
                                                variant={focused ? 'warning' : 'outline-warning'}
                                                title={focused ? 'Focused goal' : 'Focus this goal in game'}
                                                aria-pressed={focused}
                                                onClick={() => run(postApiModGoalsIdFocus, goal)}
                                            >
                                                ★
                                            </Button>
                                            <Button size="sm" variant="outline-secondary" onClick={() => run(postApiModGoalsIdReset, goal)}>
                                                Reset
                                            </Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => run(deleteApiModGoalsId, goal)}>
                                                Remove
                                            </Button>
                                        </div>
                                        <ProgressBar
                                            className="my-2"
                                            now={goal.total > 0 ? (goal.done / goal.total) * 100 : 0}
                                            label={`${goal.done}/${goal.total}`}
                                        />
                                        <ul className={styles.steps}>
                                            {goal.root && <StepTree step={goal.root} />}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            )
                        })}
                    </Card.Body>
                </div>
            </Collapse>
        </Card>
    )
}

export default GoalList
