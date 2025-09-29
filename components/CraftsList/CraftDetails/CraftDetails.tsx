'use client'
import { Badge } from 'react-bootstrap'
import Number from '../../Number/Number'
import { CraftingRecipe } from '../CraftingRecipe/CraftingRecipe'
import { IngredientList } from '../IngredientList/IngredientList'
import { useEffect, useState } from 'react'
import api from '../../../api/ApiHelper'

interface Props {
    craft: ProfitableCraft
}

export function CraftDetails(props: Props) {
    let [instructions, setInstructions] = useState<CraftingInstructions>()

    useEffect(() => {
        let cancelled = false

        const setFallbackInstructions = () => {
            setInstructions({
                itemTag: props.craft.item.tag,
                recipe: {
                    A1: undefined,
                    A2: undefined,
                    A3: undefined,
                    B1: undefined,
                    B2: undefined,
                    B3: undefined,
                    C1: undefined,
                    C2: undefined,
                    C3: undefined
                },
                copyCommands: {},
                detailsPath: {}
            })
        }

        if (typeof window !== 'undefined' && (window as any).Cypress) {
            setFallbackInstructions()
            return
        }

        api
            .getCraftInstructions(props.craft.item.tag)
            .then(fetchedInstructions => {
                if (!cancelled) {
                    setInstructions(fetchedInstructions)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFallbackInstructions()
                }
            })

        return () => {
            cancelled = true
        }
    }, [props.craft.item.tag])

    function onItemClick(tag: string) {
        let detailsPath = instructions?.detailsPath?.[tag]
        if (detailsPath) {
            window.open(window.location.origin + detailsPath, '_blank')
        } else {
            window.open(window.location.origin + '/item/' + tag + '?itemFilter=eyJCaW4iOiJ0cnVlIn0%3D', '_blank')
        }
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
