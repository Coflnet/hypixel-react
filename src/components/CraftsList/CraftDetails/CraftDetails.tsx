import React from 'react';
import { numberWithThousandsSeperators } from '../../../utils/Formatter';
import { CraftingRecipe } from '../CraftingRecipe/CraftingRecipe';
import './CraftDetails.css'
import { Badge } from 'react-bootstrap';

interface Props {
    craft: ProfitableCraft
}

export function CraftDetails(props: Props) {

    function onItemClick(tag: string) {
        window.open(window.location.origin + "/item/" + tag + "?itemFilter=eyJCaW4iOiJ0cnVlIn0%3D&range=active", '_blank');
    }
    return (
        <div className="craft-details">
            <h3>Recipe</h3>
            <div style={{ height: "170px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{ float: "left" }}>
                    <CraftingRecipe itemTag={props.craft.item.tag} onIngredientClick={onItemClick} />
                </div>
                <span style={{ marginLeft: "20px" }}><Badge style={{ marginLeft: "5px" }} variant="secondary">{numberWithThousandsSeperators(Math.round(props.craft.sellPrice))} Coins</Badge></span>
            </div>
            <hr />
            <h3 style={{ marginBottom: "20px" }}>Ingredience Costs</h3>
            {
                props.craft.ingredients.map(ingredient => {
                    return <div key={ingredient.item.tag} className="ingredients-wrapper" onClick={() => { onItemClick(ingredient.item.tag) }}>
                        <img crossOrigin="anonymous" src={ingredient.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        {ingredient.item.name + " (" + ingredient.count + "x)"}
                        <Badge style={{ marginLeft: "5px" }} variant="secondary">{numberWithThousandsSeperators(Math.round(ingredient.cost))} Coins</Badge>
                    </div>
                })
            }
        </div>
    )
}