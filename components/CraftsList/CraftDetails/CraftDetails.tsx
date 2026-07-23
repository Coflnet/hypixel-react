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

    useEffect(() => {
        api.getCraftInstructions(props.craft.item.tag).then(instructions => {
            setInstructions(instructions)
        })
    }, [])

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
            <CostBreakdown ingredients={props.craft.ingredients} sellPrice={props.craft.sellPrice} instructions={instructions} onItemClick={openIngredient} />
        </div>
    )
}
