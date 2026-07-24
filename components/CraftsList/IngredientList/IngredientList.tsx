import Image from 'next/image'
import { Fragment, useEffect, useId, useState } from 'react'
import Number from '../../Number/Number'
import { Badge, Button, ButtonGroup, OverlayTrigger, Popover, ToggleButton, Tooltip } from 'react-bootstrap'
import styles from './IngredientList.module.css'
import api from '../../../api/ApiHelper'
import { CopyButton } from '../../CopyButton/CopyButton'
import { AcquisitionMode, getAcquisitionPlan, numberWithThousandsSeparators } from '../../../utils/Formatter'
import { getDirectBuyCost, getIngredientPath } from '../../../utils/CraftingUtils'

interface Props {
    ingredients: CraftingIngredient[]
    onItemClick: (ingredient: CraftingIngredient) => void
    instructions?: CraftingInstructions
    // Cumulative product of ancestor counts down to this level (default 1 for the root call).
    // Multiplying it by an ingredient's own count gives the total actually needed to craft the item.
    multiplier?: number
    collapsedPaths?: Set<string>
    onToggleIngredient?: (path: string) => void
    pathPrefix?: string
    acquisitionMode?: AcquisitionMode
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
function BreakdownRow({ label, qty, unitPrice, cost, emptyLabel }: { label: string; qty: number; unitPrice: number; cost: number; emptyLabel?: string }) {
    if (qty <= 0) {
        return emptyLabel ? (
            <tr>
                <td style={{ paddingRight: 10 }}>{label}</td>
                <td colSpan={3} style={{ textAlign: 'right', color: '#888' }}>
                    {emptyLabel}
                </td>
            </tr>
        ) : null
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
 * needed would realistically be acquired (NPC stock -> buy order -> insta-buy), with a toggle to switch
 * between placing buy orders (patient, cheaper) and using NPC stock plus insta-buying the remainder
 * (instant, pricier). When there is no market data it is just a plain badge.
 */
function AcquisitionBadge({ ingredient, totalCount, preferredMode }: { ingredient: CraftingIngredient; totalCount: number; preferredMode: AcquisitionMode }) {
    let id = useId()
    let [mode, setMode] = useState<AcquisitionMode>(preferredMode)
    let plan = getAcquisitionPlan(ingredient, totalCount, mode)
    let displayedCost = plan && plan.unmet === 0 ? plan.totalCost : ingredient.cost * (totalCount / Math.max(1, ingredient.count))

    useEffect(() => {
        setMode(preferredMode)
    }, [preferredMode])

    let coinsBadge = (
        <Badge style={{ marginLeft: '5px' }} bg="secondary">
            <Number number={Math.round(displayedCost)} /> Coins
        </Badge>
    )

    if (!plan) {
        return coinsBadge
    }

    let popover = (
        <Popover id={`acquisition-plan-${id}`} style={{ maxWidth: 360 }}>
            <Popover.Header>
                Buy {numberWithThousandsSeparators(plan.totalCount)}× {ingredient.item.name}
            </Popover.Header>
            <Popover.Body onClick={e => e.stopPropagation()}>
                <ButtonGroup size="sm" style={{ marginBottom: 10 }}>
                    <ToggleButton
                        id={`acq-mode-order-${id}`}
                        type="radio"
                        variant={mode === 'order' ? 'primary' : 'outline-secondary'}
                        name={`acq-mode-${id}`}
                        value="order"
                        checked={mode === 'order'}
                        onChange={() => setMode('order')}
                    >
                        NPC + buy orders (~30 min)
                    </ToggleButton>
                    <ToggleButton
                        id={`acq-mode-insta-${id}`}
                        type="radio"
                        variant={mode === 'insta' ? 'primary' : 'outline-secondary'}
                        name={`acq-mode-${id}`}
                        value="insta"
                        checked={mode === 'insta'}
                        onChange={() => setMode('insta')}
                    >
                        NPC + insta-buy
                    </ToggleButton>
                </ButtonGroup>
                <table style={{ width: '100%', marginBottom: 8 }}>
                    <tbody>
                        <BreakdownRow
                            label="NPC shop"
                            qty={plan.npc.qty}
                            unitPrice={plan.npc.unitPrice}
                            cost={plan.npc.cost}
                            emptyLabel={ingredient.npcCapacity ? 'Not needed' : 'Not available'}
                        />
                        <BreakdownRow
                            label="Buy order (~30 min)"
                            qty={plan.order.qty}
                            unitPrice={plan.order.unitPrice}
                            cost={plan.order.cost}
                            emptyLabel={mode === 'insta' ? 'Skipped' : ingredient.buyOrderCapacity ? 'Not needed' : 'Not available'}
                        />
                        <BreakdownRow label="Insta-buy (weighted)" qty={plan.insta.qty} unitPrice={plan.insta.unitPrice} cost={plan.insta.cost} />
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
                    The buy-order price uses the lower competitive market estimate. The insta-buy price uses the higher volume-weighted sell-offer estimate,
                    which represents Σ(quantity × price) ÷ total quantity across the order book instead of only the cheapest visible offer.{' '}
                    {plan.order.qty > 0
                        ? `Up to ${numberWithThousandsSeparators(
                              ingredient.buyOrderCapacity || 0
                          )} units are expected to fill through a competitive buy order in about 30 minutes. `
                        : ''}
                    {plan.insta.qty > 0
                        ? `The weighted instant estimate is ~${formatUnitPrice(plan.insta.unitPrice)}/unit and can move as the order book changes.`
                        : ''}
                </small>
            </Popover.Body>
        </Popover>
    )

    return (
        <OverlayTrigger trigger="click" rootClose placement="top" overlay={popover}>
            <Button
                size="sm"
                variant="outline-info"
                className={styles.costButton}
                onClick={e => {
                    e.stopPropagation()
                }}
            >
                <Number number={Math.round(displayedCost)} /> Coins · Compare costs
            </Button>
        </OverlayTrigger>
    )
}

export function IngredientList(props: Props) {
    let multiplier = props.multiplier || 1
    let acquisitionMode = props.acquisitionMode ?? 'order'

    return (
        <div>
            {props.ingredients.map((ingredient, i) => {
                let totalCount = ingredient.count * multiplier
                let copyCommand = getCopyCommand(ingredient, props.instructions)
                let path = getIngredientPath(props.pathPrefix ?? '', i, ingredient.item.tag)
                let canCollapse = Boolean(ingredient.type === 'craft' && ingredient.ingredients?.length && props.onToggleIngredient)
                let collapsed = canCollapse && props.collapsedPaths?.has(path)
                let directBuyCost = getDirectBuyCost(ingredient, totalCount, acquisitionMode)
                let subcraftCost = (ingredient.craftCost ?? ingredient.cost) * multiplier
                let craftSavings = Math.max(0, directBuyCost - subcraftCost)
                let craftSavingsPercent = directBuyCost > 0 ? (craftSavings / directBuyCost) * 100 : 0

                return (
                    <Fragment key={path}>
                        <div
                            className={styles.ingredientsWrapper}
                            data-ingredient-type={ingredient.type === 'craft' || ingredient.ingredients?.length ? 'craft' : 'item'}
                            data-ingredient-tag={ingredient.item.tag}
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
                            <AcquisitionBadge ingredient={ingredient} totalCount={totalCount} preferredMode={acquisitionMode} />
                            {ingredient.type === 'craft' && ingredient.ingredients && ingredient.ingredients.length > 0 && (
                                <Badge style={{ marginLeft: '5px' }} bg="info">
                                    Buy directly: <Number number={Math.round(directBuyCost)} /> Coins
                                </Badge>
                            )}
                            {canCollapse && craftSavings > 0 ? (
                                <Badge style={{ marginLeft: '5px' }} bg="success">
                                    Subcraft saves <Number number={Math.round(craftSavings)} /> Coins (~{Math.round(craftSavingsPercent)}%)
                                </Badge>
                            ) : null}
                            {canCollapse ? (
                                <Button
                                    size="sm"
                                    variant={collapsed ? 'outline-secondary' : 'outline-info'}
                                    className={styles.collapseButton}
                                    aria-expanded={!collapsed}
                                    onClick={event => {
                                        event.stopPropagation()
                                        props.onToggleIngredient?.(path)
                                    }}
                                >
                                    {collapsed ? '▸ Buying directly' : '▾ Subcrafting'}
                                </Button>
                            ) : null}
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

                        {ingredient.ingredients && !collapsed && (
                            <div style={{ marginLeft: '20px' }}>
                                <IngredientList
                                    ingredients={ingredient.ingredients}
                                    onItemClick={props.onItemClick}
                                    instructions={props.instructions}
                                    multiplier={totalCount}
                                    collapsedPaths={props.collapsedPaths}
                                    onToggleIngredient={props.onToggleIngredient}
                                    pathPrefix={path}
                                    acquisitionMode={acquisitionMode}
                                />
                            </div>
                        )}
                    </Fragment>
                )
            })}
        </div>
    )
}
