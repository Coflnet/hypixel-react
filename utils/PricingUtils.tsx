import { BatchProductPricingResponse, ProviderPricingOption } from '../api/_generated/skyApi.schemas'
import { PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'

// Base prices in EUR (before tax)
export const BASE_PRICES = {
    [PremiumTier.STARTER]: 16.99, // yearly
    [PremiumTier.PREMIUM]: 8.69, // monthly
    [PremiumTier.PREMIUM_PLUS]: 354.2 / 12 // monthly (yearly)
}

// VAT rates by country code
export const VAT_RATES: { [countryCode: string]: number } = {
    DE: 0.19, // Germany 19%
    AT: 0.2, // Austria 20%
    BE: 0.21, // Belgium 21%
    BG: 0.2, // Bulgaria 20%
    HR: 0.25, // Croatia 25%
    CY: 0.19, // Cyprus 19%
    CZ: 0.21, // Czech Republic 21%
    DK: 0.25, // Denmark 25%
    EE: 0.2, // Estonia 20%
    FI: 0.24, // Finland 24%
    FR: 0.2, // France 20%
    GR: 0.24, // Greece 24%
    HU: 0.27, // Hungary 27%
    IE: 0.23, // Ireland 23%
    IT: 0.22, // Italy 22%
    LV: 0.21, // Latvia 21%
    LT: 0.21, // Lithuania 21%
    LU: 0.17, // Luxembourg 17%
    MT: 0.18, // Malta 18%
    NL: 0.21, // Netherlands 21%
    PL: 0.23, // Poland 23%
    PT: 0.23, // Portugal 23%
    RO: 0.19, // Romania 19%
    SK: 0.2, // Slovakia 20%
    SI: 0.22, // Slovenia 22%
    ES: 0.21, // Spain 21%
    SE: 0.25, // Sweden 25%
    GB: 0.2, // United Kingdom 20%
    NO: 0.25, // Norway 25%
    CH: 0.077, // Switzerland 7.7%
    CA: 0.13, // Canada (average HST/GST+PST) 13%
    AU: 0.1, // Australia 10%
    NZ: 0.15, // New Zealand 15%
    JP: 0.1, // Japan 10%
    SG: 0.08, // Singapore 8%
    IN: 0.18, // India 18%
    BR: 0.17, // Brazil (ICMS average) 17%
    MX: 0.16, // Mexico 16%
    KR: 0.1, // South Korea 10%
    ZA: 0.15, // South Africa 15%
    TR: 0.18, // Turkey 18%
    IL: 0.17, // Israel 17%
    TH: 0.07, // Thailand 7%
    MY: 0.06, // Malaysia 6%
    PH: 0.12, // Philippines 12%
    VN: 0.1, // Vietnam 10%
    ID: 0.11, // Indonesia 11%
    CL: 0.19, // Chile 19%
    AR: 0.21, // Argentina 21%
    CO: 0.19, // Colombia 19%
    PE: 0.18, // Peru 18%
    UY: 0.22, // Uruguay 22%
    EC: 0.12 // Ecuador 12%
}

export interface PriceInfo {
    basePrice: number
    vatRate: number
    vatAmount: number
    totalPrice: number
    currency: string
    displayText: string
}

export function calculatePrice(tier: PremiumTier, countryCode?: string, discountPercent: number = 0): PriceInfo {
    let basePrice = BASE_PRICES[tier]
    basePrice *= 1 - discountPercent / 100
    const vatRate = countryCode ? VAT_RATES[countryCode.toUpperCase()] || 0 : 0
    const vatAmount = basePrice * vatRate
    const totalPrice = basePrice + vatAmount

    // Determine if we should show (+VAT) text
    const isUSOrUnknown = !countryCode || countryCode.toUpperCase() === 'US' || !VAT_RATES[countryCode.toUpperCase()]

    let displayText: string
    if (isUSOrUnknown) {
        displayText = `€${basePrice.toFixed(2)} (+VAT)`
    } else {
        displayText = `€${totalPrice.toFixed(2)}`
    }

    // Add billing period info
    switch (tier) {
        case PremiumTier.STARTER:
            displayText += '/year'
            break
        case PremiumTier.PREMIUM:
            displayText += '/month'
            break
        case PremiumTier.PREMIUM_PLUS:
            displayText += '/month'
            break
    }

    return {
        basePrice,
        vatRate,
        vatAmount,
        totalPrice,
        currency: 'EUR',
        displayText
    }
}

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

export const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode
}

export const getProvider = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): ProviderPricingOption | undefined => {
    const product = pricingData?.products?.find(p => p.productSlug === productSlug)
    return product?.providers?.find(p => p.providerSlug === providerSlug)
}

export const getProviderPrice = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): number | null => {
    const provider = getProvider(pricingData, productSlug, providerSlug)
    return provider ? (provider.discountedPrice ?? provider.originalPrice) : null
}

export const getProviderOriginalPrice = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): number | null => {
    return getProvider(pricingData, productSlug, providerSlug)?.originalPrice ?? null
}

export const getProviderCurrencyCode = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string,
    providerSlug: string
): string => {
    return getProvider(pricingData, productSlug, providerSlug)?.currencyCode ?? 'EUR'
}

export const getDiscountPercent = (
    pricingData: BatchProductPricingResponse | null,
    productSlug: string
): number | null => {
    return pricingData?.products?.find(p => p.productSlug === productSlug)?.discountPercent ?? null
}

const TIER_PRODUCT_MAP: Record<PremiumTier, string> = {
    [PremiumTier.PREMIUM]: 'premium',
    [PremiumTier.PREMIUM_PLUS]: 'premium_plus',
    [PremiumTier.STARTER]: 'starter_premium'
}

export const getTierProductId = (tier: PremiumTier): string => {
    return TIER_PRODUCT_MAP[tier] ?? 'premium'
}

const TIER_SLUG_MAP: Record<PremiumTier, { monthly: string; yearly: string }> = {
    [PremiumTier.PREMIUM]: { monthly: 'l_premium', yearly: 'l_premium-year' },
    [PremiumTier.PREMIUM_PLUS]: { monthly: 'l_prem_plus', yearly: 'l_prem_plus-year' },
    [PremiumTier.STARTER]: { monthly: 'l_starter_premium', yearly: 'l_starter_premium' }
}

export const getTierSubscriptionSlug = (tier: PremiumTier, isYearly: boolean): string => {
    const slugs = TIER_SLUG_MAP[tier]
    return isYearly ? slugs.yearly : slugs.monthly
}

const TIER_API_PRODUCT_MAP: Record<PremiumTier, string> = {
    [PremiumTier.PREMIUM]: 'l_premium',
    [PremiumTier.PREMIUM_PLUS]: 'l_prem_plus',
    [PremiumTier.STARTER]: 'l_starter_premium'
}

export const getTierApiProductId = (tier: PremiumTier, isYearly: boolean): string => {
    const baseId = TIER_API_PRODUCT_MAP[tier]
    return isYearly && tier !== PremiumTier.STARTER ? `${baseId}-year` : baseId
}

const SUBSCRIPTION_PRICES: Record<string, { monthly: number; yearly: number }> = {
    'premium': { monthly: 8.69, yearly: 96.69 },
    'premium_plus': { monthly: 35.69, yearly: 354.2 },
    'starter_premium': { monthly: 16.99, yearly: 16.99 }
}

export const getFallbackSubscriptionPrice = (productId: string, isYearly: boolean): number => {
    const prices = SUBSCRIPTION_PRICES[productId]
    return prices ? (isYearly ? prices.yearly : prices.monthly) : -1
}
