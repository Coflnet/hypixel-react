'use client'
import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { getApiPremiumSlots, putApiPremiumSlotsIdAssignment } from '../../../api/_generated/skyApi'
import type { OwnedTierSlot, SlotRecipient } from '../../../api/_generated/skyApi.schemas'
import { GOOGLE_EMAIL, getSetting } from '../../../utils/SettingsUtils'

function recipientName(slot: OwnedTierSlot) {
    return (
        [slot.recipientEmail || (slot.assignedUserId ? `Account #${slot.assignedUserId}` : ''), slot.minecraftName || slot.minecraftUuid]
            .filter(Boolean)
            .join(' / ') || 'Unassigned'
    )
}

function errorMessage(data: unknown) {
    if (typeof data === 'string' && data) return data
    if (data && typeof data === 'object') {
        const message = 'message' in data ? data.message : 'Message' in data ? data.Message : undefined
        if (typeof message === 'string') return message
    }
    return 'Could not save the assignment. Check the current slots and try again.'
}

interface Props {
    subscriptions: PremiumSubscription[]
    onCancelSubscription(subscription: PremiumSubscription): void
}

export default function TierSlots({ subscriptions, onCancelSubscription }: Props) {
    const [slots, setSlots] = useState<OwnedTierSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [fromCheckout, setFromCheckout] = useState(false)
    const [error, setError] = useState('')
    const [editing, setEditing] = useState<OwnedTierSlot>()
    const [mode, setMode] = useState<'email' | 'minecraft'>('email')
    const [recipient, setRecipient] = useState('')
    const [saving, setSaving] = useState(false)

    function requestOptions() {
        return { headers: { GoogleToken: sessionStorage.getItem('googleId') || '' }, cache: 'no-store' as const }
    }

    async function loadSlots() {
        setLoading(true)
        try {
            const response = await getApiPremiumSlots(requestOptions())
            if (response.status !== 200 || !Array.isArray(response.data) || response.data.some(slot => typeof slot.id !== 'string')) throw new Error()
            setSlots(response.data)
            setEditing(current => (current ? response.data.find(slot => slot.id === current.id) : undefined))
        } catch {
            setError('Could not load purchased slots. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setFromCheckout(new URLSearchParams(window.location.search).get('slots') === 'checkout')
        void loadSlots()
    }, [])

    async function saveAssignment(slot: OwnedTierSlot, assignment: SlotRecipient) {
        setSaving(true)
        setError('')
        try {
            const response = await putApiPremiumSlotsIdAssignment(slot.id!, { ...assignment, version: slot.version }, requestOptions())
            if (response.status !== 204) {
                await loadSlots()
                throw new Error(errorMessage(response.data))
            }
            setEditing(undefined)
            toast.success(assignment.email || assignment.minecraftAccount ? 'Slot assigned. Access updates in the mod shortly.' : 'Slot released.')
            await loadSlots()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not save the assignment. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    function editSlot(slot: OwnedTierSlot) {
        setError('')
        setEditing(slot)
        setMode(slot.minecraftUuid ? 'minecraft' : 'email')
        setRecipient(slot.minecraftName || slot.minecraftUuid || slot.recipientEmail || '')
    }

    return (
        <section id="purchased-slots" className="my-4" aria-labelledby="purchased-slots-title">
            <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <h3 id="purchased-slots-title" className="mb-0">
                    Purchased slots
                </h3>
                <Button as="a" href="/premium?slots=true#buyPremium" size="sm" variant="success">Buy slots</Button>
                <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading || saving}
                    onClick={() => {
                        setError('')
                        void loadSlots()
                    }}
                >
                    Refresh slots
                </Button>
            </div>
            {fromCheckout ? <Alert variant="info">Assign your purchased slots below. Payment confirmation can take a moment; refresh the slots if your new purchase has not appeared yet.</Alert> : null}
            <p>Assign slots to yourself or friends. You keep control of billing and assignments.</p>
            <p>Release slot removes its assignment and keeps billing active. To stop renewal, use Cancel slot subscription below.</p>
            {error && !editing ? (
                <Alert variant="danger" role="alert">
                    {error}
                </Alert>
            ) : null}
            {loading ? <p role="status">Loading slots…</p> : null}
            {!loading && !error && slots.length === 0 ? <p>You don’t own any slots yet. Purchased bundles will appear here.</p> : null}
            <div className="d-flex flex-column gap-3">
                {slots.map((slot, index) => {
                    const expired = !slot.expires || new Date(slot.expires).getTime() <= Date.now()
                    const assigned = !!(slot.assignedUserId || slot.minecraftUuid)
                    const subscription = subscriptions.find(item => item.externalId === slot.subscriptionId)
                    const bundle = (subscription?.slotCount || 0) > 1
                    return (
                        <div key={slot.id} data-testid="tier-slot" className="border rounded p-3">
                            <strong>
                                Slot {index + 1} · {slot.tier === 'premium_plus' ? 'Premium+' : 'Premium'}
                            </strong>
                            <p className="mb-1">
                                {expired ? 'Expired' : 'Active until'} {slot.expires ? new Date(slot.expires).toLocaleString() : ''}
                            </p>
                            <p className="mb-2 text-break">{recipientName(slot)}</p>
                            {subscription ? (
                                <p className="mb-2">
                                    {subscription.endsAt
                                        ? `Canceled · access until ${subscription.endsAt.toLocaleString()}`
                                        : `Renews ${subscription.renewsAt.toLocaleString()}`}
                                    {bundle ? ` · Part of a ${subscription.slotCount}-slot subscription` : ' · Single-slot subscription'}
                                </p>
                            ) : slot.subscriptionId ? <p>Subscription details unavailable. Refresh the account page to manage billing.</p> : null}
                            <div className="d-flex flex-wrap gap-2">
                                <Button size="sm" disabled={loading || saving || expired} onClick={() => editSlot(slot)}>
                                    {assigned ? 'Reassign' : 'Assign slot'}
                                </Button>
                                {assigned ? (
                                    <Button size="sm" variant="secondary" disabled={loading || saving} onClick={() => void saveAssignment(slot, {})}>
                                        Release slot
                                    </Button>
                                ) : null}
                                {subscription && !subscription.endsAt ? (
                                    <Button size="sm" variant="outline-danger" onClick={() => onCancelSubscription(subscription)}>
                                        {bundle ? `Cancel ${subscription.slotCount}-slot subscription` : 'Cancel slot subscription'}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>
            <Modal
                show={!!editing}
                onHide={() => {
                    if (!saving) setEditing(undefined)
                }}
                centered
            >
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>Assign slot</Modal.Title>
                </Modal.Header>
                <Form
                    onSubmit={event => {
                        event.preventDefault()
                        if (editing && !saving && recipient.trim())
                            void saveAssignment(editing, mode === 'email' ? { email: recipient.trim() } : { minecraftAccount: recipient.trim() })
                    }}
                >
                    <Modal.Body>
                        {error ? (
                            <Alert variant="danger" role="alert">
                                {error}
                            </Alert>
                        ) : null}
                        {editing ? <p className="text-break">Currently: {recipientName(editing)}</p> : null}
                        <Form.Group controlId="slot-recipient-type" className="mb-3">
                            <Form.Label>Assign by</Form.Label>
                            <Form.Select
                                value={mode}
                                disabled={saving}
                                onChange={event => {
                                    setMode(event.target.value as 'email' | 'minecraft')
                                    setRecipient('')
                                }}
                            >
                                <option value="email">Email address</option>
                                <option value="minecraft">Minecraft name</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="slot-recipient">
                            <Form.Label>{mode === 'email' ? 'Email address' : 'Minecraft name or UUID'}</Form.Label>
                            <Form.Control
                                type={mode === 'email' ? 'email' : 'text'}
                                value={recipient}
                                required
                                maxLength={mode === 'email' ? 254 : 36}
                                disabled={saving}
                                onChange={event => setRecipient(event.target.value)}
                            />
                            <Form.Text>
                                {mode === 'email'
                                    ? 'Use the email they sign in to SkyCofl with. They must have signed in at least once.'
                                    : 'This slot applies only to this Minecraft account.'}
                            </Form.Text>
                        </Form.Group>
                        {mode === 'email' && getSetting(GOOGLE_EMAIL) ? (
                            <Button size="sm" variant="secondary" className="mt-2" disabled={saving} onClick={() => setRecipient(getSetting(GOOGLE_EMAIL))}>
                                Use my email
                            </Button>
                        ) : null}
                        <p className="mt-3 mb-0">Reassigning removes this slot’s access from the previous recipient.</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" disabled={saving} onClick={() => setEditing(undefined)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || loading || !recipient.trim() || !editing?.expires || new Date(editing.expires).getTime() <= Date.now()}
                        >
                            {saving ? 'Saving…' : 'Save assignment'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </section>
    )
}
