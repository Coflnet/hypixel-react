import type { SubscriptionTermOptionResponse, SubscriptionTermOptionsResponse, SubscriptionTermSwitchResponse } from '../api/_generated/skyApi.schemas'
import { formatMoney } from './PricingUtils'
import { getDeclarationErrorSlug, hasErrorSlug, type DeclarationErrorSlug } from './SubscriptionCheckout'
import { formatPriceWithTax } from './SubscriptionExtension'

// Switching a running 4 (or 13) week Stripe/PayPal subscription to a longer term of the same tier: the new term is charged now,
// the paid days left are kept (the new term is added on top) and it continues every 4 weeks afterwards.

export type TermOption = SubscriptionTermOptionResponse
export type TermOptions = SubscriptionTermOptionsResponse
export type TermSwitch = SubscriptionTermSwitchResponse
type TaxTreatment = PremiumSubscription['extensionTaxTreatment']

const SWITCHABLE_WEEKS = [4, 13]

export const TERM_SWITCH_UNAVAILABLE_MESSAGE = "This subscription can't switch to a longer term right now."
export const TERM_SWITCH_AGREEMENT_MESSAGE = 'Accept the current agreement on the Premium page before switching.'
export const TERM_SWITCH_PROCESSING_MESSAGE = 'Processing, this can take a minute.'
const TERM_SWITCH_FAILED_MESSAGE = 'The switch could not be completed. Please try again.'
const PRICE_CHANGED_MESSAGE = 'The price has changed. Please check the new price below and confirm again.'
const UNTRUSTED_PAYMENT_PAGE_MESSAGE = 'The payment page could not be opened. Please try again.'

/** whether a subscription may have longer terms to switch to: a running direct Stripe/PayPal one on a 4 or 13 week term */
export function mayOfferTermSwitch(subscription: PremiumSubscription): boolean {
    if (subscription.endsAt) return false
    if (subscription.providerSlug !== 'stripe' && subscription.providerSlug !== 'paypal') return false
    return SWITCHABLE_WEEKS.includes(subscription.termWeeks ?? 0)
}

/** the terms the buyer can choose now; none while a switch is pending or the backend says why not */
export function getOfferedTerms(options: TermOptions | null | undefined): TermOption[] {
    if (!options || options.unavailableReason || options.pending) return []
    return options.terms ?? []
}

/** whether the row offers the switch (or shows the pending one) */
export function hasTermSwitchEntry(options: TermOptions | null | undefined): boolean {
    return !!options?.pending || getOfferedTerms(options).length > 0
}

function parseTaxTreatment(value: string | null | undefined): TaxTreatment {
    return value === 'included' || value === 'net' || value === 'none' ? value : undefined
}

/** "€57.52 incl. VAT", a term price with its tax wording */
export function formatTermPrice(price: number, term: { currency?: string | null; taxTreatment?: string | null }): string {
    return formatPriceWithTax(price, term.currency ?? undefined, parseTaxTreatment(term.taxTreatment))
}

/** an access end as a date in the buyer's locale, e.g. "March 15, 2027"; the time of day is left out */
export function formatTermDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
}

/** whether the term is charged at a promotion price below its regular price */
export function isOnSale(term: TermOption): boolean {
    return !!term.promotion && term.chargedNow < term.regularPrice
}

/** the whole percent the promotion saves on the term: its own percent, otherwise computed from the prices (rounded down) */
export function getSalePercent(term: TermOption): number {
    if (!isOnSale(term)) return 0
    if (term.promotion?.amountType === 'percent' && term.promotion.amount > 0) return Math.floor(term.promotion.amount)
    return Math.floor(((term.regularPrice - term.chargedNow) / term.regularPrice) * 100)
}

/** the longest term on sale, the one the row advertises */
export function getFeaturedSaleTerm(terms: TermOption[]): TermOption | undefined {
    return terms.filter(isOnSale).sort((a, b) => b.weeks - a.weeks)[0]
}

export function getPromotionName(term: TermOption): string {
    return term.promotion?.name || 'sale'
}

/** the row's button: the sale it saves with, otherwise the plain offer */
export function getEntryLabel(terms: TermOption[]): string {
    const sale = getFeaturedSaleTerm(terms)
    if (!sale) return 'Switch to a longer term'
    const percent = getSalePercent(sale)
    const saving = percent > 0 ? `Save ${percent}%` : 'Save'
    return `${saving} with the ${getPromotionName(sale)}: switch to ${sale.weeks} weeks`
}

/** "€57.52 incl. VAT today (Blackweek sale, instead of €115.06)" */
export function describeCharge(term: TermOption): { charge: string; sale: string } {
    const charge = `${formatTermPrice(term.chargedNow, term)} today`
    if (!isOnSale(term)) return { charge, sale: '' }
    return { charge, sale: `(${getPromotionName(term)}, instead of ${formatMoney(term.regularPrice, term.currency || 'EUR')})` }
}

/** the paid days left on the current period are kept, the new term is added on top */
export function describeKeptDays(term: TermOption): string {
    const until = formatTermDate(term.newAccessEndsAt)
    const days = term.carriedOverDays
    if (days <= 0) return `Your access then runs until ${until}.`
    const remaining = days === 1 ? 'remaining day is' : `remaining ${days} days are`
    return `Your current period's ${remaining} kept, not refunded: your access then runs until ${until}.`
}

export function describeTermContinuation(term: TermOption): string {
    return `After that it continues every ${term.renewalWeeks} weeks at ${formatTermPrice(term.renewalPrice, term)} until you cancel.`
}

/** how the provider of the subscription takes today's charge */
export function describeTermPayment(subscription: PremiumSubscription): string {
    if (subscription.providerSlug === 'paypal') return 'You approve the payment with PayPal now.'
    return 'It is paid with the payment method of this subscription (your bank may ask you to confirm it on Stripe).'
}

const TRUSTED_PAYMENT_HOSTS = ['stripe.com', 'paypal.com']

/** whether `url` is an https page of Stripe or PayPal (or one of their subdomains), the only places a switch may send the buyer */
export function isTrustedPaymentUrl(url: string | null | undefined): url is string {
    if (!url) return false
    try {
        const { protocol, hostname } = new URL(url)
        if (protocol !== 'https:') return false
        return TRUSTED_PAYMENT_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))
    } catch {
        return false
    }
}

export type TermSwitchOutcome =
    | { kind: 'completed'; result: TermSwitch }
    | { kind: 'redirect'; url: string }
    | { kind: 'processing'; result: TermSwitch }
    | TermSwitchError

export interface TermSwitchError {
    kind: 'error'
    message: string
    /** the server refused the declaration: it is unticked and confirmed again */
    declarationRefused?: boolean
    needsAgreement?: boolean
    /** the offered terms (and their prices) are reloaded */
    refreshOptions?: boolean
    /** the subscription list is reloaded */
    refreshList?: boolean
}

const DECLARATION_MESSAGES: Record<DeclarationErrorSlug, string> = {
    service_performance_declaration_required: 'Please tick the early start declaration, then confirm the switch again. Without it the term cannot be switched.',
    invalid_service_performance_declaration:
        'The early start declaration has changed or could not be verified. Please read it again, confirm it and confirm the switch again.'
}

const UNAVAILABLE: TermSwitchError = { kind: 'error', message: TERM_SWITCH_UNAVAILABLE_MESSAGE, refreshOptions: true, refreshList: true }

/** the rejections with their own message, checked in this order */
const SLUG_ERRORS: [string, TermSwitchError][] = [
    ['term_switch_price_changed', { kind: 'error', message: PRICE_CHANGED_MESSAGE, refreshOptions: true }],
    ['renewal_due', { kind: 'error', message: 'Your subscription renews within 24 hours; switch after the renewal.' }],
    ['term_switch_pending', { kind: 'error', message: 'A switch of this subscription is already in progress.', refreshOptions: true }],
    [
        'extension_booked',
        { kind: 'error', message: 'This subscription is already renewed for another term, so it cannot switch to a longer one now.', refreshOptions: true }
    ],
    ['term_switch_unavailable', UNAVAILABLE],
    ['subscription_not_active', UNAVAILABLE],
    ['term_not_paid', UNAVAILABLE],
    ['no_longer_term', UNAVAILABLE],
    ['term_switch_not_offered', UNAVAILABLE],
    ['subscription_not_switchable', UNAVAILABLE],
    ['expected_charged_now_required', { kind: 'error', message: TERM_SWITCH_FAILED_MESSAGE, refreshOptions: true }],
    ['term_switch_failed', { kind: 'error', message: TERM_SWITCH_FAILED_MESSAGE, refreshOptions: true, refreshList: true }]
]

/** what an answer of POST /api/premium/subscription/{id}/term means for the buyer */
export function getTermSwitchOutcome(status: number, data: unknown): TermSwitchOutcome {
    if (status === 200) return getSuccessOutcome(data as TermSwitch | null)
    if (status === 428) return { kind: 'error', message: TERM_SWITCH_AGREEMENT_MESSAGE, needsAgreement: true }
    const declarationSlug = getDeclarationErrorSlug(data)
    if (declarationSlug) return { kind: 'error', message: DECLARATION_MESSAGES[declarationSlug], declarationRefused: true }
    const known = SLUG_ERRORS.find(([slug]) => hasErrorSlug(data, slug))
    return known ? known[1] : { kind: 'error', message: TERM_SWITCH_FAILED_MESSAGE }
}

function getSuccessOutcome(result: TermSwitch | null): TermSwitchOutcome {
    if (!result) return { kind: 'error', message: TERM_SWITCH_FAILED_MESSAGE, refreshOptions: true }
    if (result.status === 'completed' || (result.switched && !result.status)) return { kind: 'completed', result }
    if (result.status === 'processing') return { kind: 'processing', result }
    if (result.status !== 'payment_required' && result.status !== 'approval_required')
        return { kind: 'error', message: TERM_SWITCH_FAILED_MESSAGE, refreshOptions: true }
    if (!isTrustedPaymentUrl(result.approvalUrl)) return { kind: 'error', message: UNTRUSTED_PAYMENT_PAGE_MESSAGE, refreshOptions: true }
    return { kind: 'redirect', url: result.approvalUrl }
}

/** "Switched to 52 weeks. Your access runs until …" */
export function describeCompletedSwitch(result: TermSwitch): string {
    return `Switched to ${result.weeks} weeks. Your access runs until ${formatTermDate(result.accessUntil)}.`
}
