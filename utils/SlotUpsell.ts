import type { PurchaseableProduct } from '../api/_generated/skyApi.schemas'
import { PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'

/** the bigger bundle of the same tier ("bundle") or the same bundle of the higher slot tier ("tier") */
export interface SlotUpsell {
    kind: 'bundle' | 'tier'
    product: PurchaseableProduct
}

const BIGGEST_BUNDLE = 4

const isSubscription = (product: PurchaseableProduct) => product.slug?.startsWith('l_') === true

/**
 * What the slot checkout can suggest instead of the offered package, only from products the catalog really sells for the same
 * billing period and payment method: the 4-slot bundle for a single slot, and Premium+ slots for Premium slots.
 */
export function getSlotUpsells(products: PurchaseableProduct[], tier: PremiumTier, slotCount: number, recurring: boolean, ownershipSeconds: number | undefined): SlotUpsell[] {
    const sold = products.filter(product => isSubscription(product) === recurring && product.ownershipSeconds === ownershipSeconds)
    const find = (slotTier: string, count: number) => sold.find(product => product.slotTier === slotTier && product.slotCount === count)
    const upsells: SlotUpsell[] = []
    const bundle = slotCount < BIGGEST_BUNDLE ? find(tier, BIGGEST_BUNDLE) : undefined
    if (bundle) upsells.push({ kind: 'bundle', product: bundle })
    const higher = tier === PremiumTier.PREMIUM ? find(PremiumTier.PREMIUM_PLUS, slotCount) : undefined
    if (higher) upsells.push({ kind: 'tier', product: higher })
    return upsells
}
