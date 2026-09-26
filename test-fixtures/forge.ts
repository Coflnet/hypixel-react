import type { ForgeFlip, Ingredient, ProfitableCraft } from '../api/_generated/skyApi.schemas'

const mithril: Ingredient = {
    itemId: 'MITHRIL', count: 10, cost: 100, buyOrderCost: 80, craftCost: 0,
    npcCapacity: 5, npcUnitPrice: 5,
    buyOrderCapacity: 1000, buyOrderUnitPrice: 8,
    instaBuyCapacity: 1000, instaBuyUnitPrice: 10
}

export const subcraft: ProfitableCraft = {
    itemId: 'ENCHANTED_MITHRIL', sellPrice: 200, craftCost: 100, buyOrderCraftCost: 80,
    ingredients: [mithril], volume: 100, median: 200, lastUpdated: '2026-01-01T00:00:00Z'
}

export const forgeFlips: ForgeFlip[] = ['REFINED_MITHRIL', 'REFINED_TITANIUM', 'MITHRIL_PLATE', 'GOLDEN_PLATE'].map((itemId, index) => ({
    duration: 3600, requiredHotMLevel: 3, profitPerHour: 4000 - index * 1000,
    craftData: {
        ...subcraft, itemId, type: 'forge', sellPrice: 5000, craftCost: 200, buyOrderCraftCost: 160,
        ingredients: [{
            ...mithril, itemId: index === 3 ? 'REFINED_MITHRIL' : 'ENCHANTED_MITHRIL', type: 'craft',
            count: 2, cost: 200, buyOrderCost: 160, craftCost: 100, npcCapacity: 0,
            buyOrderUnitPrice: 80, instaBuyUnitPrice: 100
        }]
    }
}))
