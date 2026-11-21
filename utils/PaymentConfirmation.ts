import type { CoinTransaction } from '../api/_generated/skyApi.schemas'
import type { PlaySubscriptionSlug } from './PlaySubscriptions'

// Whether a purchase the buyer just returned from (subscription, slot or CoflCoins top-up) is confirmed. Payments credits every
// confirmed payment as a CoflCoins top-up transaction (a subscription period is credited and spent on the plan in the same
// database transaction), so a new payment credit means the premium state or the balance already reflects the purchase.

/** the success page's url parameter with the server time (ms) the buyer returned from the payment provider; it survives a reload */
export const RETURNED_AT_PARAM = 'returnedAt'

/**
 * How long before the return a credit still counts. Only a webhook that beats the redirect needs it: Stripe and Lemon Squeezy
 * book the payment within seconds of it, and the buyer comes back right after. Two minutes cover that (plus a short stay on the
 * provider's confirmation page) while a payment of a separate, earlier checkout rarely falls into it.
 */
export const RECENT_CREDIT_MS = 2 * 60 * 1000

/** after this long without a confirmation the page explains that some payment methods take longer */
export const SLOW_CONFIRMATION_MS = 60 * 1000

/**
 * The provider products a payment is credited with: Stripe `s_`, PayPal `p_`, Lemon Squeezy and subscription plans `l_`, CoinGate
 * `c_`, Google Play `ps_`. Other credits (refunds, ad, advent and referral rewards, transfers) are `custom` products without one.
 */
const PAYMENT_PRODUCT = /^(s|p|l|c|ps)_/

/** what the return url tells about the purchase; only PayPal appends ids (Stripe, Lemon Squeezy and CoinGate return to the bare url) */
export type PurchaseReturn = 'paypalSubscription' | 'paypalOrder' | 'unknown'

/** PayPal appends `subscription_id` (with `ba_token` and `token`) to a subscription's return url, an order's id as `token` */
export function getPurchaseReturn(search: string): PurchaseReturn {
    const params = new URLSearchParams(search)
    // ba_token (a billing agreement) only comes with a subscription, also should PayPal ever leave out subscription_id
    if (params.get('subscription_id')?.trim() || params.get('ba_token')?.trim()) return 'paypalSubscription'
    if (params.get('token')?.trim()) return 'paypalOrder'
    return 'unknown'
}

/** the PayPal id of the purchase from the return url's query, for the buyer to quote to support; null without one */
export function getPurchaseReference(search: string): string | null {
    const params = new URLSearchParams(search)
    const reference = ['subscription_id', 'token'].map(name => params.get(name)?.trim()).find(value => !!value)
    return reference || null
}

/** the server's time of a response from its `Date` header, the device's `deviceNow` without a readable one */
export function getServerNow(dateHeader: string | null | undefined, deviceNow: number): number {
    const serverNow = dateHeader ? new Date(dateHeader).getTime() : NaN
    return Number.isNaN(serverNow) ? deviceNow : serverNow
}

/**
 * The server time of the return: the url's (a reload), otherwise the device's page load (`loadedAt`) moved onto the server clock
 * by the offset of a response the server sent at `serverNow` and the device received at `deviceNow`. Never after `serverNow`.
 */
export function getServerReturnedAt(urlValue: string | null | undefined, loadedAt: number, serverNow: number, deviceNow: number): number {
    const fromUrl = Number(urlValue)
    if (urlValue && Number.isSafeInteger(fromUrl) && fromUrl > 0) return Math.min(fromUrl, serverNow)
    return Math.min(loadedAt + serverNow - deviceNow, serverNow)
}

/** a server timestamp in ms; timestamps without a zone are UTC */
export function parseServerTime(value: string | null | undefined): number {
    if (!value) return NaN
    const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(value)
    return new Date(zoned ? value : `${value}Z`).getTime()
}

function isPaymentCredit(transaction: CoinTransaction): boolean {
    return transaction.amount > 0 && PAYMENT_PRODUCT.test(transaction.productId ?? '')
}

/** a PayPal return can only be confirmed by a PayPal credit: a subscription's grant (`paypal-sale-…`), an order's `p_` product */
function fitsReturn(credit: CoinTransaction, purchase: PurchaseReturn): boolean {
    if (purchase === 'paypalSubscription') return credit.reference?.startsWith('paypal-sale-') === true
    if (purchase === 'paypalOrder') return credit.productId?.startsWith('p_') === true
    return true
}

function getTransactionKey(transaction: CoinTransaction): string {
    return `${transaction.reference ?? ''}|${transaction.timeStamp}|${transaction.amount}`
}

/** the keys of the payment credits the first lookup found, so later lookups recognise a new one whatever any clock says */
export function getCreditKeys(transactions: CoinTransaction[]): string[] {
    return transactions.filter(isPaymentCredit).map(getTransactionKey)
}

export interface PurchaseLookup {
    /** the server time of the return */
    returnedAt: number
    /** the credit keys of the first lookup, null on the first lookup itself */
    baseline: string[] | null
    purchase: PurchaseReturn
    playSubscription?: PlaySubscriptionSlug
}

/**
 * Whether a payment credit confirms the purchase. The first lookup looks for one booked since shortly before the return; later
 * lookups for one that is not among the credits of the first. A PayPal return only accepts a PayPal credit.
 */
export function isPurchaseConfirmed(transactions: CoinTransaction[], lookup: PurchaseLookup): boolean {
    return transactions.filter(isPaymentCredit).some(credit => fitsPurchase(credit, lookup) && isNewCredit(credit, lookup))
}

function fitsPurchase(credit: CoinTransaction, lookup: PurchaseLookup): boolean {
    if (lookup.playSubscription) {
        return credit.productId === lookup.playSubscription && credit.reference?.startsWith('googleplay-order-') === true
    }
    return fitsReturn(credit, lookup.purchase)
}

function isNewCredit(credit: CoinTransaction, { returnedAt, baseline }: PurchaseLookup): boolean {
    if (baseline !== null) return !baseline.includes(getTransactionKey(credit))
    return parseServerTime(credit.timeStamp) >= returnedAt - RECENT_CREDIT_MS
}

/** how long to wait before the next lookup, `elapsedMs` after the page loaded: often while most payments confirm, then less often */
export function getPollDelay(elapsedMs: number): number {
    if (elapsedMs < SLOW_CONFIRMATION_MS) return 3_000
    if (elapsedMs < 5 * 60 * 1000) return 10_000
    return 30_000
}
