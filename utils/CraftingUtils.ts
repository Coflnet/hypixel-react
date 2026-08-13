import { AcquisitionMode, getAcquisitionPlan } from './Formatter'

export function getIngredientPath(parentPath: string, index: number, tag: string) {
    return `${parentPath}${parentPath ? '/' : ''}${index}:${tag}`
}

export function getMaxCraftDepth(ingredients: CraftingIngredient[]): number {
    return ingredients.reduce((maxDepth, ingredient) => {
        const childDepth = ingredient.ingredients?.length ? 1 + getMaxCraftDepth(ingredient.ingredients) : 0
        return Math.max(maxDepth, childDepth)
    }, 0)
}

export function limitCraftDepth(ingredients: CraftingIngredient[], depth: number): CraftingIngredient[] {
    return ingredients.map(ingredient => {
        if (!ingredient.ingredients?.length) {
            return ingredient
        }
        if (depth <= 0) {
            return {
                ...ingredient,
                cost: ingredient.buyOrderCost && ingredient.buyOrderCost > 0 ? ingredient.buyOrderCost : ingredient.cost,
                ingredients: undefined
            }
        }
        return { ...ingredient, ingredients: limitCraftDepth(ingredient.ingredients, depth - 1) }
    })
}

export function getDirectBuyCost(ingredient: CraftingIngredient, totalCount: number, mode: AcquisitionMode = 'order') {
    if (ingredient.acquisitionPlan && ingredient.acquisitionPlan.directBuyEnough) {
        return ingredient.acquisitionPlan.directBuyCost
    }
    const plan = getAcquisitionPlan(ingredient, totalCount, mode)
    if (plan && plan.unmet === 0) {
        return plan.totalCost
    }
    return (ingredient.buyOrderCost && ingredient.buyOrderCost > 0 ? ingredient.buyOrderCost : ingredient.cost) * (totalCount / Math.max(1, ingredient.count))
}

export function getCombinedShoppingList(
    ingredients: CraftingIngredient[],
    collapsedPaths: Set<string> = new Set(),
    mode: AcquisitionMode = 'order'
): CraftingIngredient[] {
    const combined = new Map<string, CraftingIngredient>()

    function addIngredients(items: CraftingIngredient[], multiplier = 1, parentPath = '') {
        items.forEach((ingredient, index) => {
            const path = getIngredientPath(parentPath, index, ingredient.item.tag)
            const totalCount = ingredient.absoluteCount ?? ingredient.count * multiplier
            if (ingredient.acquisitionPlan) {
                const purchased = ingredient.acquisitionPlan.purchases ?? []
                const purchasedCount = purchased.reduce((total, fill) => total + fill.quantity, 0)
                const purchasedCost = purchased.reduce((total, fill) => total + fill.cost, 0)
                if (purchasedCount > 0) {
                    const existing = combined.get(ingredient.item.tag)
                    if (existing) {
                        existing.count += purchasedCount
                        existing.absoluteCount = existing.count
                        existing.cost += purchasedCost
                        if (existing.acquisitionPlan) {
                            existing.acquisitionPlan = {
                                ...existing.acquisitionPlan,
                                quantity: existing.count,
                                cost: existing.cost,
                                directBuyCost: existing.cost,
                                purchases: [...existing.acquisitionPlan.purchases, ...purchased]
                            }
                        }
                    } else {
                        combined.set(ingredient.item.tag, {
                            ...ingredient,
                            count: purchasedCount,
                            absoluteCount: purchasedCount,
                            cost: purchasedCost,
                            type: undefined,
                            ingredients: undefined,
                            acquisitionPlan: {
                                ...ingredient.acquisitionPlan,
                                quantity: purchasedCount,
                                cost: purchasedCost,
                                directBuyCost: purchasedCost,
                                directBuyEnough: true,
                                craftCost: 0,
                                craftEnough: false,
                                craftedQuantity: 0,
                                purchases: purchased,
                                ingredients: []
                            }
                        })
                    }
                }
                if (ingredient.ingredients?.length) {
                    addIngredients(ingredient.ingredients, 1, path)
                }
                return
            }
            if (ingredient.ingredients?.length && !collapsedPaths.has(path)) {
                addIngredients(ingredient.ingredients, totalCount, path)
                return
            }

            const existing = combined.get(ingredient.item.tag)
            const scaledCost = getDirectBuyCost(ingredient, totalCount, mode)
            if (existing) {
                existing.count += totalCount
                existing.absoluteCount = existing.count
                existing.cost += scaledCost
                return
            }

            combined.set(ingredient.item.tag, {
                ...ingredient,
                count: totalCount,
                cost: scaledCost,
                type: undefined,
                ingredients: undefined
            })
        })
    }

    addIngredients(ingredients)
    return Array.from(combined.values())
        .map(ingredient => {
            if (ingredient.acquisitionPlan) {
                return ingredient
            }
            const plan = getAcquisitionPlan(ingredient, ingredient.count, mode)
            return plan && plan.unmet === 0 ? { ...ingredient, cost: plan.totalCost } : ingredient
        })
        .sort((a, b) => (a.item.name ?? a.item.tag).localeCompare(b.item.name ?? b.item.tag))
}

export function getShoppingListCost(ingredients: CraftingIngredient[]) {
    return ingredients.reduce((total, ingredient) => total + ingredient.cost, 0)
}
