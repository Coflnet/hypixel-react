// The four account tiers in the order every column of the /premium redesign uses.

export type TierName = 'Free' | 'Starter' | 'Premium' | 'Premium+'

/** one value per tier: Free, Starter, Premium, Premium+ */
export type PerTier<T> = [T, T, T, T]

export const TIER_NAMES: PerTier<TierName> = ['Free', 'Starter', 'Premium', 'Premium+']

/** CSS module class suffix per tier, e.g. styles.tierPremium */
export const TIER_CLASS: Record<TierName, string> = {
    Free: 'tierFree',
    Starter: 'tierStarter',
    Premium: 'tierPremium',
    'Premium+': 'tierPremiumPlus'
}
