// Prices for the plan cards, built from the same functions the purchase wizard's tier cards use.
// Subscriptions bill every 4, 13 or 52 weeks, so prices are labelled per 4 weeks (or 52 weeks), never per month.
// The billing (PlanBilling) says how the checkout will charge: `exact` (a direct Stripe/PayPal checkout bills the buyer's country)
// prices like the checkout, the exact charge with no "+ VAT" where none is added (the US); `net` (Stripe Managed Payments) shows net
// prices, Stripe adds the tax; otherwise the tax estimate of the buyer's country (Lemon Squeezy). Until the offer settles
// (loading, server-rendered page) the card/PayPal wording is used, as Lemon Squeezy is only the fallback.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { calculatePrice, getPriceWithVAT, SUBSCRIPTION_PRICES } from '../../../utils/PricingUtils'
import {
    CANCEL_ANYTIME,
    getDirectPrice,
    getTaxLabel,
    isExactCharge,
    isFourWeekContinuation,
    isNetCharge,
    showsVatSuffix,
    UNKNOWN_COUNTRY_VAT_NOTE
} from '../../../utils/SubscriptionCheckout'
import type { CheckoutOffer } from '../../../hooks/useCheckoutOffer'

export interface PlanPrice {
    /** e.g. "€9.69" */
    amount: string
    /** the period with the VAT that is not in the amount, e.g. "+ VAT per 4 weeks" or "per 4 weeks" when it is included */
    unit: string
    note: string
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

function euro(value: number): string {
    return `€${value.toFixed(2)}`
}

/** a before-tax price as the buyer pays it: the exact charge of a direct checkout, the net price of Managed Payments, otherwise the country's tax estimate */
function withTax(price: number, countryCode: string | undefined, billing: PlanBilling): number {
    if (billing.exact) return getDirectPrice(price, 0, countryCode)
    if (billing.net) return getDirectPrice(price, 0, undefined)
    return getPriceWithVAT(price, countryCode)
}

type Period = 'monthly' | 'quarterly' | 'yearly'
type PriceOf = (productId: string, period: Period) => string

/** the 4-week price a 13/52 week plan continues with, named only once the offer is settled (it is not guessed before) */
function renewalPhrase(price: PriceOf, productId: string, billing: PlanBilling): string {
    return billing.settled ? `${price(productId, 'monthly')} ` : ''
}

/**
 * The note under a plan card for Stripe and PayPal: the 13 and 52 week plans continue every 4 weeks at the 4-week price after
 * their first term.
 */
function getContinuationNote(tier: PremiumTier, price: PriceOf, billing: PlanBilling): string {
    if (tier === PremiumTier.PREMIUM) {
        return `Or ${price('premium', 'quarterly')} for 13 weeks or ${price('premium', 'yearly')} for 52 weeks, then ${renewalPhrase(price, 'premium', billing)}every 4 weeks until cancelled. ${CANCEL_ANYTIME}`
    }
    if (tier === PremiumTier.STARTER) {
        return `${price('starter_premium', 'yearly')} for the first 52 weeks, then ${renewalPhrase(price, 'starter_premium', billing)}every 4 weeks until cancelled. ${CANCEL_ANYTIME}`
    }
    return `${price('premium_plus', 'yearly')} for the first 52 weeks, then ${renewalPhrase(price, 'premium_plus', billing)}every 4 weeks until cancelled. Or ${price('premium_plus', 'monthly')} every 4 weeks from the start. ${CANCEL_ANYTIME}`
}

/** Lemon Squeezy renews for the same term again */
function getRenewsSameTermNote(tier: PremiumTier, price: PriceOf): string {
    if (tier === PremiumTier.PREMIUM) return `Or ${price('premium', 'quarterly')} every 13 weeks, ${price('premium', 'yearly')} every 52 weeks`
    if (tier === PremiumTier.STARTER) return 'Billed every 52 weeks only, because of payment fees'
    return `Billed every 52 weeks at ${price('premium_plus', 'yearly')}, or ${price('premium_plus', 'monthly')} every 4 weeks`
}

function getPriceNote(tier: PremiumTier, countryCode: string | undefined, billing: PlanBilling): string {
    const price: PriceOf = (productId, period) => euro(withTax(SUBSCRIPTION_PRICES[productId][period], countryCode, billing))
    return billing.continues ? getContinuationNote(tier, price, billing) : getRenewsSameTermNote(tier, price)
}

function getUnit(tier: PremiumTier, countryCode: string | undefined, billing: PlanBilling): string {
    const period = tier === PremiumTier.STARTER ? 'per 52 weeks' : 'per 4 weeks'
    if (billing.net) return `+ tax ${period}`
    if (!countryCode) return `${period}, ${UNKNOWN_COUNTRY_VAT_NOTE}`
    return showsVatSuffix(countryCode, billing.exact) ? `+ VAT ${period}` : period
}

export function getPlanPrice(tier: PremiumTier, countryCode?: string, billing: PlanBilling = UNSETTLED_BILLING): PlanPrice {
    const price = calculatePrice(tier, countryCode)
    return {
        amount: euro(withTax(price.basePrice, countryCode, billing)),
        unit: getUnit(tier, countryCode, billing),
        note: getPriceNote(tier, countryCode, billing)
    }
}

/** the tax sentence under the plan cards, with the same wording as the checkout (getTaxLabel) */
export function getPlanTaxNote(countryCode: string | undefined, billing: PlanBilling = UNSETTLED_BILLING): string {
    if (billing.net) return `${getTaxLabel(countryCode, false, true)}.`
    if (!countryCode) return 'Prices are before VAT until your country is known. VAT is added where applicable.'
    const label = getTaxLabel(countryCode, billing.exact)
    return billing.exact ? `${label}.` : `${label}. Checkout confirms the final price.`
}
