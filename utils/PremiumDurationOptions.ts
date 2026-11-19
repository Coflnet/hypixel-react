import { Duration, PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'

// Matches the CoflCoins options of a tier (PREMIUM_TYPES) to the wizard's billing durations.

const STARTER_ID = 'starter_premium'

/**
 * Whether a coins option is of the wizard's duration, decided by its label and never by the raw `value` (3 weeks is not 3 months).
 * The tiers sell similar, not identical lengths for a duration: the quarter is 3 months for Premium, 11 weeks for Premium+ and
 * 6 months (its half year) for Starter.
 */
export function isOptionOfDuration(premiumType: PremiumType, option: PremiumTypeOption, wizardDuration: Duration): boolean {
    const label = (typeof option.label === 'string' ? option.label : String(option.label)).toLowerCase()
    switch (wizardDuration) {
        case Duration.HOUR:
            return label.includes('hour')
        case Duration.DAY:
            return label.includes('day') && !label.includes('week')
        case Duration.WEEK:
            return label.includes('week') && !label.includes('month')
        case Duration.MONTHLY:
            return label.includes('month') || label.includes('4 weeks')
        case Duration.QUARTER:
            if (premiumType.productId === STARTER_ID) return label.includes('6 months')
            return label.includes('3 month') || label.includes('11 weeks')
        case Duration.YEARLY:
            return label.includes('year') || label.includes('12 months')
        default:
            return false
    }
}

/** the option of the wizard's duration, undefined when the type has none */
export function findOptionOfDuration(premiumType: PremiumType, wizardDuration: Duration | null | undefined): PremiumTypeOption | undefined {
    if (!wizardDuration) return undefined
    return premiumType.options.find(option => isOptionOfDuration(premiumType, option, wizardDuration))
}

/** the best option for the wizard's duration, the type's first option when it has none */
export function findMatchingPremiumOption(premiumType: PremiumType, wizardDuration: Duration | null | undefined): PremiumTypeOption {
    return findOptionOfDuration(premiumType, wizardDuration) || premiumType.options[0]
}

/**
 * The option of the next tier to advertise beside a purchase of `tier` for `wizardDuration`: its option of the same duration,
 * undefined when it has none or the lengths are unrelated (Starter's half year has no counterpart).
 */
export function findUpgradeOption(tier: PremiumTier, nextType: PremiumType | undefined, wizardDuration: Duration | null | undefined): PremiumTypeOption | undefined {
    if (!nextType || (tier === PremiumTier.STARTER && wizardDuration === Duration.QUARTER)) return undefined
    return findOptionOfDuration(nextType, wizardDuration)
}
