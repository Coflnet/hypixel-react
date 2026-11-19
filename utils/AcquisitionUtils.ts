/**
 * Given an ingredient's cheap-channel capacity/price data and the total quantity needed,
 * computes the optimal acquisition split between placing a bazaar buy order (cheap, capped)
 * and insta-buying the remainder (more expensive, uncapped). Returns null when there's no
 * usable data (backend hasn't populated these fields yet).
 */
export type AcquisitionMode = 'order' | 'insta'

export interface AcquisitionBucket {
    qty: number
    unitPrice: number
    cost: number
}

export interface AcquisitionPlan {
    mode: AcquisitionMode
    npc: AcquisitionBucket
    order: AcquisitionBucket
    insta: AcquisitionBucket
    /** Units that could not be sourced from any known channel (no insta price available). */
    unmet: number
    totalCount: number
    totalCost: number
}

/**
 * Works out how a given total amount of an ingredient would realistically be acquired on the bazaar,
 * cheapest channel first in 'order' mode: NPC stock, then a competitive buy order, then sell offers.
 * 'insta' mode still uses immediately available NPC stock, skips buy orders, and prices the remainder
 * from sell offers.
 * The capacities and capacity-weighted unit prices come from the backend, so every channel is bounded
 * when recomputing a tree-multiplied total. Any amount beyond the summarized order-book depth remains
 * unmet instead of being priced repeatedly at the cheapest visible offer. Returns null when there is no
 * market data at all.
 */
export function getAcquisitionPlan(
    ingredient: {
        npcCapacity?: number | null
        npcUnitPrice?: number | null
        buyOrderCapacity?: number | null
        buyOrderUnitPrice?: number | null
        instaBuyCapacity?: number | null
        instaBuyUnitPrice?: number | null
    },
    totalCount: number,
    mode: AcquisitionMode = 'order'
): AcquisitionPlan | null {
    const npcCap = Math.max(0, ingredient.npcCapacity ?? 0)
    const npcUnit = ingredient.npcUnitPrice ?? 0
    const orderCap = Math.max(0, ingredient.buyOrderCapacity ?? 0)
    const orderUnit = ingredient.buyOrderUnitPrice ?? 0
    const instaCap = Math.max(0, ingredient.instaBuyCapacity ?? 0)
    const instaUnit = ingredient.instaBuyUnitPrice ?? 0
    if ((npcCap <= 0 || npcUnit <= 0) && (orderCap <= 0 || orderUnit <= 0) && (instaCap <= 0 || instaUnit <= 0)) {
        return null // no market data
    }

    const total = Math.max(0, Math.round(totalCount))
    let remaining = total

    const npcQty = npcUnit > 0 ? Math.min(remaining, npcCap) : 0
    remaining -= npcQty

    const orderQty = mode === 'order' && orderUnit > 0 ? Math.min(remaining, orderCap) : 0
    remaining -= orderQty

    const instaQty = instaUnit > 0 ? Math.min(remaining, instaCap) : 0
    remaining -= instaQty

    const npc: AcquisitionBucket = { qty: npcQty, unitPrice: npcUnit, cost: npcQty * npcUnit }
    const order: AcquisitionBucket = { qty: orderQty, unitPrice: orderUnit, cost: orderQty * orderUnit }
    const insta: AcquisitionBucket = { qty: instaQty, unitPrice: instaUnit, cost: instaQty * instaUnit }

    return {
        mode,
        npc,
        order,
        insta,
        unmet: remaining,
        totalCount: total,
        totalCost: npc.cost + order.cost + insta.cost
    }
}
