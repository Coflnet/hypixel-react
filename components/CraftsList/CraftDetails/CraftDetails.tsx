'use client'
import { Badge } from 'react-bootstrap'
import Number from '../../Number/Number'
import { CraftingRecipe } from '../CraftingRecipe/CraftingRecipe'
import { CostBreakdown } from '../CostBreakdown/CostBreakdown'
import { useEffect, useState } from 'react'
import api from '../../../api/ApiHelper'
import { toVariantItemTag } from '../../../utils/Formatter'

interface Props {
    craft: ProfitableCraft
}

export function CraftDetails(props: Props) {
    let [instructions, setInstructions] = useState<CraftingInstructions>()
    let [ingredients, setIngredients] = useState(props.craft.ingredients)
    let [loadingPlan, setLoadingPlan] = useState(true)

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

    useEffect(() => {
        api.getCraftInstructions(props.craft.item.tag).then(instructions => {
            setInstructions(instructions)
        })
        setLoadingPlan(true)
        api.getCraftAcquisitionPlan(props.craft.item.tag)
            .then(plan => setIngredients(plan.ingredients.map(toIngredient)))
            .finally(() => setLoadingPlan(false))
    }, [props.craft.item.tag])

    function openItem(tag: string) {
        let detailsPath = instructions?.detailsPath?.[tag]
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
            <CostBreakdown ingredients={ingredients} sellPrice={props.craft.sellPrice} instructions={instructions} onItemClick={openIngredient} loading={loadingPlan} />
        </div>
    )
}
