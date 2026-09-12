'use client'

import { useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import { changeSubscriptionPlan, getSubscriptionPlans, SubscriptionChangeResult, SubscriptionPlan } from '../../../api/SubscriptionPlans'
import { getLocalDateAndTime } from '../../../utils/Formatter'

export default function UpgradeSubscription({ subscription }: { subscription: PremiumSubscription }) {
    const [show, setShow] = useState(false)
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [selected, setSelected] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState<SubscriptionChangeResult>()

    async function open() {
        setShow(true)
        setBusy(true)
        setError('')
        setResult(undefined)
        setPlans([])
        setSelected('')
        try {
            const available = await getSubscriptionPlans(subscription.externalId)
            setPlans(available)
            setSelected(available[0]?.productSlug ?? '')
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not load subscription plans.')
        } finally {
            setBusy(false)
        }
    }

    async function changePlan() {
        setBusy(true)
        setError('')
        try {
            setResult(await changeSubscriptionPlan(subscription.externalId, selected))
        } catch (error) {
            setError(error instanceof Error ? error.message : 'The plan change failed. Please try again.')
        } finally {
            setBusy(false)
        }
    }

    return <>
        <Button size="sm" variant="outline-primary" className="ms-1" onClick={open}>Change subscription plan</Button>
        <Modal show={show} onHide={() => !busy && setShow(false)} backdrop={busy ? 'static' : true} keyboard={!busy}>
            <Modal.Header closeButton={!busy}><Modal.Title>Change subscription plan</Modal.Title></Modal.Header>
            <Modal.Body>
                {busy && <Spinner size="sm" aria-label="Loading subscription plans" />}
                {error && <p role="alert">{error} {error.includes('agreement') && <a href="/premium">Review agreement</a>}</p>}
                {!busy && !error && !result && plans.length === 0 && <p>No plan changes are currently available for this subscription.</p>}
                {!result && plans.map(plan => <Form.Check
                    key={plan.productSlug}
                    id={`plan-${plan.productSlug}`}
                    type="radio"
                    name="subscriptionPlan"
                    checked={selected === plan.productSlug}
                    disabled={busy}
                    onChange={() => setSelected(plan.productSlug)}
                    label={`${plan.title} — ${new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currencyCode }).format(plan.price)} per billing period, before applicable tax`}
                />)}
                {!result && plans.length > 0 && <p className="mt-3">
                    {plans.find(plan => plan.productSlug === selected)?.isUpgrade
                        ? 'The upgrade applies after payment. Lemon Squeezy will charge the prorated difference for your remaining time. '
                        : 'Your current paid tier stays active until renewal. The selected plan will be billed at the next renewal, with no charge now. '}
                    Your next renewal remains {getLocalDateAndTime(subscription.renewsAt)}.
                    Existing slot assignments are preserved. PayPal may ask you to confirm the change in its portal.
                </p>}
                {result?.status === 'completed' && <p role="status">Your subscription plan has been updated.</p>}
                {result?.status === 'pending' && <p role="status">The plan change is awaiting payment confirmation. Your access will update after confirmation.</p>}
                {result?.status === 'redirect' && <>
                    <p>Confirm the subscription change in Lemon Squeezy. Your current plan stays active until the change is confirmed.</p>
                    <a className="btn btn-primary" href={result.redirectUrl}>Continue in Lemon Squeezy</a>
                </>}
            </Modal.Body>
            <Modal.Footer>
                {result && result.status !== 'redirect'
                    ? <Button onClick={() => window.location.reload()}>Refresh subscription status</Button>
                    : <Button variant="secondary" disabled={busy} onClick={() => setShow(false)}>Close</Button>}
                {!result && selected && <Button disabled={busy} onClick={changePlan}>{plans.find(plan => plan.productSlug === selected)?.isUpgrade ? 'Upgrade and pay difference' : 'Change next renewal'}</Button>}
            </Modal.Footer>
        </Modal>
    </>
}
