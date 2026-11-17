// Prices for the plan cards, built from the same functions the purchase wizard's tier cards use.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { calculatePrice, getPriceWithVAT, shouldIncludeVAT, SUBSCRIPTION_PRICES } from '../../../utils/PricingUtils'

export interface PlanPrice {
    /** e.g. "€9.69" */
    amount: string
    /** true when VAT is added at checkout (US or unknown country) */
    plusVat: boolean
    period: 'per year' | 'per month'
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
            return 'Yearly only, because of payment fees'
        case PremiumTier.PREMIUM:
            return `Or ${subscriptionPrice('premium', 'quarterly', countryCode)} quarterly, ${subscriptionPrice('premium', 'yearly', countryCode)} yearly`
        case PremiumTier.PREMIUM_PLUS:
            return `Billed yearly at ${subscriptionPrice('premium_plus', 'yearly', countryCode)}, or ${subscriptionPrice('premium_plus', 'monthly', countryCode)} monthly`
    }
}

export function getPlanPrice(tier: PremiumTier, countryCode?: string): PlanPrice {
    const price = calculatePrice(tier, countryCode)
    return {
        amount: euro(price.totalPrice),
        plusVat: !shouldIncludeVAT(countryCode),
        period: tier === PremiumTier.STARTER ? 'per year' : 'per month',
        note: getPriceNote(tier, countryCode)
    }
}
