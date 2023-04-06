import Image from 'next/image'
import { Badge } from 'react-bootstrap'
import { Number } from '../../Number/Number'
import { CraftingRecipe } from '../CraftingRecipe/CraftingRecipe'
import styles from './CraftDetails.module.css'

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
            <h3 style={{ marginBottom: '20px' }}>Ingredience Costs</h3>
            {props.craft.ingredients.map(ingredient => {
                return (
                    <div
                        key={ingredient.item.tag}
                        className={styles.ingredientsWrapper}
                        onClick={() => {
                            onItemClick(ingredient.item.tag)
                        }}
                    >
                        <Image
                            crossOrigin="anonymous"
                            src={ingredient.item.iconUrl}
                            height="24"
                            width="24"
                            alt=""
                            style={{ marginRight: '5px' }}
                            loading="lazy"
                        />
                        {ingredient.item.name + ' (' + ingredient.count + 'x)'}
                        <Badge style={{ marginLeft: '5px' }} bg="secondary">
                            <Number number={Math.round(ingredient.cost)} /> Coins
                        </Badge>
                    </div>
                )
            })}
        </div>
    )
}
