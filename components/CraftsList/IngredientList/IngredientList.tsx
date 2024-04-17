import Image from 'next/image'
import { Number } from '../../Number/Number'
import { Badge, Container } from 'react-bootstrap'
import styles from './IngredientList.module.css'

interface Props {
    ingredients: CraftingIngredient[]
    onItemClick: (ingredient: CraftingIngredient) => void
}

export function IngredientList(props: Props) {
    return (
        <div>
            {props.ingredients.map(ingredient => {
                return (
                    <>
                        <div
                            key={ingredient.item.tag}
                            className={styles.ingredientsWrapper}
                            onClick={() => {
                                props.onItemClick(ingredient)
                            }}
                        >
                            <Image
                                crossOrigin="anonymous"
                                src={ingredient.item.iconUrl || ''}
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
                            {ingredient.type === 'craft' && (
                                <Badge style={{ marginLeft: '5px' }} bg="info">
                                    Should be crafted
                                </Badge>
                            )}
                        </div>

                        {ingredient.ingredients && (
                            <div style={{ marginLeft: '20px' }}>
                                <IngredientList ingredients={ingredient.ingredients} onItemClick={props.onItemClick} />
                            </div>
                        )}
                    </>
                )
            })}
        </div>
    )
}
