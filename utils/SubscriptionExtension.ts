import { getLocalDateAndTime } from './Formatter'
import { formatMoney } from './PricingUtils'
import { getDeclarationErrorSlug, hasErrorSlug, RENEWAL_WEEKS, type DeclarationErrorSlug } from './SubscriptionCheckout'

// Renewing a 13 or 52 week subscription for one more term instead of continuing every 4 weeks.

const LONG_TERMS = [13, 52]

export const EXTENSION_UNAVAILABLE_MESSAGE = "This subscription can't be renewed for another term right now."
export const AGREEMENT_REQUIRED_MESSAGE = 'Accept the current agreement on the Premium page before renewing.'
const DECLARATION_MESSAGES: Record<DeclarationErrorSlug, string> = {
    service_performance_declaration_required: 'Please tick the early start declaration, then order the renewal again. Without it the subscription cannot be renewed.',
    invalid_service_performance_declaration:
        'The early start declaration has changed or could not be verified. Please read it again, confirm it and order the renewal again.'
}

const PAYMENT_ERROR_MESSAGE = 'The Premium declaration changed. Review it and try again.'
const EXTENSION_FAILED_MESSAGE = 'The renewal could not be started. Please try again.'

/** whether the subscription is in its first, long term (13 or 52 weeks): the backend sets the term end for every subscription */
export function isInLongTerm(subscription: PremiumSubscription, now: Date = new Date()): boolean {
    return (
        LONG_TERMS.includes(subscription.termWeeks ?? 0) &&
        (subscription.renewalPrice ?? 0) > 0 &&
        !!subscription.currency &&
        (subscription.providerSlug === 'stripe' || subscription.providerSlug === 'paypal') &&
        !!subscription.currentTermEndsAt &&
        subscription.currentTermEndsAt.getTime() > now.getTime()
    )
}

/**
 * whether the backend has the 4 week renewal terms of this long term subscription: only then "continues every 4 weeks at
 * {renewalPrice}" is true (older ones, e.g. legacy PayPal plans, renew for their full period at the renewal price). The
 * backend offers or books the renewal only for those.
 */
export function hasRenewalTerms(subscription: PremiumSubscription): boolean {
    return isInLongTerm(subscription) && (!!subscription.canExtendLongTerm || !!subscription.extendedUntil)
}

/** whether the buyer can order the renewal: the backend offers it with a price in a currency */
export function canOfferExtension(subscription: PremiumSubscription): boolean {
    return isInLongTerm(subscription) && !!subscription.canExtendLongTerm && (subscription.extensionPrice ?? 0) > 0
}

/** the length of the subscription's long term in weeks (13 or 52), only meaningful while `isInLongTerm` */
export function getTermWeeks(subscription: PremiumSubscription): number {
    return subscription.termWeeks ?? 0
}

/** when and how the renewal is charged, by the provider that bills the subscription */
export function describePayment(subscription: PremiumSubscription): string {
    const termEnd = formatTermEnd(subscription)
    if (subscription.providerSlug === 'paypal') return `You approve it with PayPal now; PayPal charges it on ${termEnd}.`
    return `Charged on ${termEnd} to the payment method of this subscription.`
}

export function formatTermEnd(subscription: PremiumSubscription): string {
    return getLocalDateAndTime(subscription.currentTermEndsAt!)
}

/** the tax wording behind an extension price: gross "incl. VAT", net "+ applicable tax", none nothing */
export function getTaxSuffix(treatment: PremiumSubscription['extensionTaxTreatment']): string {
    if (treatment === 'included') return 'incl. VAT'
    if (treatment === 'net') return '+ applicable tax'
    return ''
}

/** "52.00 EUR incl. VAT", the price with its tax wording */
export function formatPriceWithTax(price: number, currency: string | undefined, treatment: PremiumSubscription['extensionTaxTreatment']): string {
    return [formatMoney(price, currency || 'EUR'), getTaxSuffix(treatment)].filter(Boolean).join(' ')
}

/** the price of the 4 week continuation, with the tax wording of the extension price */
export function formatRenewalPrice(subscription: PremiumSubscription): string {
    return formatPriceWithTax(subscription.renewalPrice ?? 0, subscription.currency, subscription.extensionTaxTreatment)
}

export function formatExtensionPrice(subscription: PremiumSubscription): string {
    return formatPriceWithTax(subscription.extensionPrice ?? 0, subscription.currency, subscription.extensionTaxTreatment)
}

export function describeContinuation(subscription: PremiumSubscription): string {
    return `Afterwards it continues every ${RENEWAL_WEEKS} weeks at ${formatRenewalPrice(subscription)}.`
}

export type ExtensionOutcome =
    | { kind: 'extended' }
    | { kind: 'redirect'; url: string }
    | { kind: 'error'; message: string; declarationRefused?: boolean; needsAgreement?: boolean; refreshList?: boolean }

/** what an answer of POST /api/premium/subscription/{id}/extend means for the buyer */
export function getExtensionOutcome(status: number, data: unknown): ExtensionOutcome {
    if (status === 200) return getSuccessOutcome(data as { extended?: boolean; approvalUrl?: string | null } | null)
    if (status === 428) return { kind: 'error', message: AGREEMENT_REQUIRED_MESSAGE, needsAgreement: true }
    if (hasErrorSlug(data, 'extension_failed')) return { kind: 'error', message: EXTENSION_FAILED_MESSAGE, refreshList: true }
    if (hasErrorSlug(data, 'extension_unavailable')) return { kind: 'error', message: EXTENSION_UNAVAILABLE_MESSAGE }
    if (hasErrorSlug(data, 'payment_error')) return { kind: 'error', message: PAYMENT_ERROR_MESSAGE, declarationRefused: true }
    const declarationSlug = getDeclarationErrorSlug(data)
    if (declarationSlug) return { kind: 'error', message: DECLARATION_MESSAGES[declarationSlug], declarationRefused: true }
    return { kind: 'error', message: EXTENSION_FAILED_MESSAGE }
}

function getSuccessOutcome(data: { extended?: boolean; approvalUrl?: string | null } | null): ExtensionOutcome {
    if (data?.approvalUrl) return { kind: 'redirect', url: data.approvalUrl }
    if (data?.extended) return { kind: 'extended' }
    return { kind: 'error', message: EXTENSION_FAILED_MESSAGE }
}
