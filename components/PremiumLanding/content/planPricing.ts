// Prices for the plan cards, built from the same functions the purchase wizard's tier cards use.
// Subscriptions bill every 4, 13 or 52 weeks, so prices are labelled per 4 weeks (or 52 weeks), never per month.
// `exact` (isExactCharge: a direct Stripe/PayPal checkout bills the buyer's country) prices like the checkout: the exact
// charge, no "+ VAT" where none is added (the US); otherwise the tax estimate of the buyer's country.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { calculatePrice, getPriceWithVAT, SUBSCRIPTION_PRICES } from '../../../utils/PricingUtils'
import { getDirectPrice, getTaxLabel, showsVatSuffix, UNKNOWN_COUNTRY_VAT_NOTE } from '../../../utils/SubscriptionCheckout'

export interface PlanPrice {
    /** e.g. "€9.69" */
    amount: string
    /** the period with the VAT that is not in the amount, e.g. "+ VAT per 4 weeks" or "per 4 weeks" when it is included */
    unit: string
    note: string
}

function euro(value: number): string {
    return `€${value.toFixed(2)}`
}

/** a before-tax price as the buyer pays it: the direct checkout's exact charge, otherwise the country's tax estimate */
function withTax(price: number, countryCode: string | undefined, exact: boolean): number {
    return exact ? getDirectPrice(price, 0, countryCode) : getPriceWithVAT(price, countryCode)
}

function subscriptionPrice(productId: string, period: 'monthly' | 'quarterly' | 'yearly', countryCode: string | undefined, exact: boolean): string {
    return euro(withTax(SUBSCRIPTION_PRICES[productId][period], countryCode, exact))
}

function getPriceNote(tier: PremiumTier, countryCode: string | undefined, exact: boolean): string {
    const price = (productId: string, period: 'monthly' | 'quarterly' | 'yearly') => subscriptionPrice(productId, period, countryCode, exact)
    switch (tier) {
        case PremiumTier.STARTER:
            return 'Billed every 52 weeks only, because of payment fees'
        case PremiumTier.PREMIUM:
            return `Or ${price('premium', 'quarterly')} every 13 weeks, ${price('premium', 'yearly')} every 52 weeks`
        case PremiumTier.PREMIUM_PLUS:
            return `Billed every 52 weeks at ${price('premium_plus', 'yearly')}, or ${price('premium_plus', 'monthly')} every 4 weeks`
    }
}

function getUnit(tier: PremiumTier, countryCode: string | undefined, exact: boolean): string {
    const period = tier === PremiumTier.STARTER ? 'per 52 weeks' : 'per 4 weeks'
    if (!countryCode) return `${period}, ${UNKNOWN_COUNTRY_VAT_NOTE}`
    return showsVatSuffix(countryCode, exact) ? `+ VAT ${period}` : period
}

export function getPlanPrice(tier: PremiumTier, countryCode?: string, exact = false): PlanPrice {
    const price = calculatePrice(tier, countryCode)
    return {
        amount: euro(withTax(price.basePrice, countryCode, exact)),
        unit: getUnit(tier, countryCode, exact),
        note: getPriceNote(tier, countryCode, exact)
    }
}

/** the tax sentence under the plan cards, with the same wording as the checkout (getTaxLabel) */
export function getPlanTaxNote(countryCode: string | undefined, exact: boolean): string {
    if (!countryCode) return 'Prices are before VAT until your country is known. VAT is added where applicable.'
    const label = getTaxLabel(countryCode, exact)
    return exact ? `${label}.` : `${label}. Checkout confirms the final price.`
}
