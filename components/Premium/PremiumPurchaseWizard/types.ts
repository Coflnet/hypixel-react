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
    WEEK = 'week',
    MONTHLY = 'monthly',
    QUATER = 'quater',
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

export const getDurationDisplayName = (duration: Duration | null): string => {
    if (!duration) return ''
    switch (duration) {
        case Duration.HOUR: return '1 Hour'
        case Duration.WEEK: return '1 Week'
        case Duration.MONTHLY: return 'Monthly'
        case Duration.QUATER: return 'Quarterly'
        case Duration.YEARLY: return 'Yearly'
        default: return ''
    }
}

// Duration options for each tier and purchase type
export const getDurationOptions = (tier: PremiumTier, type: PurchaseType) => {
    if (type === PurchaseType.COFLCOINS) {
        switch (tier) {
            case PremiumTier.STARTER:
                return [
                    { label: '6 Months', desc: 'Half-year access', icon: '🕒', value: Duration.QUATER },
                    { label: '12 Months', desc: 'Full year access', icon: '🎯', value: Duration.YEARLY }
                ]
            case PremiumTier.PREMIUM:
                return [
                    { label: '1 Month', desc: 'Monthly access', icon: '📅', value: Duration.MONTHLY },
                    { label: '6 Months', desc: 'Half-year access', icon: '🕒', value: Duration.QUATER },
                    { label: '12 Months', desc: 'Full year access', icon: '🎯', value: Duration.YEARLY }
                ]
            case PremiumTier.PREMIUM_PLUS:
                return [
                    { label: '1 Hour', desc: 'Short access period', icon: '⏱️', value: Duration.HOUR },
                    { label: '1 Week', desc: 'Weekly access', icon: '📆', value: Duration.WEEK },
                    { label: '4 Weeks', desc: 'Approximately one month', icon: '📅', value: Duration.MONTHLY },
                    { label: '11 Weeks', desc: 'Extended multi-week access', icon: '🔁', value: Duration.QUATER }
                ]
            default:
                return []
        }
    } else {
        // Subscription type
        return [
            { label: 'Monthly', desc: 'Flexible monthly subscription', icon: '📅', value: Duration.MONTHLY },
            { label: 'Yearly', desc: 'Best value - save with annual billing', icon: '🎯', value: Duration.YEARLY }
        ]
    }
}
