'use client'
import { Alert, Badge } from 'react-bootstrap'
import Number from '../../Number/Number'
import { CraftingRecipe } from '../CraftingRecipe/CraftingRecipe'
import { CostBreakdown } from '../CostBreakdown/CostBreakdown'
import { toVariantItemTag } from '../../../utils/Formatter'

interface Props {
    craft: ProfitableCraft
    instructions?: CraftingInstructions
    plan?: CraftAcquisitionPlan
    loading: boolean
    planError: boolean
}

export function CraftDetails(props: Props) {
    function toIngredient(plan: CraftAcquisitionPlan): CraftingIngredient {
        return {
            item: { tag: plan.itemId, name: plan.itemId.replaceAll('_', ' ') } as Item,
            count: plan.quantity,
            absoluteCount: plan.quantity,
            cost: plan.cost,
            type: plan.craftedQuantity > 0 ? 'craft' : undefined,
            buyOrderCost: plan.directBuyCost,
            craftCost: plan.craftCost,
            acquisitionPlan: plan,
            ingredients: plan.ingredients?.map(toIngredient)
        }
    }
    const ingredients = props.plan ? props.plan.ingredients.map(toIngredient) : props.craft.ingredients

    function openItem(tag: string) {
        let detailsPath = props.instructions?.detailsPath?.[tag]
        if (detailsPath) {
            window.open(window.location.origin + detailsPath, '_blank')
        } else {
            window.open(window.location.origin + '/item/' + toVariantItemTag(tag) + '?itemFilter=eyJCaW4iOiJ0cnVlIn0%3D', '_blank')
        }
    }

    function openIngredient(ingredient: CraftingIngredient) {
        if (ingredient.type === 'craft' || ingredient.ingredients?.length) {
            window.open(`${window.location.origin}/crafts?craft=${encodeURIComponent(ingredient.item.tag)}`, '_blank')
            return
        }
        openItem(ingredient.item.tag)
    }
    return (
        <div>
            <h3>Recipe</h3>
            <div style={{ height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ float: 'left' }}>
                    <CraftingRecipe itemTag={props.craft.item.tag} onIngredientClick={openItem} />
                </div>
                <span style={{ marginLeft: '20px' }}>
                    <Badge style={{ marginLeft: '5px' }} bg="secondary">
                        <Number number={Math.round(props.craft.sellPrice)} /> Coins
                    </Badge>
                </span>
            </div>
            <hr />
            {props.planError ? <Alert variant="warning">Live acquisition data is unavailable; showing the cached craft estimate.</Alert> : null}
            <CostBreakdown ingredients={ingredients} sellPrice={props.craft.sellPrice} instructions={props.instructions} onItemClick={openIngredient} loading={props.loading} />
        </div>
    )
}
