import type {
    AutoDiscount,
    LegalDeclaration,
    PostApiPremiumSubscriptionSubscriptionSlugParams,
    PurchaseableProduct,
    SubscriptionDeclarationArgs,
    SubscriptionProviderOption
} from '../api/_generated/skyApi.schemas'
import { Duration, PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'
import { VAT_RATES, getTierApiProductId } from './PricingUtils'

// Payment providers and period-aware discounts of new subscriptions (Stripe, PayPal, Lemon Squeezy).

export type PaymentProvider = 'stripe' | 'paypal' | 'lemonsqueezy'

/** providers billed by us directly; only these honour our own discount codes (Lemon Squeezy rejects them) */
export const DIRECT_PROVIDERS: PaymentProvider[] = ['stripe', 'paypal']

const WEEK_SECONDS = 7 * 24 * 3600

/** how a direct provider bills: `direct` sells in the buyer's country with our VAT, `managed` (Stripe Managed Payments) adds the tax itself */
export type ProviderMode = 'direct' | 'managed'

/**
 * The mode of the offered Stripe/PayPal providers, null while none is offered. The backend gives every provider of a country the
 * same mode; `managed` only when no direct one is among them, a missing mode counts as direct.
 */
export function getProviderMode(options: SubscriptionProviderOption[] | null | undefined): ProviderMode | null {
    if (!Array.isArray(options)) return null
    const modes = options.filter(option => DIRECT_PROVIDERS.includes(option.provider?.toLowerCase() as PaymentProvider)).map(option => option.mode?.toLowerCase())
    if (modes.length === 0) return null
    return modes.includes('managed') && !modes.includes('direct') && !modes.includes(undefined) ? 'managed' : 'direct'
}

/** the direct providers offered for a checkout, card (Stripe) first */
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

/** whether the page can show the exact charge: a direct (not managed) provider bills the buyer's country, as its mode says */
export function isExactCharge(providers: PaymentProvider[], countryCode?: string | null, mode: ProviderMode | null = 'direct'): boolean {
    return providers.length > 0 && mode === 'direct' && !!countryCode
}

/** whether Stripe Managed Payments bills it: the page shows the net price, Stripe adds the tax at checkout */
export function isNetCharge(providers: PaymentProvider[], mode: ProviderMode | null): boolean {
    return providers.length > 0 && mode === 'managed'
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
export function getDirectCents(planPrice: number, percent: number, countryCode?: string | null, fixedCents = 0): number {
    const cents = Math.round(planPrice * 100)
    const keep = Math.round((100 - (percent || 0)) * 100)
    const net = Math.max(0, divideHalfEven(cents * keep, 10000) - Math.round(fixedCents || 0))
    return divideHalfAway(net * (10000 + getVatBasisPoints(countryCode)), 10000)
}

/** the price a direct checkout charges in euros, see getDirectCents */
export function getDirectPrice(planPrice: number, percent: number, countryCode?: string | null, fixedCents = 0): number {
    return getDirectCents(planPrice, percent, countryCode, fixedCents) / 100
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
export function getVatNote(countryCode: string | null | undefined, exact: boolean, net = false): string {
    if (net) return '(+tax)'
    if (!countryCode) return UNKNOWN_COUNTRY_VAT_NOTE
    return showsVatSuffix(countryCode, exact) ? '(+VAT)' : ''
}

/**
 * The tax line of a subscription price: "Includes VAT" only when the page shows the exact charge of a direct checkout
 * (see isExactCharge), an estimate's wording otherwise, and an open note while the buyer's country is unknown.
 */
export function getTaxLabel(countryCode: string | null | undefined, exact: boolean, net = false): string {
    if (net) return 'Tax is added at checkout'
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

/**
 * The early start declaration sent with a subscription checkout, like the prepaid purchase's: the buyer confirmed the shown
 * declaration (its version and locale), `requestId` is the GUID of this checkout attempt. Unconfirmed, it requests nothing.
 */
export function getSubscriptionDeclaration(declaration: LegalDeclaration | undefined, confirmed: boolean, requestId: string): SubscriptionDeclarationArgs {
    const requested = confirmed && !!declaration
    return {
        immediatePerformanceRequested: requested,
        withdrawalConsequenceAcknowledged: requested,
        declarationVersion: requested ? declaration!.version : null,
        legalLocale: declaration?.locale === 'de' ? 'de' : 'en',
        declarationRequestId: requestId
    }
}

/** the errors a subscription checkout answers when its declaration is missing or not the current one */
export type DeclarationErrorSlug = 'service_performance_declaration_required' | 'invalid_service_performance_declaration'

const DECLARATION_ERROR_MESSAGES: Record<DeclarationErrorSlug, string> = {
    service_performance_declaration_required:
        'Please tick the early start declaration, then choose the payment method again. Without it the subscription cannot start.',
    invalid_service_performance_declaration:
        'The early start declaration has changed or could not be verified. Please read it again, confirm it and choose the payment method again.'
}

const CHECKOUT_FAILED_MESSAGE = 'Failed to redirect to payment provider. Please try again.'

function readSlug(data: unknown): string {
    if (typeof data === 'string') return data
    if (!data || typeof data !== 'object') return ''
    const { slug, message } = data as { slug?: unknown; message?: unknown }
    return [slug, message].filter(value => typeof value === 'string').join(' ')
}

/** whether an error response names `slug` (as its slug or inside its message) */
export function hasErrorSlug(data: unknown, slug: string): boolean {
    return readSlug(data).includes(slug)
}

/** the declaration error of a failed checkout response (its slug, or the slug in its message), null for other errors */
export function getDeclarationErrorSlug(data: unknown): DeclarationErrorSlug | null {
    const text = readSlug(data)
    const slugs = Object.keys(DECLARATION_ERROR_MESSAGES) as DeclarationErrorSlug[]
    return slugs.find(slug => text.includes(slug)) ?? null
}

export function getCheckoutErrorMessage(data: unknown, fallbackMessage = CHECKOUT_FAILED_MESSAGE): string {
    if (hasErrorSlug(data, 'active_play_subscription') || readSlug(data).includes('Cancel your Google Play subscription before subscribing here.')) {
        return 'You already subscribe through Google Play. Manage your subscription in Google Play.'
    }
    const slug = getDeclarationErrorSlug(data)
    return slug ? DECLARATION_ERROR_MESSAGES[slug] : fallbackMessage
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
 * Lemon Squeezy when no direct providers are offered (it rejects local codes), undefined while the providers are not known yet.
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

/** the billing period 13 and 52 week subscriptions of Stripe and PayPal continue with after their first term */
export const RENEWAL_WEEKS = 4

/** said wherever a direct subscription's renewal is described */
export const CANCEL_ANYTIME = 'Cancel anytime'

/** whether a direct subscription of `weeks` continues at the 4-week price after its first term (4-week plans simply repeat) */
export function hasRenewalTerm(weeks: number): boolean {
    return weeks > RENEWAL_WEEKS
}

type RenewalDiscount = (PeriodDiscount & { duration?: string | null }) | null | undefined

/** the percent the renewal gets off the 4-week price: the code's 4-week percent, none for a code that covers the first payment only */
export function getRenewalPercent(discount: RenewalDiscount): number {
    if (isFirstPaymentOnly(discount)) return 0
    return getPeriodPercent(discount, RENEWAL_WEEKS)
}

/** the cents a fixed amount code takes off every renewal (its 4-week amount, as the backend states fixed amounts in cents); 0 for percent codes */
export function getRenewalFixedCents(discount: RenewalDiscount): number {
    if (!discount || isPercentDiscount(discount) || isFirstPaymentOnly(discount)) return 0
    const amount = discount.periodAmounts?.[String(RENEWAL_WEEKS)] ?? discount.amount
    return amount > 0 ? amount : 0
}

/**
 * What the renewal charges in euros, like the payment backend: the 4-week plan's price of the same tier (and slots), after the
 * creator code, minus the renewal percent (or fixed amount), plus the buyer country's VAT (see getDirectCents; pass no country for
 * Managed Payments, which shows the net price). Null without a usable 4-week price.
 */
export function getRenewalPrice(fourWeekPlanPrice: number | null | undefined, discount: RenewalDiscount, countryCode?: string | null): number | null {
    if (fourWeekPlanPrice === null || fourWeekPlanPrice === undefined) return null
    if (!Number.isFinite(fourWeekPlanPrice) || fourWeekPlanPrice <= 0) return null
    return getDirectPrice(fourWeekPlanPrice, getRenewalPercent(discount), countryCode, getRenewalFixedCents(discount))
}

/**
 * Where a direct subscription goes after its first `weeks`, e.g. "then €9.69 every 4 weeks after the first 52 weeks, until cancelled";
 * a code for the first payment only reads "then €9.69 every 4 weeks" after "€48.34 for the first 52 weeks". Without a `renewal`
 * price (no 4-week plan to take it from) the price is left out rather than guessed.
 */
export function describeRenewal(weeks: number, renewal: string | null, firstPaymentOnly: boolean): string {
    const price = renewal ? `${renewal} ` : ''
    if (firstPaymentOnly) return `then ${price}every ${RENEWAL_WEEKS} weeks`
    return `then ${price}every ${RENEWAL_WEEKS} weeks after the first ${weeks} weeks, until cancelled`
}

/**
 * Whether a checkout's wording is the card/PayPal one: until the offer resolves (loading, unknown country, server-rendered page) the
 * wording is theirs too; only an offer that settled on Lemon Squeezy alone keeps Lemon Squeezy's "renews every N weeks".
 */
export function isFourWeekContinuation(offer: { loading: boolean; providers: PaymentProvider[] }): boolean {
    return offer.loading || offer.providers.length > 0
}

/** the summary's billing line: a direct 13/52 week plan continues every 4 weeks, Lemon Squeezy and 4-week plans renew as before */
export function getBillingLabel(weeks: number, direct: boolean): string {
    if (!direct || !hasRenewalTerm(weeks)) return `Renews ${getEveryPeriodLabel(weeks)}`
    return `${weeks} weeks, then every ${RENEWAL_WEEKS} weeks until cancelled`
}

/** the product slug of a tier's 4-week plan (every tier has one, Starter's is l_starter_premium) */
export function getFourWeekProductSlug(tier: PremiumTier): string {
    return getTierApiProductId(tier, Duration.MONTHLY)
}

/** the backend's range of ownership seconds for a 4-week plan (e.g. 2419200 for Premium, 2430000 for Starter) */
const FOUR_WEEKS_MIN_SECONDS = 2332800
const FOUR_WEEKS_MAX_SECONDS = 2678400

export function isFourWeekSeconds(seconds: number | null | undefined): boolean {
    return (seconds ?? 0) >= FOUR_WEEKS_MIN_SECONDS && (seconds ?? 0) <= FOUR_WEEKS_MAX_SECONDS
}

/** the 4-week subscription of a slot bundle: same slot tier and slot count, 4 billing weeks; undefined when the catalog has none */
export function findFourWeekSlotProduct(products: PurchaseableProduct[], product: PurchaseableProduct): PurchaseableProduct | undefined {
    return products.find(
        other =>
            other.slug?.startsWith('l_') === true &&
            other.slotTier === product.slotTier &&
            other.slotCount === product.slotCount &&
            isFourWeekSeconds(other.ownershipSeconds)
    )
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
    const end = getPromotionEnd(expiresAt, timeZone)
    if (!end) return null
    return end.endOfDay ? `Offer runs through ${end.text}.` : `Offer ends ${end.text}.`
}

/**
 * When the promotion ends, in the viewer's time zone: the last day ("November 30") for an end at local midnight, otherwise the
 * date and time ("December 1, 12:59 AM GMT+1"); null without a valid end.
 */
export function formatPromotionEnd(expiresAt: string | null | undefined, timeZone?: string): string | null {
    return getPromotionEnd(expiresAt, timeZone)?.text ?? null
}

function getPromotionEnd(expiresAt: string | null | undefined, timeZone?: string): { text: string; endOfDay: boolean } | null {
    if (!expiresAt) return null
    const date = new Date(expiresAt)
    if (Number.isNaN(date.getTime())) return null
    if (isMidnight(date, timeZone)) return { text: formatDay(new Date(date.getTime() - 1), timeZone), endOfDay: true }
    // ICU versions differ in the space before AM/PM (U+202F or U+0020): one spelling, so the server and the browser render the same text
    const time = date.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).replace(/\s/g, ' ')
    return { text: `${formatDay(date, timeZone)}, ${time}`, endOfDay: false }
}

/** a fixed discount amount, given in cents like the payment backend stores it, e.g. "€5.00 off" */
export function describeFixedAmount(cents: number): string {
    return `€${(cents / 100).toFixed(2)} off`
}

/** the highest percent a percent promotion takes off any billing period, e.g. 50 for 25/40/50; 0 for fixed amounts */
export function getMaxPercent(promotion: PeriodDiscount | null | undefined): number {
    if (!promotion || !isPercentDiscount(promotion)) return 0
    return Math.max(0, promotion.amount, ...Object.values(promotion.periodAmounts ?? {}))
}

/** the best a promotion offers before a billing period is chosen, e.g. "up to 50% off" or "€5.00 off" */
export function describeBestAmount(promotion: AutoDiscount): string {
    if (!isPercentDiscount(promotion)) return describeFixedAmount(promotion.amount)
    return `up to ${getMaxPercent(promotion)}% off`
}

function describeAmount(promotion: AutoDiscount, weeks?: number): string {
    if (weeks === undefined) return describeBestAmount(promotion)
    if (!isPercentDiscount(promotion)) return describeFixedAmount(promotion.amount)
    return `${getPeriodPercent(promotion, weeks)}% off`
}

/** what a promotion's discount covers: "your first payment" (with its term when `weeks` is given) or "every payment" */
export function describePromotionScope(promotion: AutoDiscount, weeks?: number): string {
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
    return `${name}: ${describeAmount(promotion, weeks)} ${describePromotionScope(promotion, weeks)}.${end ? ` ${end}` : ''}`
}

interface UpgradeCodeOffer {
    /** the other tier's plan price for the selected period, before tax and after the creator code; null while unknown */
    planPrice: number | null
    code: string | null | undefined
    discount: (PeriodDiscount & { duration?: string | null; isLimitedToProducts?: boolean }) | null | undefined
    weeks: number
    providers: PaymentProvider[]
    mode: ProviderMode | null
    countryCode?: string | null
    promotion?: AutoDiscount | null
    /** formats an amount in the currency of the quote */
    money(amount: number): string
}

/**
 * What a validated discount code saves on another tier (the "What you could get" upsell), e.g.
 * "With TEST90: €35.40 for the first 52 weeks instead of €354.20 (you save €318.80)". Null (the line stays hidden) unless the
 * saving is certain: a code limited to certain products (which ones is not known here), a fixed amount or a period the code
 * does not cover, a provider that does not honour it, Lemon Squeezy alone, or a charge that is not known exactly.
 * Prices are the checkout's: with VAT for direct providers, net with "(+tax)" for Managed Payments.
 */
export function describeUpgradeCodeSavings(offer: UpgradeCodeOffer): string | null {
    const { planPrice, code, discount, weeks, providers, mode, promotion } = offer
    if (!code || !discount || discount.isLimitedToProducts) return null
    if (planPrice === null || !Number.isFinite(planPrice) || planPrice <= 0) return null
    if (!providers.every(provider => getDiscountCodeFor(code, promotion, provider))) return null
    const net = isNetCharge(providers, mode)
    if (!net && !isExactCharge(providers, offer.countryCode, mode)) return null
    const percent = getPeriodPercent(discount, weeks)
    const country = net ? undefined : offer.countryCode
    const original = getDirectPrice(planPrice, 0, country)
    const discounted = getDirectPrice(planPrice, percent, country)
    if (percent <= 0 || discounted >= original) return null
    return formatUpgradeSavings({ code, discounted, original, weeks, net, firstOnly: isFirstPaymentOnly(discount), money: offer.money })
}

interface UpgradeSavingsText {
    code: string
    /** the charge after the code and before it, as the checkout shows them */
    discounted: number
    original: number
    weeks: number
    /** Managed Payments: net prices, "(+tax)" follows the discounted one */
    net: boolean
    firstOnly: boolean
    money(amount: number): string
}

/** the sentence of describeUpgradeCodeSavings for prices that are already known, e.g. a slot bundle's catalog prices */
export function formatUpgradeSavings({ code, discounted, original, weeks, net, firstOnly, money }: UpgradeSavingsText): string {
    const tax = net ? ` ${getVatNote(undefined, true, true)}` : ''
    // a 13/52 week plan continues every 4 weeks at the 4-week price, so the code only covers its first term
    const period = firstOnly || hasRenewalTerm(weeks) ? `for the first ${weeks} weeks` : getPerPeriodLabel(weeks)
    const saved = Math.round((original - discounted) * 100) / 100
    return `With ${code}: ${money(discounted)}${tax} ${period} instead of ${money(original)} (you save ${money(saved)})`
}

/** whether every provider of the checkout honours the promotion, so it can stand in for another code on any of them */
export function isHonouredByAll(promotion: AutoDiscount, providers: PaymentProvider[]): boolean {
    if (providers.length === 0) return false
    if (!promotion.providers?.length) return true
    const valid = promotion.providers.map(provider => provider.toLowerCase())
    return providers.every(provider => valid.includes(provider))
}

type SavingDiscount = PeriodDiscount | null | undefined

/**
 * The cents a code takes off one payment of `planPrice` (euros, before tax, after the creator code) for a billing period of `weeks`,
 * rounded like the payment backend (see getDirectCents); null while the price is unknown.
 */
export function getPaymentSavingCents(discount: SavingDiscount, planPrice: number | null | undefined, weeks: number): number | null {
    if (!discount || !planPrice || !Number.isFinite(planPrice) || planPrice <= 0) return null
    const cents = Math.round(planPrice * 100)
    if (!isPercentDiscount(discount)) return Math.min(cents, Math.max(0, discount.periodAmounts?.[String(weeks)] ?? discount.amount))
    const keep = Math.round((100 - getPeriodPercent(discount, weeks)) * 100)
    return cents - divideHalfEven(cents * keep, 10000)
}

/** why the promotion applies in place of the code from the link: the code does not cover the period, or the sale saves more on this payment */
export type LinkCodeChoice = 'link' | 'period' | 'saving'

export interface LinkWeighing {
    promotion: AutoDiscount | null
    /** the plan price of this payment, before tax and after the creator code; null while unknown */
    planPrice: number | null
    /** the providers of the checkout: the sale stands in for a code only when every one of them honours it */
    providers: PaymentProvider[]
}

interface LinkCode extends PeriodDiscount {
    code?: string | null
}

/**
 * Which code a checkout opened with a code from the link uses for a period of `weeks`: the link's code, unless every provider honours
 * the promotion and the code does not cover the period (`period`) or the sale saves more on this payment (`saving`). Without a price
 * only two percent codes are compared; the link's code is kept when it is not certain that the sale saves more.
 */
export function weighLinkCode(link: LinkCode, coversPeriod: boolean, weeks: number | undefined, weighing: LinkWeighing): LinkCodeChoice {
    const { promotion, planPrice, providers } = weighing
    if (weeks === undefined || !promotion || !isHonouredByAll(promotion, providers)) return 'link'
    if (getPeriodPercent(promotion, weeks) <= 0 || (link.code ?? '').toUpperCase() === (promotion.code ?? '').toUpperCase()) return 'link'
    if (!coversPeriod) return 'period'
    const sale = getPaymentSavingCents(promotion, planPrice, weeks)
    const code = getPaymentSavingCents(link, planPrice, weeks)
    if (sale !== null && code !== null) return sale > code ? 'saving' : 'link'
    if (!isPercentDiscount(link)) return 'link'
    return getPeriodPercent(promotion, weeks) > getPeriodPercent(link, weeks) ? 'saving' : 'link'
}

/** a code's terms for one billing period, e.g. "30% off your first payment" or "€5.00 off every payment" */
export function describeCodeTerms(discount: PeriodDiscount & { duration?: string | null }, weeks: number): string {
    const amount = isPercentDiscount(discount)
        ? `${getPeriodPercent(discount, weeks)}% off`
        : describeFixedAmount(discount.periodAmounts?.[String(weeks)] ?? discount.amount)
    return `${amount} ${isFirstPaymentOnly(discount) ? 'your first payment' : 'every payment'}`
}
