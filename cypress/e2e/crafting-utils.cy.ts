import { getCombinedShoppingList } from '../../utils/CraftingUtils'

describe('Crafting utilities', () => {
    it('keeps the copy amount in sync when purchases are combined', () => {
        const ingredient = (quantity: number): CraftingIngredient => ({
            item: { tag: 'SEA_LUMIES', name: 'Sea Lumies' } as Item,
            count: quantity,
            absoluteCount: quantity,
            cost: quantity,
            acquisitionPlan: {
                itemId: 'SEA_LUMIES',
                quantity,
                cost: quantity,
                enough: true,
                method: 'order',
                directBuyCost: quantity,
                directBuyEnough: true,
                craftCost: 0,
                craftEnough: false,
                craftedQuantity: 0,
                purchases: [{ source: 'order', quantity, unitPrice: 1, cost: quantity }],
                ingredients: []
            }
        })

        const [combined] = getCombinedShoppingList([ingredient(20480), ingredient(5120)])

        expect(combined.count).to.equal(25600)
        expect(combined.absoluteCount).to.equal(combined.count)
    })
})
