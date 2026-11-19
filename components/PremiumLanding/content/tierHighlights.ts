// The per-tier feature highlights shared by the /premium plan cards and the purchase wizard's last step, so their texts cannot drift apart.

import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { PLAN_CARDS } from './plans'

/** the most important features of a tier, as the /premium plan card states them */
export function getTierHighlights(tier: PremiumTier): string[] {
    return PLAN_CARDS.find(card => card.tier === tier)?.bullets ?? []
}

/** the tier above `tier`, null for the top tier */
export function getNextHigherTier(tier: PremiumTier): PremiumTier | null {
    const index = PLAN_CARDS.findIndex(card => card.tier === tier)
    return index < 0 ? null : (PLAN_CARDS[index + 1]?.tier ?? null)
}

/** what the next tier adds over `tier`: its plan card lists the features beyond the lower tiers ("All Premium features plus ...") */
export function getUpgradeHighlights(tier: PremiumTier): string[] {
    const next = getNextHigherTier(tier)
    return next === null ? [] : getTierHighlights(next)
}

/** the plan card's line saying a tier includes the lower ones ("All Starter features plus ..."); none for the lowest tier */
export function getTierIntro(tier: PremiumTier): string | null {
    if (tier === PremiumTier.STARTER) return null
    return PLAN_CARDS.find(card => card.tier === tier)?.description ?? null
}
