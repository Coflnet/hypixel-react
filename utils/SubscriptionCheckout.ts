import type { AutoDiscount, PostApiPremiumSubscriptionSubscriptionSlugParams, SubscriptionProviderOption } from '../api/_generated/skyApi.schemas'
import { Duration } from '../components/Premium/PremiumPurchaseWizard/types'
import { VAT_RATES } from './PricingUtils'

// Payment providers and period-aware discounts of new subscriptions (Stripe, PayPal, Lemon Squeezy).

export type PaymentProvider = 'stripe' | 'paypal' | 'lemonsqueezy'

/** providers billed by us directly; only these honour our own discount codes (Lemon Squeezy rejects them) */
export const DIRECT_PROVIDERS: PaymentProvider[] = ['stripe', 'paypal']

const WEEK_SECONDS = 7 * 24 * 3600

/** the direct providers offered for a checkout, card (Stripe) first; empty keeps the single Lemon Squeezy checkout */
export function getDirectProviders(options: SubscriptionProviderOption[] | null | undefined): PaymentProvider[] {
    if (!Array.isArray(options)) return []
    const offered = new Set(options.map(option => option.provider?.toLowerCase()))
    return DIRECT_PROVIDERS.filter(provider => offered.has(provider))
}

/** the length of a subscription's billing period in weeks: 4, 13 or 52 */
export function getBillingWeeks(duration: Duration | null | undefined): number {
    if (duration === Duration.YEARLY) return 52
    if (duration === Duration.QUARTER) return 13
    return 4
}

/** a slot subscription's billing period in weeks (its ownership time per payment) */
export function getWeeksOfSeconds(seconds: number | null | undefined): number {
    return Math.max(1, Math.round((seconds || 0) / WEEK_SECONDS))
}

interface PeriodDiscount {
    amount: number
    amountType?: string | null
    periodAmounts?: Record<string, number> | null
}

export function isPercentDiscount(discount: PeriodDiscount | null | undefined): boolean {
    return discount?.amountType === 'percent' || discount?.amountType === 'percentage'
}

/** the code states its own amount per billing period instead of relying on its name (legacy "yearly" codes) */
export function hasPeriodAmounts(discount: PeriodDiscount | null | undefined): boolean {
    return !!discount?.periodAmounts && Object.keys(discount.periodAmounts).length > 0
}

/** the percent a discount takes off a billing period of `weeks`, 0 for fixed amounts or a period it does not cover */
export function getPeriodPercent(discount: PeriodDiscount | null | undefined, weeks: number): number {
    if (!discount || !isPercentDiscount(discount)) return 0
    const amount = discount.periodAmounts?.[String(weeks)] ?? discount.amount
    return amount > 0 ? amount : 0
}

/** a price after a percent discount, rounded up to the next cent; only for Lemon Squeezy, direct providers use getDirectPrice */
export function applyPercent(price: number, percent: number): number {
    if (!percent) return price
    return Math.ceil(Math.round(price * (1 - percent / 100) * 1e6) / 1e4) / 100
}

/** n / d rounded to the nearest integer, a tie going to the even one (.NET Math.Round default); n and d are positive integers */
export function divideHalfEven(n: number, d: number): number {
    const quotient = Math.floor(n / d)
    const remainder = n - quotient * d
    if (remainder * 2 !== d) return remainder * 2 > d ? quotient + 1 : quotient
    return quotient % 2 === 0 ? quotient : quotient + 1
}

/** n / d rounded to the nearest integer, a tie going up (away from zero for positive values) */
export function divideHalfAway(n: number, d: number): number {
    return Math.floor((2 * n + d) / (2 * d))
}

/** the countries our direct checkouts charge VAT for: EU-27 and the UK, whose rates the payment backend shares with VAT_RATES */
const DIRECT_VAT_COUNTRIES = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'
])

/** whether a direct checkout's charge is known exactly: VAT of the EU/UK is in the table, in the US nothing is added; elsewhere Stripe adds the tax */
export function hasExactTax(countryCode?: string | null): boolean {
    if (!countryCode) return false
    const code = countryCode.toUpperCase()
    return code === 'US' || DIRECT_VAT_COUNTRIES.has(code)
}

/** whether the page can show the exact charge: a direct provider bills the buyer's country */
export function isExactCharge(providers: PaymentProvider[], countryCode?: string | null): boolean {
    return providers.length > 0 && hasExactTax(countryCode)
}

function getVatBasisPoints(countryCode?: string | null): number {
    if (!countryCode) return 0
    return Math.round((VAT_RATES[countryCode.toUpperCase()] ?? 0) * 10000)
}

/**
 * The cents a direct (Stripe/PayPal) checkout charges, like the payment backend: the plan price (already after a creator code)
 * minus the discount code percent rounded half to even, then the buyer country's VAT added and rounded half away from zero.
 * Only for countries hasExactTax: the US gets no VAT added.
 */
export function getDirectCents(planPrice: number, percent: number, countryCode?: string | null): number {
    const cents = Math.round(planPrice * 100)
    const keep = Math.round((100 - (percent || 0)) * 100)
    const net = divideHalfEven(cents * keep, 10000)
    return divideHalfAway(net * (10000 + getVatBasisPoints(countryCode)), 10000)
}

/** the price a direct checkout charges in euros, see getDirectCents */
export function getDirectPrice(planPrice: number, percent: number, countryCode?: string | null): number {
    return getDirectCents(planPrice, percent, countryCode) / 100
}

/** whether a price still says "(+VAT)": not once tax is in it (an estimate for a known country, exact when `exact`) or the US adds none */
export function showsVatSuffix(countryCode: string | null | undefined, exact: boolean): boolean {
    if (exact) return false
    if (!countryCode) return true
    const code = countryCode.toUpperCase()
    return code === 'US' || VAT_RATES[code] === undefined
}

/** said after a price while the buyer's country is unknown: the price is before tax and nothing can be charged yet */
export const UNKNOWN_COUNTRY_VAT_NOTE = 'plus VAT where applicable'

/** the tax note after a price: none once tax is in it, "(+VAT)" where checkout adds it, an open note while the country is unknown */
export function getVatNote(countryCode: string | null | undefined, exact: boolean): string {
    if (!countryCode) return UNKNOWN_COUNTRY_VAT_NOTE
    return showsVatSuffix(countryCode, exact) ? '(+VAT)' : ''
}

/**
 * The tax line of a subscription price: "Includes VAT" only when the page shows the exact charge of a direct checkout
 * (see isExactCharge), an estimate's wording otherwise, and an open note while the buyer's country is unknown.
 */
export function getTaxLabel(countryCode: string | null | undefined, exact: boolean): string {
    if (!countryCode) return 'Plus VAT where applicable'
    const hasVat = getVatBasisPoints(countryCode) > 0 && countryCode.toUpperCase() !== 'US'
    if (exact) return hasVat ? 'Includes VAT' : 'No tax added'
    return hasVat ? 'Includes estimated tax' : 'Tax calculated at checkout'
}

/** a billing period of `weeks`, e.g. "every 4 weeks" */
export function getEveryPeriodLabel(weeks: number): string {
    return `every ${weeks} weeks`
}

/** the unit of a price for `weeks`, e.g. "per 4 weeks"; subscriptions bill in weeks, never calendar months */
export function getPerPeriodLabel(weeks: number): string {
    return `per ${weeks} weeks`
}

/** what a period of `weeks` costs per 4 weeks, e.g. €96.69 for 52 weeks is €7.44 per 4 weeks */
export function getPerFourWeeks(total: number, weeks: number): number {
    return (total * 4) / weeks
}

/** whole percent a longer billing period saves against paying every 4 weeks for as long, rounded down so it never overstates */
export function getSavingsPercent(fourWeekPrice: number, periodPrice: number, weeks: number): number {
    if (fourWeekPrice <= 0 || weeks <= 4) return 0
    const savings = 1 - periodPrice / ((fourWeekPrice * weeks) / 4)
    return Math.max(0, Math.floor(savings * 100))
}

/** the promotion when the checkout uses at least one provider it is valid for, otherwise null */
export function getPromotionFor(promotion: AutoDiscount | null | undefined, providers: PaymentProvider[]): AutoDiscount | null {
    if (!promotion?.code || providers.length === 0) return null
    if (!promotion.providers?.length) return promotion
    const valid = promotion.providers.map(provider => provider.toLowerCase())
    return providers.some(provider => valid.includes(provider)) ? promotion : null
}

/** the discount code sent to `provider`'s checkout; the promotion's code only goes to the providers it is valid for */
export function getDiscountCodeFor(code: string | null | undefined, promotion: AutoDiscount | null | undefined, provider: PaymentProvider): string | undefined {
    if (!code) return undefined
    if (code !== promotion?.code || !promotion.providers?.length) return code
    return promotion.providers.some(valid => valid.toLowerCase() === provider) ? code : undefined
}

interface CheckoutRequest {
    provider: PaymentProvider
    country?: string
    creatorCode?: string | null
    discountCode?: string | null
    promotion?: AutoDiscount | null
    /** a slot subscription returns to the slot assignment after payment */
    assignSlots?: boolean
}

/** query of POST /api/premium/subscription/{slug}; the Lemon Squeezy request stays as before, without provider and country */
export function getCheckoutParams(request: CheckoutRequest): PostApiPremiumSubscriptionSubscriptionSlugParams {
    const params: PostApiPremiumSubscriptionSubscriptionSlugParams = {
        assignSlots: request.assignSlots || undefined,
        creatorCode: request.creatorCode || undefined,
        discountcode: getDiscountCodeFor(request.discountCode, request.promotion, request.provider)
    }
    if (request.provider === 'lemonsqueezy') return params
    return { ...params, provider: request.provider, country: request.country || undefined }
}

/** the checkout url of a subscription purchase response (`dirctLink` is the deprecated spelling) */
export function getCheckoutLink(data: { directLink?: string | null; dirctLink?: string | null } | null | undefined): string | null {
    return data?.directLink || data?.dirctLink || null
}

/** whether a promotion still runs at `now`; one without an end date runs until the server stops returning it */
export function isPromotionRunning(promotion: AutoDiscount | null | undefined, now: Date = new Date()): boolean {
    if (!promotion?.code) return false
    if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now.getTime()) return false
    return !promotion.expiresAt || new Date(promotion.expiresAt).getTime() > now.getTime()
}

/** the next time (ms) after `now` at which the promotion starts or ends, null when nothing changes any more */
export function getNextPromotionChange(promotion: AutoDiscount | null | undefined, now: Date): number | null {
    if (!promotion?.code) return null
    const times = [promotion.startsAt, promotion.expiresAt]
        .map(time => (time ? new Date(time).getTime() : NaN))
        .filter(time => !Number.isNaN(time) && time > now.getTime())
    return times.length > 0 ? Math.min(...times) : null
}

/**
 * The provider a typed discount code is checked for: the first direct one (Stripe and PayPal honour the same local codes),
 * Lemon Squeezy when the checkout falls back to it (it rejects local codes), undefined while the providers are not known yet.
 */
export function getCodeProvider(providers: PaymentProvider[], pending: boolean): PaymentProvider | undefined {
    if (providers.length > 0) return providers[0]
    return pending ? undefined : 'lemonsqueezy'
}

/** whether the code applies to the first payment only (duration "once") instead of every renewal */
export function isFirstPaymentOnly(discount: { duration?: string | null } | null | undefined): boolean {
    return discount?.duration === 'once'
}

/** "first 4 weeks", "first 13 weeks" or "first year" */
export function getFirstPeriodLabel(weeks: number): string {
    return weeks === 52 ? 'first year' : `first ${weeks} weeks`
}

function isMidnight(date: Date, timeZone?: string): boolean {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(date)
    return parts.filter(part => part.type !== 'literal').every(part => Number(part.value) === 0)
}

function formatDay(date: Date, timeZone?: string): string {
    return date.toLocaleDateString('en-US', { timeZone, month: 'long', day: 'numeric' })
}

/**
 * When the promotion ends, in the viewer's time zone (`timeZone` overrides it, e.g. in tests):
 * "Offer runs through November 30." for an end at local midnight, otherwise the date and time,
 * e.g. "Offer ends December 1, 12:59 AM GMT+1."; null without a valid end.
 */
export function describePromotionEnd(expiresAt: string | null | undefined, timeZone?: string): string | null {
    if (!expiresAt) return null
    const date = new Date(expiresAt)
    if (Number.isNaN(date.getTime())) return null
    if (isMidnight(date, timeZone)) return `Offer runs through ${formatDay(new Date(date.getTime() - 1), timeZone)}.`
    const time = date.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    return `Offer ends ${formatDay(date, timeZone)}, ${time}.`
}

/** a fixed discount amount, given in cents like the payment backend stores it, e.g. "€5.00 off" */
export function describeFixedAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)} off`
}

function describeAmount(promotion: AutoDiscount, weeks?: number): string {
    if (!isPercentDiscount(promotion)) return describeFixedAmount(promotion.amount)
    if (weeks !== undefined) return `${getPeriodPercent(promotion, weeks)}% off`
    const amounts = [promotion.amount, ...Object.values(promotion.periodAmounts ?? {})]
    return `up to ${Math.max(...amounts)}% off`
}

function describeScope(promotion: AutoDiscount, weeks?: number): string {
    if (!isFirstPaymentOnly(promotion)) return 'every payment'
    return weeks === undefined ? 'your first payment' : `your first payment (the ${getFirstPeriodLabel(weeks)})`
}

/**
 * The promotion's terms, e.g. "Black Friday: 50% off your first payment (the first year). Offer ends November 30, 11:59 PM UTC."
 * The end date is when the offer stops, not the discount: an "every payment" discount keeps applying to renewals after it.
 * Without `weeks` (no billing period chosen yet) the best amount is named. `timeZone` overrides the viewer's (tests).
 */
export function describePromotion(promotion: AutoDiscount, weeks?: number, timeZone?: string): string {
    const end = describePromotionEnd(promotion.expiresAt, timeZone)
    const name = promotion.name || 'Sale'
    return `${name}: ${describeAmount(promotion, weeks)} ${describeScope(promotion, weeks)}.${end ? ` ${end}` : ''}`
}
