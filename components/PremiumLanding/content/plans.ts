// Plan cards of the /premium redesign. Prices are not stored here: they come from utils/PricingUtils
// (see planPricing.ts) so country and VAT handling match the purchase wizard.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'

export interface PlanCard {
    tier: PremiumTier
    title: string
    description: string
    badge?: string
    stats: { value: string; label: string }[]
    bullets: string[]
}

export const PLAN_CARDS: PlanCard[] = [
    {
        tier: PremiumTier.STARTER,
        title: 'Starter Premium',
        description: 'Essential features for casual players',
        stats: [
            { value: '~3 sec', label: 'Flip receive time' },
            { value: '1.5x', label: 'Profit vs. Free' }
        ],
        bullets: ['Top 3 results in every flip finder', 'Full access to flipper filters', '10 notifiers and 60 recent auctions', 'No ads on the website']
    },
    {
        tier: PremiumTier.PREMIUM,
        title: 'Premium',
        description: 'All Starter features plus advanced tools',
        badge: 'Most Popular',
        stats: [
            { value: '~0 sec', label: 'Flip receive time' },
            { value: '2.6x', label: 'Profit vs. Free' }
        ],
        bullets: [
            'Premium Bazaar, Attribute and Mayor cycle flips',
            'In-game lowball helper',
            '100 notifiers and 1 year of flip tracking history',
            'Discord role and priority feature requests'
        ]
    },
    {
        tier: PremiumTier.PREMIUM_PLUS,
        title: 'Premium+',
        description: 'All Premium features plus the fastest flips and advanced tools',
        stats: [
            { value: '< 0 sec', label: 'Flip receive time' },
            { value: '5.9x', label: 'Profit vs. Free' }
        ],
        bullets: [
            'Every flip first, before the API lists it',
            'Replay flips you missed while offline',
            'Archive, CSV exports and about 6 years of bazaar data',
            '3 years of profit history and endgame task gear paths'
        ]
    }
]

export const PLAN_BUTTON_LABEL: Record<PremiumTier, string> = {
    [PremiumTier.STARTER]: 'Get Starter Premium',
    [PremiumTier.PREMIUM]: 'Get Premium',
    [PremiumTier.PREMIUM_PLUS]: 'Get Premium+'
}
