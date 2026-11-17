// Prices for the plan cards, built from the same functions the purchase wizard's tier cards use.
// Subscriptions bill every 4, 13 or 52 weeks, so prices are labelled per 4 weeks (or 52 weeks), never per month.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { calculatePrice, getPriceWithVAT, shouldIncludeVAT, SUBSCRIPTION_PRICES } from '../../../utils/PricingUtils'
import { UNKNOWN_COUNTRY_VAT_NOTE } from '../../../utils/SubscriptionCheckout'

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

function subscriptionPrice(productId: string, period: 'monthly' | 'quarterly' | 'yearly', countryCode?: string): string {
    return euro(getPriceWithVAT(SUBSCRIPTION_PRICES[productId][period], countryCode))
}

function getPriceNote(tier: PremiumTier, countryCode?: string): string {
    switch (tier) {
        case PremiumTier.STARTER:
            return 'Billed every 52 weeks only, because of payment fees'
        case PremiumTier.PREMIUM:
            return `Or ${subscriptionPrice('premium', 'quarterly', countryCode)} every 13 weeks, ${subscriptionPrice('premium', 'yearly', countryCode)} every 52 weeks`
        case PremiumTier.PREMIUM_PLUS:
            return `Billed every 52 weeks at ${subscriptionPrice('premium_plus', 'yearly', countryCode)}, or ${subscriptionPrice('premium_plus', 'monthly', countryCode)} every 4 weeks`
    }
}

function getUnit(tier: PremiumTier, countryCode?: string): string {
    const period = tier === PremiumTier.STARTER ? 'per 52 weeks' : 'per 4 weeks'
    if (!countryCode) return `${period}, ${UNKNOWN_COUNTRY_VAT_NOTE}`
    return shouldIncludeVAT(countryCode) ? period : `+ VAT ${period}`
}

export function getPlanPrice(tier: PremiumTier, countryCode?: string): PlanPrice {
    const price = calculatePrice(tier, countryCode)
    return {
        amount: euro(price.totalPrice),
        unit: getUnit(tier, countryCode),
        note: getPriceNote(tier, countryCode)
    }
}
