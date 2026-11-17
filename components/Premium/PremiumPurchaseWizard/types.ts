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

// Duration options for each tier and purchase type
export const getDurationOptions = (tier: PremiumTier, type: PurchaseType) => {
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
        if (tier === PremiumTier.STARTER)
            return [{ label: 'Yearly', desc: 'Renews every 52 weeks. Due to payment fees Starter is only billed yearly', icon: '🎯', value: Duration.YEARLY }]
        // Subscriptions bill in weeks: every 4 weeks is not a calendar month
        return [
            { label: '4 weeks', desc: 'Flexible, renews every 4 weeks', icon: '📅', value: Duration.MONTHLY },
            { label: 'Quarterly', desc: 'Renews every 13 weeks - better value', icon: '📆', value: Duration.QUARTER, badge: 'Recommended' },
            { label: 'Yearly', desc: 'Renews every 52 weeks - best value', icon: '🎯', value: Duration.YEARLY }
        ]
    }
}
