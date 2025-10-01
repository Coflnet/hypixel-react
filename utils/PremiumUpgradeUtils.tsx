import { PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'

/**
 * Utility functions for generating premium upgrade links and handling tier-related operations
 */

/**
 * Generates a premium purchase URL with tier pre-selection
 * @param tier - The premium tier to pre-select
 * @param additionalParams - Additional URL parameters (e.g., campaign tracking)
 * @returns Complete URL with tier parameter
 */
export const generatePremiumUpgradeUrl = (tier: PremiumTier, additionalParams?: Record<string, string>): string => {
    const baseUrl = '/premium'
    const params = new URLSearchParams()

    // Add tier parameter
    params.set('tier', tier)

    // Add any additional parameters
    if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
            params.set(key, value)
        })
    }

    return `${baseUrl}?${params.toString()}`
}

/**
 * Generates premium upgrade links for marketing campaigns
 */
export const generateCampaignLinks = {
    /**
     * Premium Plus direct purchase link (skips tier selection)
     */
    premiumPlusDirect: (campaign?: string) => generatePremiumUpgradeUrl(PremiumTier.PREMIUM_PLUS, campaign ? { campaign } : {}),

    /**
     * Premium upgrade link (good for Starter users)
     */
    premiumUpgrade: (campaign?: string) => generatePremiumUpgradeUrl(PremiumTier.PREMIUM, campaign ? { campaign } : {}),

    /**
     * Starter Premium link (for new users)
     */
    starterPremium: (campaign?: string) => generatePremiumUpgradeUrl(PremiumTier.STARTER, campaign ? { campaign } : {})
}

/**
 * Get the next tier up from current tier (for upselling)
 * @param currentTier - User's current premium tier
 * @returns Next tier up, or null if already at highest tier
 */
export const getNextTierUp = (currentTier: PremiumTier): PremiumTier | null => {
    switch (currentTier) {
        case PremiumTier.STARTER:
            return PremiumTier.PREMIUM
        case PremiumTier.PREMIUM:
            return PremiumTier.PREMIUM_PLUS
        case PremiumTier.PREMIUM_PLUS:
            return null // Already highest tier
        default:
            return null
    }
}

/**
 * Get tier display name for UI
 * @param tier - Premium tier
 * @returns Human-readable tier name
 */
export const getTierDisplayName = (tier: PremiumTier): string => {
    switch (tier) {
        case PremiumTier.STARTER:
            return 'Starter Premium'
        case PremiumTier.PREMIUM:
            return 'Premium'
        case PremiumTier.PREMIUM_PLUS:
            return 'Premium Plus'
        default:
            return 'Premium'
    }
}

/**
 * Check if a tier is higher than another tier
 * @param tierA - First tier to compare
 * @param tierB - Second tier to compare
 * @returns True if tierA is higher than tierB
 */
export const isTierHigher = (tierA: PremiumTier, tierB: PremiumTier): boolean => {
    const getTierRank = (tier: PremiumTier): number => {
        switch (tier) {
            case PremiumTier.STARTER:
                return 1
            case PremiumTier.PREMIUM:
                return 2
            case PremiumTier.PREMIUM_PLUS:
                return 3
            default:
                return 0
        }
    }

    return getTierRank(tierA) > getTierRank(tierB)
}

/**
 * Parse tier from URL parameter
 * @param tierParam - Tier parameter from URL
 * @returns Parsed premium tier or null if invalid
 */
export const parseTierFromUrl = (tierParam: string | null): PremiumTier | null => {
    if (!tierParam) return null

    const normalized = tierParam.toLowerCase().replace(/[-_]/g, '')

    switch (normalized) {
        case 'starter':
            return PremiumTier.STARTER
        case 'premium':
            return PremiumTier.PREMIUM
        case 'premiumplus':
        case 'premium+':
            return PremiumTier.PREMIUM_PLUS
        default:
            return null
    }
}

/**
 * Example usage for marketing campaigns:
 *
 * // Generate direct Premium Plus purchase link
 * const premiumPlusLink = generateCampaignLinks.premiumPlusDirect('summer2024')
 * // Result: '/premium?tier=premium_plus&campaign=summer2024'
 *
 * // Generate upgrade link for email campaign
 * const upgradeLink = generatePremiumUpgradeUrl(PremiumTier.PREMIUM, {
 *     campaign: 'email_upgrade',
 *     source: 'newsletter'
 * })
 * // Result: '/premium?tier=premium&campaign=email_upgrade&source=newsletter'
 *
 * // Check if user can be upsold
 * const currentTier = PremiumTier.STARTER
 * const nextTier = getNextTierUp(currentTier)
 * if (nextTier) {
 *     const upsellLink = generatePremiumUpgradeUrl(nextTier, { upsell: 'true' })
 *     // Show upsell banner with link
 * }
 */
