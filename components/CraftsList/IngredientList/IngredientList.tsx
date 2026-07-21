import Image from 'next/image'
import Number from '../../Number/Number'
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import styles from './IngredientList.module.css'
import api from '../../../api/ApiHelper'
import { CopyButton } from '../../CopyButton/CopyButton'
import { getCraftSavings, getAcquisitionPlan, numberWithThousandsSeparators } from '../../../utils/Formatter'

interface Props {
    ingredients: CraftingIngredient[]
    onItemClick: (ingredient: CraftingIngredient) => void
    instructions?: CraftingInstructions
    // Cumulative product of ancestor counts down to this level (default 1 for the root call).
    // Multiplying it by an ingredient's own count gives the total actually needed to craft the item.
    multiplier?: number
}

/**
 * The backend only returns a copy command for the top-level recipe's direct ingredients
 * (CraftingInstructions.copyCommands is keyed by tag, one level deep). Deeper tree rows have no
 * entry there, so fall back to synthesising a bazaar command from the item's display name -
 * bazaar items are generally only crafted from other bazaar items. This is a stopgap: once the
 * backend (SkyApi) returns commands for the whole tree, every row will have a real entry and this
 * fallback quietly stops being used.
 */
function getCopyCommand(ingredient: CraftingIngredient, instructions?: CraftingInstructions): string {
    return instructions?.copyCommands?.[ingredient.item.tag] || `/bz ${ingredient.item.name}`
}

export function IngredientList(props: Props) {
    let multiplier = props.multiplier || 1

    return (
        <div>
            {props.ingredients.map((ingredient, i) => {
                let totalCount = ingredient.count * multiplier
                let copyCommand = getCopyCommand(ingredient, props.instructions)
                let { craftSavingsPercent } = getCraftSavings(ingredient)
                let plan = getAcquisitionPlan(ingredient, totalCount)

                let coinsBadge = (
                    <Badge style={{ marginLeft: '5px' }} bg="secondary">
                        <Number number={Math.round(ingredient.cost)} /> Coins
                    </Badge>
                )

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
                                src={api.getItemImageUrl(ingredient.item) || ''}
                                height="24"
                                width="24"
                                alt=""
                                style={{ marginRight: '5px' }}
                                loading="lazy"
                            />
                            {ingredient.item.name + ' (' + ingredient.count + 'x'}
                            {multiplier !== 1 ? (
                                <>
                                    {' → '}
                                    <Number number={Math.round(totalCount)} /> total
                                </>
                            ) : null}
                            {')'}
                            {plan ? (
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip id={`acquisition-plan-${ingredient.item.tag}`}>
                                            {plan.instaQty === 0 ? (
                                                <div>
                                                    Place a buy order for {Math.round(plan.orderQty)} — fills for ~
                                                    {numberWithThousandsSeparators(Math.round(plan.orderCost))} coins.
                                                </div>
                                            ) : plan.orderQty === 0 ? (
                                                <div>
                                                    Insta-buy all {Math.round(plan.instaQty)} for ~{numberWithThousandsSeparators(Math.round(plan.instaCost))} coins.
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        Buy order: {Math.round(plan.orderQty)} (~{numberWithThousandsSeparators(Math.round(plan.orderCost))} coins)
                                                    </div>
                                                    <div>
                                                        Insta-buy the rest: {Math.round(plan.instaQty)} (~{numberWithThousandsSeparators(Math.round(plan.instaCost))} coins)
                                                    </div>
                                                    <div>Expected total: ~{numberWithThousandsSeparators(Math.round(plan.totalCost))} coins.</div>
                                                </>
                                            )}
                                        </Tooltip>
                                    }
                                >
                                    {coinsBadge}
                                </OverlayTrigger>
                            ) : (
                                coinsBadge
                            )}
                            {ingredient.type === 'craft' && ingredient.ingredients && ingredient.ingredients.length > 0 && (
                                <Badge style={{ marginLeft: '5px' }} bg="info">
                                    {craftSavingsPercent > 0 ? `Should be crafted · saves ~${Math.round(craftSavingsPercent)}%` : 'Should be crafted'}
                                </Badge>
                            )}
                            <span
                                className={styles.copyButtonsWrapper}
                                onClick={e => {
                                    e.stopPropagation()
                                }}
                            >
                                <CopyButton
                                    buttonVariant="secondary"
                                    buttonClass={styles.copyButton}
                                    copyValue={copyCommand}
                                    successMessage={<span>Copied {copyCommand}</span>}
                                />
                                {Math.round(totalCount) >= 100 && (
                                    <CopyButton
                                        buttonVariant="secondary"
                                        buttonClass={styles.copyButton}
                                        copyValue={String(Math.round(totalCount))}
                                        buttonContent={<span style={{ marginLeft: 4 }}>{Math.round(totalCount)}</span>}
                                        successMessage={<span>Copied amount ({Math.round(totalCount)})</span>}
                                    />
                                )}
                            </span>
                        </div>

                        {ingredient.ingredients && (
                            <div key={ingredient.item.tag + i} style={{ marginLeft: '20px' }}>
                                <IngredientList
                                    ingredients={ingredient.ingredients}
                                    onItemClick={props.onItemClick}
                                    instructions={props.instructions}
                                    multiplier={totalCount}
                                />
                            </div>
                        )}
                    </>
                )
            })}
        </div>
    )
}
