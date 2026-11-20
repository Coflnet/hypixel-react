'use client'
import { useId, useState } from 'react'
import { Alert, Button, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { useTermSwitchOptions } from '../../../hooks/useTermSwitchOptions'
import { getPremiumLabelForSubscription } from '../../../utils/PremiumTypeUtils'
import {
    describeCompletedSwitch,
    getEntryLabel,
    getFeaturedSaleTerm,
    getOfferedTerms,
    hasTermSwitchEntry,
    mayOfferTermSwitch,
    TERM_SWITCH_UNAVAILABLE_MESSAGE,
    type TermOptions,
    type TermSwitch
} from '../../../utils/SubscriptionTermSwitch'
import SwitchTermDialog from './SwitchTermDialog'

const RETURNED_WITHOUT_PAYMENT = 'The payment was not completed, so your subscription has not been switched.'

interface Props {
    subscription: PremiumSubscription
    /** the buyer came back from Stripe or PayPal without paying (/account?switch=id): the dialog opens again */
    linked?: boolean
    /** the subscription was switched (or its list is out of date): the list is refreshed */
    onSubscriptionsChanged(): void | Promise<unknown>
}

/** what a ?switch= link says about a subscription that has no longer term to switch to */
function LinkedNotice() {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null
    return (
        <Alert variant="info" dismissible onClose={() => setDismissed(true)} data-testid="switch-link-notice">
            {TERM_SWITCH_UNAVAILABLE_MESSAGE}
        </Alert>
    )
}

interface EntryProps {
    options: TermOptions | undefined
    onOpen(weeks?: number): void
}

function EntryButton({ options, onOpen }: EntryProps) {
    if (options?.pending)
        return (
            <Button size="sm" variant="outline-secondary" className="ms-1" onClick={() => onOpen()}>
                Switch to {options.pending.weeks} weeks: in progress
            </Button>
        )
    const terms = getOfferedTerms(options)
    const sale = getFeaturedSaleTerm(terms)
    return (
        <Button size="sm" variant={sale ? 'success' : 'outline-success'} className="ms-1" onClick={() => onOpen(sale?.weeks)}>
            {getEntryLabel(terms)}
        </Button>
    )
}

/** the offer on a 4 (or 13) week subscription's row to switch to a longer term of the same tier, and its dialog */
export default function SwitchSubscriptionTerm({ subscription, linked, onSubscriptionsChanged }: Props) {
    const eligible = mayOfferTermSwitch(subscription)
    const options = useTermSwitchOptions(subscription.externalId, eligible)
    const [show, setShow] = useState(false)
    const [linkHandled, setLinkHandled] = useState(false)
    const [initialWeeks, setInitialWeeks] = useState<number>()
    const [busy, setBusy] = useState(false)
    const titleId = useId()
    // a ?switch= link opens the dialog once the options are known
    const linkOpen = !!linked && eligible && !linkHandled && !options.isPending
    const open = show || linkOpen

    const refreshList = () => void Promise.resolve(onSubscriptionsChanged()).catch(() => undefined)

    function openDialog(weeks?: number) {
        setInitialWeeks(weeks)
        setShow(true)
    }

    function close() {
        if (busy) return
        setShow(false)
        setLinkHandled(true)
    }

    function onSwitched(result: TermSwitch) {
        toast.success(describeCompletedSwitch(result))
        refreshList()
        setShow(false)
        setLinkHandled(true)
    }

    if (!open && !eligible) return linked && !linkHandled ? <LinkedNotice /> : null
    if (!open && !hasTermSwitchEntry(options.data)) return null
    return (
        <div data-testid="term-switch-entry">
            {hasTermSwitchEntry(options.data) && <EntryButton options={options.data} onOpen={openDialog} />}
            <Modal show={open} onHide={close} backdrop={busy ? 'static' : true} keyboard={!busy} aria-labelledby={titleId}>
                <Modal.Header closeButton={!busy}>
                    <Modal.Title id={titleId}>Switch {getPremiumLabelForSubscription(subscription)} to a longer term</Modal.Title>
                </Modal.Header>
                <SwitchTermDialog
                    subscription={subscription}
                    initialWeeks={initialWeeks}
                    notice={linkOpen ? RETURNED_WITHOUT_PAYMENT : undefined}
                    onClose={close}
                    onBusyChange={setBusy}
                    onSwitched={onSwitched}
                    onRefreshList={refreshList}
                />
            </Modal>
        </div>
    )
}
