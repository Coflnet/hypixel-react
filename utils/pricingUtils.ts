import { BatchProductPricingResponse, ProviderPricingOption } from '../api/_generated/skyApi.schemas'
import { Duration, PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'

// Currency symbol mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
}

// Get currency symbol or code
export const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode
}

// Find a provider in pricing data
export const getProvider = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): ProviderPricingOption | undefined => {
    const product = pricingData?.products?.find(p => p.productSlug === productSlug)
    return product?.providers?.find(p => p.providerSlug === providerSlug)
}

// Get discounted or original price
export const getProviderPrice = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): number | null => {
    const provider = getProvider(pricingData, productSlug, providerSlug)
    return provider ? (provider.discountedPrice ?? provider.originalPrice) : null
}

// Get original price
export const getProviderOriginalPrice = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): number | null => {
    return getProvider(pricingData, productSlug, providerSlug)?.originalPrice ?? null
}

// Get currency code
export const getProviderCurrencyCode = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): string => {
    return getProvider(pricingData, productSlug, providerSlug)?.currencyCode ?? 'EUR'
}

// Get discount percentage
export const getDiscountPercent = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string
): number | null => {
    return pricingData?.products?.find(p => p.productSlug === productSlug)?.discountPercent ?? null
}

// Premium tier to product ID mapping
const TIER_PRODUCT_MAP: Record<PremiumTier, string> = {
    [PremiumTier.PREMIUM]: 'premium',
    [PremiumTier.PREMIUM_PLUS]: 'premium_plus',
    [PremiumTier.STARTER]: 'starter_premium'
}

// Get product ID from premium tier
export const getTierProductId = (tier: PremiumTier): string => {
    return TIER_PRODUCT_MAP[tier] ?? 'premium'
}

// Premium tier to subscription product slug mapping
const TIER_SLUG_MAP: Record<PremiumTier, { monthly: string; yearly: string }> = {
    [PremiumTier.PREMIUM]: { monthly: 'l_premium', yearly: 'l_premium-year' },
    [PremiumTier.PREMIUM_PLUS]: { monthly: 'l_prem_plus', yearly: 'l_prem_plus-year' },
    [PremiumTier.STARTER]: { monthly: 'l_starter_premium', yearly: 'l_starter_premium' }
}

// Get subscription product slug for a tier
export const getTierSubscriptionSlug = (tier: PremiumTier, isYearly: boolean): string => {
    const slugs = TIER_SLUG_MAP[tier]
    return isYearly ? slugs.yearly : slugs.monthly
}

// Premium tier to API product ID mapping
const TIER_API_PRODUCT_MAP: Record<PremiumTier, string> = {
    [PremiumTier.PREMIUM]: 'l_premium',
    [PremiumTier.PREMIUM_PLUS]: 'l_prem_plus',
    [PremiumTier.STARTER]: 'l_starter_premium'
}

// Get API product ID for a tier - supports both legacy boolean and new Duration enum
export const getTierApiProductId = (tier: PremiumTier, isYearlyOrDuration: boolean | Duration = false): string => {
    const baseId = TIER_API_PRODUCT_MAP[tier]
    
    // Handle Duration enum
    if (typeof isYearlyOrDuration === 'string') {
        switch (isYearlyOrDuration) {
            case Duration.YEARLY:
                return tier !== PremiumTier.STARTER ? `${baseId}-year` : baseId
            case Duration.QUARTER:
                return tier !== PremiumTier.STARTER ? `${baseId}-quarter` : baseId
            case Duration.MONTHLY:
            default:
                return baseId
        }
    }
    
    // Handle legacy boolean
    const isYearly = isYearlyOrDuration as boolean
    return isYearly && tier !== PremiumTier.STARTER ? `${baseId}-year` : baseId
}

// Fallback subscription prices
export const SUBSCRIPTION_PRICES: Record<string, { monthly: number; quarterly: number; yearly: number }> = {
    'premium': { monthly: 9.69, quarterly: 27.69, yearly: 96.69 },
    'premium_plus': { monthly: 35.69, quarterly: 99.69, yearly: 354.2 },
    'starter_premium': { monthly: 16.99, quarterly: 16.99, yearly: 16.99 }
}

// Get fallback subscription price
export const getFallbackSubscriptionPrice = (productId: string, isYearly: boolean | Duration = false): number => {
    const prices = SUBSCRIPTION_PRICES[productId]
    if (!prices) return -1
    
    // Handle Duration enum
    if (typeof isYearly === 'string') {
        switch (isYearly) {
            case Duration.YEARLY:
                return prices.yearly
            case Duration.QUARTER:
                return prices.quarterly
            case Duration.MONTHLY:
            default:
                return prices.monthly
        }
    }
    
    // Handle legacy boolean
    return (isYearly as boolean) ? prices.yearly : prices.monthly
}
