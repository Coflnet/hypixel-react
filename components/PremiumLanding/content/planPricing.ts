// Prices for the plan cards and the purchase wizard's tier cards.
// Subscriptions bill every 4, 13 or 52 weeks, so prices name their term in weeks, never months. Every headline is a price that is
// actually charged: Starter and Premium+ show their 52-week plan, Premium its 4-week plan.
// The billing (PlanBilling) says how the checkout will charge: `exact` (a direct Stripe/PayPal checkout bills the buyer's country)
// prices like the checkout, the exact charge with no "+ VAT" where none is added (the US); `net` (Stripe Managed Payments) shows net
// prices, Stripe adds the tax; otherwise the tax estimate of the buyer's country (Lemon Squeezy). Until the offer settles
// (loading, server-rendered page) the card/PayPal wording is used, as Lemon Squeezy is only the fallback.
// A running promotion (the checkout offer's automatic discount) is shown only where the charge is known (exact or net): the sale
// price, the struck price without it and a badge with its percent, per billing period.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { getPriceWithVAT, SUBSCRIPTION_PRICES } from '../../../utils/PricingUtils'
import {
    CANCEL_ANYTIME,
    getDirectPrice,
    getPeriodPercent,
    getRenewalPercent,
    getTaxLabel,
    isExactCharge,
    isFirstPaymentOnly,
    isFourWeekContinuation,
    isNetCharge,
    RENEWAL_WEEKS,
    showsVatSuffix,
    UNKNOWN_COUNTRY_VAT_NOTE
} from '../../../utils/SubscriptionCheckout'
import type { AutoDiscount } from '../../../api/_generated/skyApi.schemas'
import type { CheckoutOffer } from '../../../hooks/useCheckoutOffer'

/** a charged price, with the price before the promotion when one applies */
export interface PriceTag {
    /** what is charged, e.g. "€8.65" */
    amount: string
    /** the price without the promotion, shown struck through; null when no promotion lowers it */
    original: string | null
    /** the promotion's percent, e.g. "-25%"; null when no promotion lowers it */
    badge: string | null
}

/** a price with its term, e.g. "€19.77 (€32.95 struck) for the first 13 weeks (-40%)" */
export interface PeriodOffer extends PriceTag {
    /** e.g. "for the first 13 weeks" or "every 4 weeks" */
    period: string
    /** the price covers a first term only, after which the plan continues every 4 weeks at the regular 4-week price */
    firstTermOnly: boolean
}

/** the note under a plan price: text and further prices of the same tier */
export type NotePart = string | PeriodOffer

export interface PlanPrice extends PriceTag {
    /** the term with the tax that is not in the amount, e.g. "for the first 52 weeks", "+ VAT every 4 weeks" */
    unit: string
    note: NotePart[]
}

/** how the plan prices will be charged, see the top of this file */
export interface PlanBilling {
    exact: boolean
    net: boolean
    /** 13 and 52 week plans continue every 4 weeks after their first term (Stripe/PayPal, and until the offer settles) */
    continues: boolean
    /** the offer is known, so renewal prices may be named */
    settled: boolean
}

/** the billing of a plan card before the offer is known: card/PayPal wording, no renewal price, tax unknown */
export const UNSETTLED_BILLING: PlanBilling = { exact: false, net: false, continues: true, settled: false }

/** the billing of the cards for the buyer's `countryCode` from the checkout offer; the previous country's providers do not count while loading */
export function getPlanBilling(offer: Pick<CheckoutOffer, 'loading' | 'providers' | 'mode'>, countryCode?: string): PlanBilling {
    const settled = !offer.loading
    return {
        exact: settled && isExactCharge(offer.providers, countryCode, offer.mode),
        net: settled && isNetCharge(offer.providers, offer.mode),
        continues: isFourWeekContinuation(offer),
        settled
    }
}

type ProductId = 'starter_premium' | 'premium' | 'premium_plus'
type Period = 'monthly' | 'quarterly' | 'yearly'

const PRODUCT_OF: Record<PremiumTier, ProductId> = {
    [PremiumTier.STARTER]: 'starter_premium',
    [PremiumTier.PREMIUM]: 'premium',
    [PremiumTier.PREMIUM_PLUS]: 'premium_plus'
}

const PERIOD_OF_WEEKS: Record<number, Period> = { 4: 'monthly', 13: 'quarterly', 52: 'yearly' }

/** the plan each card's headline shows: Premium's 4-week plan, the 52-week plan of Starter (sold only so) and Premium+ */
const HEADLINE_WEEKS: Record<PremiumTier, number> = {
    [PremiumTier.STARTER]: 52,
    [PremiumTier.PREMIUM]: 4,
    [PremiumTier.PREMIUM_PLUS]: 52
}

function euro(value: number): string {
    return `€${value.toFixed(2)}`
}

/** everything a card's prices depend on */
class PlanPricer {
    constructor(
        private readonly countryCode: string | undefined,
        private readonly billing: PlanBilling,
        private readonly promotion: AutoDiscount | null
    ) {}

    /** the promotion is applied only where the charge is known exactly (direct checkout or Managed Payments) */
    private get activePromotion(): AutoDiscount | null {
        return this.billing.exact || this.billing.net ? this.promotion : null
    }

    /** a before-tax price as the buyer pays it: the exact charge of a direct checkout, the net price of Managed Payments, otherwise the country's tax estimate */
    private charge(price: number, percent: number): number {
        if (this.billing.exact) return getDirectPrice(price, percent, this.countryCode)
        if (this.billing.net) return getDirectPrice(price, percent, undefined)
        return getPriceWithVAT(price, this.countryCode)
    }

    private planPrice(product: ProductId, weeks: number): number {
        return SUBSCRIPTION_PRICES[product][PERIOD_OF_WEEKS[weeks]]
    }

    /** the term of a price: Lemon Squeezy renews the same term; card/PayPal plans run their first term, a 4-week one simply repeats */
    private term(weeks: number, discounted: boolean): Pick<PeriodOffer, 'period' | 'firstTermOnly'> {
        if (!this.billing.continues) return { period: `every ${weeks} weeks`, firstTermOnly: false }
        const firstTermOnly = weeks > RENEWAL_WEEKS || (discounted && isFirstPaymentOnly(this.activePromotion))
        return { period: firstTermOnly ? `for the first ${weeks} weeks` : `every ${weeks} weeks`, firstTermOnly }
    }

    offer(product: ProductId, weeks: number): PeriodOffer {
        const percent = getPeriodPercent(this.activePromotion, weeks)
        const original = this.charge(this.planPrice(product, weeks), 0)
        const amount = this.charge(this.planPrice(product, weeks), percent)
        const discounted = percent > 0 && amount < original
        return {
            amount: euro(amount),
            original: discounted ? euro(original) : null,
            badge: discounted ? `-${percent}%` : null,
            ...this.term(weeks, discounted)
        }
    }

    /** the 4-week price a plan continues with and a trailing space, named only once the offer is settled (it is not guessed before) */
    renewal(product: ProductId): string {
        if (!this.billing.settled) return ''
        return `${euro(this.charge(this.planPrice(product, RENEWAL_WEEKS), getRenewalPercent(this.activePromotion)))} `
    }

    /** the term with the tax that is not in the amount */
    unit(period: string): string {
        if (this.billing.net) return `+ tax ${period}`
        if (!this.countryCode) return `${period}, ${UNKNOWN_COUNTRY_VAT_NOTE}`
        return showsVatSuffix(this.countryCode, this.billing.exact) ? `+ VAT ${period}` : period
    }
}

/** a headline that covers only a first term is followed by what the plan charges after it */
function thenRenewal(headline: PeriodOffer, renewal: string): string[] {
    return headline.firstTermOnly ? [`then ${renewal}every ${RENEWAL_WEEKS} weeks until cancelled. `] : []
}

/** a repeating 4-week plan offered beside a longer headline plan: "every 4 weeks from the start" */
function fromTheStart(offer: PeriodOffer): PeriodOffer {
    return { ...offer, period: `${offer.period} from the start` }
}

/** Stripe and PayPal: the 13 and 52 week plans continue every 4 weeks at the 4-week price after their first term */
function getContinuationNote(tier: PremiumTier, pricer: PlanPricer, headline: PeriodOffer): NotePart[] {
    const product = PRODUCT_OF[tier]
    const renewal = pricer.renewal(product)
    const then = thenRenewal(headline, renewal)
    if (tier === PremiumTier.STARTER) return [...then, CANCEL_ANYTIME]
    if (tier === PremiumTier.PREMIUM) {
        // "until cancelled" is said once: after the headline's first term when it has one, otherwise here
        const after = then.length > 0 ? '.' : ' until cancelled.'
        return [
            ...then,
            'Or ',
            pricer.offer(product, 13),
            ' or ',
            pricer.offer(product, 52),
            `, then ${renewal}every ${RENEWAL_WEEKS} weeks${after} ${CANCEL_ANYTIME}`
        ]
    }
    return getPremiumPlusOptions(pricer, renewal, then)
}

function getPremiumPlusOptions(pricer: PlanPricer, renewal: string, then: string[]): NotePart[] {
    const quarter = pricer.offer('premium_plus', 13)
    const fourWeeks = pricer.offer('premium_plus', RENEWAL_WEEKS)
    const continuation = `then ${renewal}every ${RENEWAL_WEEKS} weeks`
    // without a sale the 4-week plan simply repeats, so the continuation belongs to the 13-week plan alone
    if (!fourWeeks.firstTermOnly) return [...then, 'Or ', quarter, `, ${continuation}, or `, fromTheStart(fourWeeks), `. ${CANCEL_ANYTIME}`]
    return [...then, 'Or ', quarter, ', or ', fourWeeks, `, ${continuation}. ${CANCEL_ANYTIME}`]
}

/** Lemon Squeezy renews for the same term again */
function getRenewsSameTermNote(tier: PremiumTier, pricer: PlanPricer): NotePart[] {
    if (tier === PremiumTier.STARTER) return ['Billed every 52 weeks only, because of payment fees']
    const product = PRODUCT_OF[tier]
    const other = tier === PremiumTier.PREMIUM ? 52 : RENEWAL_WEEKS
    return ['Or ', pricer.offer(product, 13), ', ', pricer.offer(product, other)]
}

/** the card price of `tier`: its headline plan with the promotion, the term and tax, and the tier's other plans in the note */
export function getPlanPrice(
    tier: PremiumTier,
    countryCode?: string,
    billing: PlanBilling = UNSETTLED_BILLING,
    promotion: AutoDiscount | null = null
): PlanPrice {
    const pricer = new PlanPricer(countryCode, billing, promotion)
    const offer = pricer.offer(PRODUCT_OF[tier], HEADLINE_WEEKS[tier])
    const note = billing.continues ? getContinuationNote(tier, pricer, offer) : getRenewsSameTermNote(tier, pricer)
    return { amount: offer.amount, original: offer.original, badge: offer.badge, unit: pricer.unit(offer.period), note }
}

/** a plan note as plain text, a struck price in brackets, e.g. "Or €19.77 (instead of €32.95) for the first 13 weeks (-40%)" */
export function getPlanNoteText(note: NotePart[]): string {
    return note.map(part => (typeof part === 'string' ? part : getOfferText(part))).join('')
}

function getOfferText(offer: PeriodOffer): string {
    const original = offer.original ? ` (instead of ${offer.original})` : ''
    const badge = offer.badge ? ` (${offer.badge})` : ''
    return `${offer.amount}${original} ${offer.period}${badge}`
}

/** the tax sentence under the plan cards, with the same wording as the checkout (getTaxLabel) */
export function getPlanTaxNote(countryCode: string | undefined, billing: PlanBilling = UNSETTLED_BILLING): string {
    if (billing.net) return `${getTaxLabel(countryCode, false, true)}.`
    if (!countryCode) return 'Prices are before VAT until your country is known. VAT is added where applicable.'
    const label = getTaxLabel(countryCode, billing.exact)
    return billing.exact ? `${label}.` : `${label}. Checkout confirms the final price.`
}
