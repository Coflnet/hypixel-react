export enum PremiumTier {
    STARTER = 'starter',
    PREMIUM = 'premium',
    PREMIUM_PLUS = 'premium_plus'
}

export enum PurchaseType {
    SUBSCRIPTION = 'subscription',
    COFLCOINS = 'coflcoins'
}

export enum Duration {
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTHLY = 'monthly',
    QUARTER = 'quarter',
    YEARLY = 'yearly'
}

// Helper functions for display names
export const getTierDisplayName = (tier: PremiumTier): string => {
    switch (tier) {
        case PremiumTier.STARTER: return 'Starter Premium'
        case PremiumTier.PREMIUM: return 'Premium'
        case PremiumTier.PREMIUM_PLUS: return 'Premium Plus'
        default: return 'Premium'
    }
}

// Duration options for each tier and purchase type. Subscriptions of 13 and 52 weeks continue every 4 weeks after their first term
// (`continues`, the default: Stripe and PayPal); only Lemon Squeezy renews for the same term again.
export const getDurationOptions = (tier: PremiumTier, type: PurchaseType, continues = true) => {
    if (type === PurchaseType.COFLCOINS) {
        switch (tier) {
            case PremiumTier.STARTER:
                return [
                    { label: '6 Months', desc: 'Half-year access', icon: '🕒', value: Duration.QUARTER },
                    { label: '12 Months', desc: 'Full year access', icon: '🎯', value: Duration.YEARLY }
                ]
            case PremiumTier.PREMIUM:
                return [
                    { label: '1 Month', desc: 'Monthly access', icon: '📅', value: Duration.MONTHLY },
                    { label: '3 Months', desc: 'Short-term quarterly access', icon: '📆', value: Duration.QUARTER },
                    { label: '12 Months', desc: 'Full year access', icon: '🎯', value: Duration.YEARLY }
                ]
            case PremiumTier.PREMIUM_PLUS:
                return [
                    { label: '1-3 Weeks', desc: 'Choose 1, 2, or 3 weeks in the next step', icon: '📆', value: Duration.WEEK, badge: 'Flexible' },
                    { label: '4 Weeks', desc: 'Approximately one month', icon: '📅', value: Duration.MONTHLY, badge: 'Popular' },
                    { label: '11 Weeks', desc: 'Extended multi-week access', icon: '🔁', value: Duration.QUARTER, badge: 'Best Value' },
                    { label: '1 Day', desc: 'Daily access period', icon: '📅', value: Duration.DAY }
                ]
            default:
                return []
        }
    } else {
        return getSubscriptionDurationOptions(tier, continues)
    }
}

/** what a subscription of `weeks` does after its first term, in the duration cards' words */
function describeTerm(weeks: number, continues: boolean): string {
    if (!continues) return `Renews every ${weeks} weeks`
    return `First ${weeks} weeks, then every 4 weeks until cancelled. Cancel anytime`
}

// Subscriptions bill in weeks: every 4 weeks is not a calendar month. Starter is only sold for 52 weeks (payment fees).
function getSubscriptionDurationOptions(tier: PremiumTier, continues: boolean) {
    if (tier === PremiumTier.STARTER)
        return [{ label: 'Yearly', desc: continues ? `${describeTerm(52, continues)}` : `${describeTerm(52, continues)}. Due to payment fees Starter is only billed yearly`, icon: '🎯', value: Duration.YEARLY }]
    return [
        { label: '4 weeks', desc: 'Flexible, renews every 4 weeks', icon: '📅', value: Duration.MONTHLY },
        { label: 'Quarterly', desc: `${describeTerm(13, continues)} - better value`, icon: '📆', value: Duration.QUARTER, badge: 'Recommended' },
        { label: 'Yearly', desc: `${describeTerm(52, continues)} - best value`, icon: '🎯', value: Duration.YEARLY }
    ]
}

/** the codes of a checkout that an in-place upgrade to another tier carries over, as the buyer applied them */
export interface CheckoutCodes {
    /** the applied code, or the code text still being checked; '' the buyer cleared it (it stays cleared through further upgrades), undefined: no preference */
    discountCode?: string | null
    creatorCode?: string | null
}
