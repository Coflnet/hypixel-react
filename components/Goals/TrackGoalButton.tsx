'use client'
import { useState } from 'react'
import { Badge, Button, Form } from 'react-bootstrap'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { deleteApiModGoalsId, getGetApiModGoalsQueryKey, postApiModGoals } from '../../api/_generated/skyApi'
import { getGeneratedApiErrorMessage } from '../../utils/GeneratedApiResponseUtils'
import { useModGoals } from './useModGoals'

interface Props {
    kind: 'craft' | 'forge'
    itemTag: string
    itemName: string
}

export function TrackGoalButton({ kind, itemTag, itemName }: Props) {
    const { token, data } = useModGoals()
    const queryClient = useQueryClient()
    const [quantity, setQuantity] = useState(1)
    const [sell, setSell] = useState(false)
    const [busy, setBusy] = useState(false)
    const tracked = data?.goals.find(goal => goal.rootItemTag === itemTag)

    async function track() {
        if (!token) return
        setBusy(true)
        try {
            const response = await postApiModGoals({ kind, itemTag, quantity: Math.max(1, quantity || 1), sell }, { headers: { GoogleToken: token } })
            if (response.status === 200) {
                toast.success(
                    <span>
                        Tracking <i>{itemName}</i> in game — open your inventory to see the steps
                    </span>
                )
            } else {
                toast.error(getGeneratedApiErrorMessage(response, null, 'Unable to track this in game'))
            }
        } catch (error) {
            toast.error(getGeneratedApiErrorMessage(null, error, 'Unable to track this in game'))
        }
        setBusy(false)
        queryClient.invalidateQueries({ queryKey: getGetApiModGoalsQueryKey() })
    }

    async function untrack() {
        if (!token || !tracked) return
        setBusy(true)
        try {
            const response = await deleteApiModGoalsId(tracked.id, { headers: { GoogleToken: token } })
            if (response.status !== 204) {
                toast.error(getGeneratedApiErrorMessage(response, null, 'Unable to untrack this goal'))
            }
        } catch (error) {
            toast.error(getGeneratedApiErrorMessage(null, error, 'Unable to untrack this goal'))
        }
        setBusy(false)
        queryClient.invalidateQueries({ queryKey: getGetApiModGoalsQueryKey() })
    }

    if (tracked) {
        return (
            <div className="d-flex align-items-center gap-2 my-2" onClick={e => e.stopPropagation()}>
                <Badge bg="success">Tracking ✓</Badge>
                <Button size="sm" variant="outline-danger" disabled={busy} onClick={untrack}>
                    Untrack
                </Button>
            </div>
        )
    }

    return (
        <div className="d-flex align-items-center flex-wrap gap-2 my-2" onClick={e => e.stopPropagation()}>
            <Form.Control
                type="number"
                min={1}
                value={quantity}
                aria-label="Quantity"
                style={{ width: '90px' }}
                size="sm"
                onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)}
            />
            <Form.Check type="switch" id={`track-sell-${kind}-${itemTag}`} label="Also sell when done" checked={sell} onChange={e => setSell(e.target.checked)} />
            <span title={token ? undefined : 'Log in to track this in game'}>
                <Button size="sm" disabled={!token || busy} onClick={track} style={token ? undefined : { pointerEvents: 'none' }}>
                    Track in game
                </Button>
            </span>
        </div>
    )
}

export default TrackGoalButton
