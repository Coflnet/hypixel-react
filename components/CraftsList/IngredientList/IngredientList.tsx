import Image from 'next/image'
import { useState } from 'react'
import Number from '../../Number/Number'
import { Badge, ButtonGroup, OverlayTrigger, Popover, ToggleButton, Tooltip } from 'react-bootstrap'
import styles from './IngredientList.module.css'
import api from '../../../api/ApiHelper'
import { CopyButton } from '../../CopyButton/CopyButton'
import { AcquisitionMode, getAcquisitionPlan, getCraftSavings, numberWithThousandsSeparators } from '../../../utils/Formatter'

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

/** Human-readable per-unit price: whole coins with separators once it is large, else up to 2 decimals. */
function formatUnitPrice(price: number): string {
    if (price >= 100) {
        return numberWithThousandsSeparators(Math.round(price))
    }
    // strip trailing zeros from the 2-decimal form (12.60 -> 12.6, 12.00 -> 12)
    return String(Math.round(price * 100) / 100)
}

/**
 * A row in the acquisition breakdown, e.g. "Buy order  27,119 × 12.6  341,699". Only rendered when the
 * bucket actually contributes units.
 */
function BreakdownRow({ label, qty, unitPrice, cost }: { label: string; qty: number; unitPrice: number; cost: number }) {
    if (qty <= 0) {
        return null
    }
    return (
        <tr>
            <td style={{ paddingRight: 10 }}>{label}</td>
            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{numberWithThousandsSeparators(qty)}</td>
            <td style={{ textAlign: 'right', color: '#aaa', padding: '0 6px' }}>× {formatUnitPrice(unitPrice)}</td>
            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{numberWithThousandsSeparators(Math.round(cost))}</td>
        </tr>
    )
}

/**
 * The coins badge on an ingredient row. On click it opens a popover breaking down how the total amount
 * needed would realistically be acquired on the bazaar (npc stock -> buy order -> insta-buy), with a
 * toggle to switch between placing buy orders (patient, cheaper) and insta-buying everything (instant,
 * pricier). When there is no market data it is just a plain badge.
 */
function AcquisitionBadge({ ingredient, totalCount }: { ingredient: CraftingIngredient; totalCount: number }) {
    let [mode, setMode] = useState<AcquisitionMode>('order')

    let coinsBadge = (
        <Badge style={{ marginLeft: '5px' }} bg="secondary">
            <Number number={Math.round(ingredient.cost)} /> Coins
        </Badge>
    )

    let plan = getAcquisitionPlan(ingredient, totalCount, mode)
    if (!plan) {
        return coinsBadge
    }

    let popover = (
        <Popover id={`acquisition-plan-${ingredient.item.tag}`} style={{ maxWidth: 360 }}>
            <Popover.Header>Buy {numberWithThousandsSeparators(plan.totalCount)}× {ingredient.item.name}</Popover.Header>
            <Popover.Body onClick={e => e.stopPropagation()}>
                <ButtonGroup size="sm" style={{ marginBottom: 10 }}>
                    <ToggleButton
                        id={`acq-mode-order-${ingredient.item.tag}`}
                        type="radio"
                        variant={mode === 'order' ? 'primary' : 'outline-secondary'}
                        name={`acq-mode-${ingredient.item.tag}`}
                        value="order"
                        checked={mode === 'order'}
                        onChange={() => setMode('order')}
                    >
                        Buy orders
                    </ToggleButton>
                    <ToggleButton
                        id={`acq-mode-insta-${ingredient.item.tag}`}
                        type="radio"
                        variant={mode === 'insta' ? 'primary' : 'outline-secondary'}
                        name={`acq-mode-${ingredient.item.tag}`}
                        value="insta"
                        checked={mode === 'insta'}
                        onChange={() => setMode('insta')}
                    >
                        Insta-buy
                    </ToggleButton>
                </ButtonGroup>
                <table style={{ width: '100%', marginBottom: 8 }}>
                    <tbody>
                        <BreakdownRow label="NPC shop" qty={plan.npc.qty} unitPrice={plan.npc.unitPrice} cost={plan.npc.cost} />
                        <BreakdownRow label="Buy order" qty={plan.order.qty} unitPrice={plan.order.unitPrice} cost={plan.order.cost} />
                        <BreakdownRow label="Insta-buy" qty={plan.insta.qty} unitPrice={plan.insta.unitPrice} cost={plan.insta.cost} />
                        <tr style={{ borderTop: '1px solid #555' }}>
                            <td style={{ paddingTop: 4 }}>Total</td>
                            <td style={{ textAlign: 'right', color: '#aaa', paddingTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                                {numberWithThousandsSeparators(plan.npc.qty + plan.order.qty + plan.insta.qty)}
                            </td>
                            <td></td>
                            <td style={{ textAlign: 'right', paddingTop: 4, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                                ~{numberWithThousandsSeparators(Math.round(plan.totalCost))}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {plan.unmet > 0 && (
                    <div style={{ color: '#e0a800', marginBottom: 6 }}>
                        {numberWithThousandsSeparators(plan.unmet)} units have no listed offers - likely unobtainable right now.
                    </div>
                )}
                <small style={{ color: '#888' }}>
                    Estimated from the current order book.{' '}
                    {plan.order.qty > 0
                        ? `A competitive buy order fills up to ${numberWithThousandsSeparators(ingredient.buyOrderCapacity || 0)} units at ~${formatUnitPrice(
                              plan.order.unitPrice
                          )}/unit (~30 min). `
                        : ''}
                    {plan.insta.qty > 0
                        ? `Sell offers start at ~${formatUnitPrice(
                              plan.insta.unitPrice
                          )}/unit - the real insta cost climbs as you buy deeper into the book.`
                        : ''}
                </small>
            </Popover.Body>
        </Popover>
    )

    return (
        <OverlayTrigger trigger="click" rootClose placement="top" overlay={popover}>
            <span
                style={{ cursor: 'pointer' }}
                onClick={e => {
                    e.stopPropagation()
                }}
            >
                {coinsBadge}
            </span>
        </OverlayTrigger>
    )
}

export function IngredientList(props: Props) {
    let multiplier = props.multiplier || 1

    return (
        <div>
            {props.ingredients.map((ingredient, i) => {
                let totalCount = ingredient.count * multiplier
                let copyCommand = getCopyCommand(ingredient, props.instructions)
                let { craftSavingsPercent } = getCraftSavings(ingredient)

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
                            <AcquisitionBadge ingredient={ingredient} totalCount={totalCount} />
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
                                <OverlayTrigger overlay={<Tooltip id={`copy-bz-${ingredient.item.tag}`}>Copy the bazaar search command</Tooltip>}>
                                    <span>
                                        <CopyButton
                                            buttonVariant="secondary"
                                            buttonClass={styles.copyButton}
                                            copyValue={copyCommand}
                                            successMessage={<span>Copied {copyCommand}</span>}
                                        />
                                    </span>
                                </OverlayTrigger>
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
