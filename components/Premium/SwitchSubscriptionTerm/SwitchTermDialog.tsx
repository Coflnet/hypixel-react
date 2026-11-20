'use client'
import { useState, type ReactNode } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import { useSubscriptionTermSwitch } from '../../../hooks/useSubscriptionTermSwitch'
import { useProcessingSettled, useTermSwitchOptions } from '../../../hooks/useTermSwitchOptions'
import {
    describeCharge,
    describeCompletedSwitch,
    describeKeptDays,
    describeTermContinuation,
    describeTermPayment,
    formatTermPrice,
    getOfferedTerms,
    isTrustedPaymentUrl,
    TERM_SWITCH_AGREEMENT_MESSAGE,
    TERM_SWITCH_PROCESSING_MESSAGE,
    TERM_SWITCH_UNAVAILABLE_MESSAGE,
    type TermOption,
    type TermSwitch
} from '../../../utils/SubscriptionTermSwitch'
import PurchaseDeclaration from '../PurchaseDeclaration/PurchaseDeclaration'

const PROCESSED_MESSAGE = 'The payment was processed. Your subscription on this page now shows its new term.'
const PAYMENT_FAILED_MESSAGE = 'The payment did not go through, so your subscription has not been switched.'

export interface SwitchTermDialogProps {
    subscription: PremiumSubscription
    /** the term chosen in advance (the one the sale button advertises) */
    initialWeeks?: number
    /** shown above the terms, e.g. that the buyer came back from Stripe or PayPal without paying (/account?switch=id) */
    notice?: string
    onClose(): void
    onBusyChange(busy: boolean): void
    onSwitched(result: TermSwitch): void
    onRefreshList(): void
}

function CloseFooter({ onClose }: { onClose(): void }) {
    return (
        <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
                Close
            </Button>
        </Modal.Footer>
    )
}

/** a view of the dialog without a choice: its text and a close button */
function MessageView({ children, onClose }: { children: ReactNode; onClose(): void }) {
    return (
        <>
            <Modal.Body>{children}</Modal.Body>
            <CloseFooter onClose={onClose} />
        </>
    )
}

function ContinuePayment({ pending }: { pending: TermSwitch }) {
    if (!isTrustedPaymentUrl(pending.approvalUrl)) return null
    const provider = pending.status === 'approval_required' ? 'PayPal' : 'the payment page'
    return (
        <Button as="a" href={pending.approvalUrl} variant="success" size="sm">
            Continue to {provider}
        </Button>
    )
}

function describePending(pending: TermSwitch): string {
    const target = `Your switch to ${pending.weeks} weeks`
    const price = formatTermPrice(pending.chargedNow, pending)
    if (pending.status === 'completed') return describeCompletedSwitch(pending)
    if (pending.status === 'processing') return `${target} is being processed. ${TERM_SWITCH_PROCESSING_MESSAGE}`
    if (pending.status === 'approval_required') return `${target} waits for your approval of ${price} with PayPal.`
    if (pending.status === 'payment_required') return `${target} waits for your payment of ${price}.`
    return `${target} is in progress.`
}

/** a switch that was started before: what it waits for instead of the options */
function PendingView({ pending, onClose }: { pending: TermSwitch; onClose(): void }) {
    const processing = pending.status === 'processing'
    return (
        <MessageView onClose={onClose}>
            <p role="status" aria-live="polite" data-testid="term-switch-pending">
                {processing && <Spinner size="sm" aria-hidden="true" className="me-1" />}
                {describePending(pending)}
            </p>
            {processing && <p>You can close this dialog; the subscription updates here once the payment is confirmed.</p>}
            <ContinuePayment pending={pending} />
        </MessageView>
    )
}

function AgreementRequired() {
    return (
        <p role="alert" className="text-danger">
            {TERM_SWITCH_AGREEMENT_MESSAGE} <a href="/premium#terms-acceptance">Review agreement</a>
        </p>
    )
}

function TermOptionLabel({ term }: { term: TermOption }) {
    const { charge, sale } = describeCharge(term)
    return (
        <span className="d-block">
            <strong className="d-block">{term.weeks} weeks</strong>
            <span className="d-block">
                <strong>{charge}</strong>
                {sale && ` ${sale}`}.
            </span>
            <span className="d-block">{describeKeptDays(term)}</span>
            <span className="d-block">{describeTermContinuation(term)}</span>
        </span>
    )
}

interface TermListProps {
    subscription: PremiumSubscription
    terms: TermOption[]
    selected?: number
    disabled: boolean
    onSelect(weeks: number): void
}

function TermList({ subscription, terms, selected, disabled, onSelect }: TermListProps) {
    const name = `switch-term-${subscription.externalId}`
    return (
        <fieldset className="mb-3" disabled={disabled}>
            <legend className="fs-6 fw-bold">Choose the new term</legend>
            {terms.map(term => (
                <div key={term.weeks} className="border rounded p-2 mb-2" data-testid={`term-option-${term.weeks}`}>
                    <Form.Check
                        type="radio"
                        id={`${name}-${term.weeks}`}
                        name={name}
                        checked={selected === term.weeks}
                        onChange={() => onSelect(term.weeks)}
                        label={<TermOptionLabel term={term} />}
                    />
                </div>
            ))}
        </fieldset>
    )
}

function getConfirmLabel(term: TermOption | undefined): string {
    if (!term) return 'Choose a term'
    return `Pay ${describeCharge(term).charge} and switch to ${term.weeks} weeks`
}

interface ChoiceProps extends SwitchTermDialogProps {
    terms: TermOption[]
    refreshing: boolean
}

/** the offered terms, the declaration and the order button */
function TermChoice(props: ChoiceProps) {
    const { subscription, terms, refreshing, onClose } = props
    const [selected, setSelected] = useState(props.initialWeeks ?? (terms.length === 1 ? terms[0].weeks : undefined))
    const term = terms.find(option => option.weeks === selected)
    const termSwitch = useSubscriptionTermSwitch(subscription, {
        onBusyChange: props.onBusyChange,
        onSwitched: props.onSwitched,
        onRefreshList: props.onRefreshList
    })
    const { declaration, busy, error } = termSwitch
    return (
        <>
            <Modal.Body>
                {props.notice && <Alert variant="warning">{props.notice}</Alert>}
                <p>
                    <strong>The switch happens immediately and the new term is charged today.</strong> {describeTermPayment(subscription)}
                </p>
                <p>
                    <strong>Nothing is refunded:</strong> the days you have already paid for are kept and the new term is added after them. The new term runs
                    for its full length; cancelling takes effect at its end.
                </p>
                <TermList subscription={subscription} terms={terms} selected={selected} disabled={busy} onSelect={setSelected} />
                {declaration.agreementRequired ? (
                    <AgreementRequired />
                ) : (
                    <PurchaseDeclaration state={declaration} id={`switch-declaration-${subscription.externalId}`} />
                )}
                {error && (
                    <p role="alert" className="text-danger">
                        {error.message} {error.needsAgreement && <a href="/premium#terms-acceptance">Review agreement</a>}
                    </p>
                )}
                <p role="status" aria-live="polite">
                    {busy ? 'Processing…' : ''}
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" disabled={busy} onClick={onClose}>
                    Close
                </Button>
                <Button variant="success" disabled={!term || !declaration.confirmed || busy || refreshing} onClick={() => term && void termSwitch.submit(term)}>
                    {busy && <Spinner size="sm" aria-hidden="true" />} {getConfirmLabel(term)}
                </Button>
            </Modal.Footer>
        </>
    )
}

/** the dialog's body: the offered terms, or the pending switch, or why there is nothing to choose */
export default function SwitchTermDialog(props: SwitchTermDialogProps) {
    const options = useTermSwitchOptions(props.subscription.externalId, true)
    const pending = options.data?.pending
    const settled = useProcessingSettled(pending?.status === 'processing', props.onRefreshList)
    const terms = getOfferedTerms(options.data)
    if (pending) return <PendingView pending={pending} onClose={props.onClose} />
    if (options.isPending) return <MessageView onClose={props.onClose}>Loading the terms…</MessageView>
    if (options.isError && !options.data)
        return (
            <MessageView onClose={props.onClose}>
                <p role="alert">The terms could not be loaded.</p>
                <Button size="sm" variant="secondary" onClick={() => void options.refetch()}>
                    Try again
                </Button>
            </MessageView>
        )
    // a processed switch leaves nothing to switch to; terms that are offered again mean the payment failed
    if (terms.length === 0) return <MessageView onClose={props.onClose}>{settled ? PROCESSED_MESSAGE : TERM_SWITCH_UNAVAILABLE_MESSAGE}</MessageView>
    const notice = settled ? PAYMENT_FAILED_MESSAGE : props.notice
    return <TermChoice {...props} notice={notice} terms={terms} refreshing={options.isFetching} />
}
