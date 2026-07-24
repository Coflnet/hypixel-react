'use client'

import { useState } from 'react'
import { Alert, Form } from 'react-bootstrap'
import NumberElement from '../../Number/Number'
import { getCombinedShoppingList, getMaxCraftDepth, getShoppingListCost, limitCraftDepth } from '../../../utils/CraftingUtils'
import { IngredientList } from '../IngredientList/IngredientList'
import styles from './CostBreakdown.module.css'

interface Props {
    ingredients: CraftingIngredient[]
    sellPrice: number
    onItemClick: (ingredient: CraftingIngredient) => void
    instructions?: CraftingInstructions
    loading?: boolean
    noWait?: boolean
    onNoWaitChange?: (noWait: boolean) => void
}

export function CostBreakdown({ ingredients, sellPrice, onItemClick, instructions, loading, noWait: controlledNoWait, onNoWaitChange }: Props) {
    const [selectedDepth, setSelectedDepth] = useState<number>()
    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set())
    const [localNoWait, setLocalNoWait] = useState(false)
    const noWait = controlledNoWait ?? localNoWait
    const maxDepth = getMaxCraftDepth(ingredients)
    const depth = Math.min(selectedDepth ?? maxDepth, maxDepth)
    const displayedIngredients = limitCraftDepth(ingredients, depth)
    const acquisitionMode = noWait ? 'insta' : 'order'
    const shoppingList = getCombinedShoppingList(displayedIngredients, collapsedPaths, acquisitionMode)
    const inputCost = getShoppingListCost(shoppingList)
    const profit = sellPrice - inputCost

    function toggleIngredient(path: string) {
        setCollapsedPaths(current => {
            const next = new Set(current)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    return (
        <div>
            <div className={styles.summary}>
                <div>
                    <span>Selected input cost</span>
                    <strong>
                        <NumberElement number={Math.round(inputCost)} /> Coins
                    </strong>
                </div>
                <div>
                    <span>Potential profit</span>
                    <strong>
                        <NumberElement number={Math.round(profit)} /> Coins
                    </strong>
                </div>
            </div>
            <div className={styles.noWaitControl}>
                <Form.Check
                    type="switch"
                    id="modal-no-wait-costs"
                    label="No-wait mode — use NPC + insta-buy costs"
                    checked={noWait}
                    onChange={event => {
                        if (controlledNoWait === undefined) {
                            setLocalNoWait(event.target.checked)
                        }
                        onNoWaitChange?.(event.target.checked)
                    }}
                />
                <small>Uses immediately available NPC stock first, then sell offers for the remainder. Buy orders are skipped.</small>
            </div>
            {maxDepth > 1 ? (
                <>
                    <div className={styles.depthControl}>
                        <Form.Label>Maximum craft depth: {depth}</Form.Label>
                        <Form.Range min={0} max={maxDepth} value={depth} onChange={event => setSelectedDepth(Number(event.target.value))} />
                        <small>{depth === 0 ? 'Buy direct inputs.' : `Expand up to ${depth} craft levels before buying.`}</small>
                    </div>
                    <hr />
                </>
            ) : null}
            <h3>Combined shopping list</h3>
            <p className={styles.help}>Duplicate materials are summed so each item can be purchased in one order.</p>
            {loading ? <p className={styles.loading}>Loading cheaper subcraft options…</p> : null}
            {shoppingList.length ? (
                <IngredientList ingredients={shoppingList} instructions={instructions} onItemClick={onItemClick} acquisitionMode={acquisitionMode} />
            ) : (
                <Alert variant="secondary">No ingredient breakdown is available.</Alert>
            )}
            {displayedIngredients.length ? (
                <>
                    <hr />
                    <h3>Recipe breakdown</h3>
                    <p className={styles.help}>Collapse a craft to buy it directly, or expand it to use the cheaper subcraft ingredients.</p>
                    <IngredientList
                        ingredients={displayedIngredients}
                        instructions={instructions}
                        onItemClick={onItemClick}
                        collapsedPaths={collapsedPaths}
                        onToggleIngredient={toggleIngredient}
                        acquisitionMode={acquisitionMode}
                    />
                </>
            ) : null}
        </div>
    )
}
