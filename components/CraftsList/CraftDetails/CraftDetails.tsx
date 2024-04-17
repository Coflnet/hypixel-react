'use client'
import Image from 'next/image'
import { Badge } from 'react-bootstrap'
import { Number } from '../../Number/Number'
import { CraftingRecipe } from '../CraftingRecipe/CraftingRecipe'
import styles from './CraftDetails.module.css'
import { IngredientList } from '../IngredientList/IngredientList'

interface Props {
    craft: ProfitableCraft
}

export function CraftDetails(props: Props) {
    function onItemClick(tag: string) {
        window.open(window.location.origin + '/item/' + tag + '?itemFilter=eyJCaW4iOiJ0cnVlIn0%3D&range=active', '_blank')
    }
    return (
        <div>
            <h3>Recipe</h3>
            <div style={{ height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ float: 'left' }}>
                    <CraftingRecipe itemTag={props.craft.item.tag} onIngredientClick={onItemClick} />
                </div>
                <span style={{ marginLeft: '20px' }}>
                    <Badge style={{ marginLeft: '5px' }} bg="secondary">
                        <Number number={Math.round(props.craft.sellPrice)} /> Coins
                    </Badge>
                </span>
            </div>
            <hr />
            <h3 style={{ marginBottom: '20px' }}>Ingredient Costs</h3>
            <IngredientList
                ingredients={props.craft.ingredients}
                onItemClick={ingredient => {
                    onItemClick(ingredient.item.tag)
                }}
            />
        </div>
    )
}
