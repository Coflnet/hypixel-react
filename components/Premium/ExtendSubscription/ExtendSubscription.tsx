'use client'
import { useId, useState } from 'react'
import { Alert, Button, Modal, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { useSubscriptionExtension } from '../../../hooks/useSubscriptionExtension'
import { getLocalDateAndTime } from '../../../utils/Formatter'
import { getPremiumLabelForSubscription } from '../../../utils/PremiumTypeUtils'
import { RENEWAL_WEEKS } from '../../../utils/SubscriptionCheckout'
import {
    AGREEMENT_REQUIRED_MESSAGE,
    canOfferExtension,
    describeContinuation,
    describePayment,
    EXTENSION_UNAVAILABLE_MESSAGE,
    formatExtensionPrice,
    formatRenewalPrice,
    formatTermEnd,
    getTermWeeks,
    hasRenewalTerms
} from '../../../utils/SubscriptionExtension'
import PurchaseDeclaration from '../PurchaseDeclaration/PurchaseDeclaration'

interface Props {
    subscription: PremiumSubscription
    /** the reminder mail links to this subscription (/account?extend=id): its dialog opens, or it explains the term */
    linked?: boolean
    /** the subscription was renewed (or its list is out of date): the list is refreshed */
    onExtended(): void | Promise<unknown>
}

function getTermText(subscription: PremiumSubscription): string {
    const weeks = getTermWeeks(subscription)
    if (subscription.extendedUntil)
        return `Renewed for another ${weeks} weeks until ${getLocalDateAndTime(subscription.extendedUntil)}; afterwards it continues every ${RENEWAL_WEEKS} weeks.`
    return `Your ${weeks}-week term ends on ${formatTermEnd(subscription)}. ${describeContinuation(subscription)}`
}

/** what a reminder link says about a subscription: its terms when it is in a long term, otherwise only that it cannot be renewed */
function LinkedNotice({ subscription }: { subscription: PremiumSubscription }) {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null
    const text = hasRenewalTerms(subscription) ? getTermText(subscription) : EXTENSION_UNAVAILABLE_MESSAGE
    return (
        <Alert variant="info" dismissible onClose={() => setDismissed(true)} data-testid="extend-link-notice">
            {text}
        </Alert>
    )
}

interface DialogProps {
    subscription: PremiumSubscription
    onClose(): void
    onBusyChange(busy: boolean): void
    onExtended(): void | Promise<unknown>
}

function AgreementRequired() {
    return (
        <p role="alert" className="text-danger">
            {AGREEMENT_REQUIRED_MESSAGE} <a href="/premium#terms-acceptance">Review agreement</a>
        </p>
    )
}

function ExtendDialogBody({ subscription, onClose, onBusyChange, onExtended }: DialogProps) {
    const weeks = getTermWeeks(subscription)
    const refresh = () => Promise.resolve(onExtended()).catch(() => undefined)
    const extension = useSubscriptionExtension(subscription, {
        onBusyChange,
        onRefresh: () => void refresh(),
        onExtended: () => {
            toast.success(`Your subscription was renewed for another ${weeks} weeks.`)
            void refresh()
            onClose()
        }
    })
    const { declaration, busy, error } = extension
    const price = formatExtensionPrice(subscription)
    return (
        <>
            <Modal.Body>
                <p>
                    Renew {getPremiumLabelForSubscription(subscription)} for another {weeks} weeks from {formatTermEnd(subscription)} for {price}.{' '}
                    {describePayment(subscription)} Afterwards it continues every {RENEWAL_WEEKS} weeks at {formatRenewalPrice(subscription)} until you
                    cancel.
                </p>
                <p>The renewed term runs for its full {weeks} weeks; cancelling takes effect at its end.</p>
                {declaration.agreementRequired ? <AgreementRequired /> : <PurchaseDeclaration state={declaration} id={`extend-declaration-${subscription.externalId}`} />}
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
                <Button variant="success" disabled={!declaration.confirmed || busy} onClick={() => void extension.submit()}>
                    {busy && <Spinner size="sm" aria-hidden="true" />} Renew for {weeks} weeks — pay {price}
                </Button>
            </Modal.Footer>
        </>
    )
}

/** the long term of a 13 or 52 week subscription: when it ends, what follows, and the offer to renew it once more */
export default function ExtendSubscription({ subscription, linked, onExtended }: Props) {
    const [show, setShow] = useState(!!linked && canOfferExtension(subscription))
    const [busy, setBusy] = useState(false)
    const titleId = useId()
    const weeks = getTermWeeks(subscription)
    if (!hasRenewalTerms(subscription)) return linked ? <LinkedNotice subscription={subscription} /> : null
    return (
        <div data-testid="subscription-term">
            <small>{getTermText(subscription)}</small>
            {canOfferExtension(subscription) && (
                <Button size="sm" variant="outline-success" className="ms-1" onClick={() => setShow(true)}>
                    Renew for another {weeks} weeks
                </Button>
            )}
            <Modal
                show={show}
                onHide={() => !busy && setShow(false)}
                backdrop={busy ? 'static' : true}
                keyboard={!busy}
                aria-labelledby={titleId}
            >
                <Modal.Header closeButton={!busy}>
                    <Modal.Title id={titleId}>
                        Renew {getPremiumLabelForSubscription(subscription)} for another {weeks} weeks
                    </Modal.Title>
                </Modal.Header>
                <ExtendDialogBody subscription={subscription} onClose={() => setShow(false)} onBusyChange={setBusy} onExtended={onExtended} />
            </Modal>
        </div>
    )
}
