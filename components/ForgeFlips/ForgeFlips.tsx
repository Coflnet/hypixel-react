'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { Alert, Badge, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import NumberElement from '../Number/Number'
import { convertTagToName, toVariantItemTag } from '../../utils/Formatter'
import { useGetApiCraftProfit, useGetApiFlipForge } from '../../api/_generated/skyApi'
import { ForgeFlip, ProfitableCraft as GeneratedProfitableCraft } from '../../api/_generated/skyApi.schemas'
import { getGeneratedApiErrorMessage, hasSuccessfulArrayResponse } from '../../utils/GeneratedApiResponseUtils'
import { parseProfitableCrafts } from '../../utils/Parser/APIResponseParser'
import { CostBreakdown } from '../CraftsList/CostBreakdown/CostBreakdown'
import Tooltip from '../Tooltip/Tooltip'
import styles from './ForgeFlips.module.css'

const SORT_OPTIONS: SortOption<ForgeFlip>[] = [
    {
        label: 'Profit / hour',
        value: 'profitPerHour',
        sortFunction: items => items.sort((a, b) => b.profitPerHour - a.profitPerHour)
    },
    {
        label: 'Duration',
        value: 'duration',
        sortFunction: items => items.sort((a, b) => a.duration - b.duration)
    },
    {
        label: 'Required HotM',
        value: 'hotm',
        sortFunction: items => items.sort((a, b) => a.requiredHotMLevel - b.requiredHotMLevel)
    },
    {
        label: 'Median profit',
        value: 'median',
        sortFunction: items => items.sort((a, b) => getCraftProfit(b.craftData) - getCraftProfit(a.craftData))
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: items => items.sort((a, b) => (b.craftData?.volume ?? 0) - (a.craftData?.volume ?? 0))
    }
]

function getCraftProfit(craft?: GeneratedProfitableCraft | null) {
    if (!craft) {
        return 0
    }
    return craft.sellPrice - craft.craftCost
}

function formatDuration(seconds: number) {
    // API provides duration in seconds. Convert to minutes/hours/days for display.
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return 'Unknown'
    }
    const minutes = seconds / 60
    const hours = minutes / 60

    if (minutes < 1) {
        return `${Math.round(seconds)} s`
    }

    if (hours < 1) {
        return `${Math.round(minutes)} min`
    }

    const days = hours / 24
    if (days >= 1) {
        return `${days.toFixed(days >= 2 ? 0 : 1)} d`
    }

    return `${hours.toFixed(hours >= 10 ? 0 : 1)} h`
}

function getForgeOutputTag(flip: ForgeFlip): string | null {
    return flip.craftData?.itemId ?? flip.craftData?.itemName ?? null
}

function getOutputName(flip: ForgeFlip) {
    const tag = flip.craftData?.itemId
    if (tag) {
        return convertTagToName(tag)
    }
    return flip.craftData?.itemName ?? 'Unknown item'
}

function renderRequirements(requirements: ForgeFlip['requirements']) {
    if (!requirements || Object.keys(requirements).length === 0) {
        return null
    }
    return (
        <div className={styles.requirements}>
            {Object.entries(requirements).map(([key, value]) => (
                <Badge key={key} bg="secondary">
                    {convertTagToName(key)}: {value}
                </Badge>
            ))}
        </div>
    )
}

function getForgeHeader(flip: ForgeFlip) {
    const tag = getForgeOutputTag(flip)
    const imageUrl = tag ? api.getItemImageUrl({ tag }) : null
    return (
        <span className={styles.header}>
            {imageUrl ? <Image src={imageUrl} alt="" width={32} height={32} loading="lazy" crossOrigin="anonymous" /> : null}
            {getOutputName(flip)}
        </span>
    )
}

function renderForgeFlip(flip: ForgeFlip) {
    const craft = flip.craftData
    const profit = getCraftProfit(craft)

    return (
        <>
            <h4>{getForgeHeader(flip)}</h4>
            <div className={styles.metricGrid}>
                <div className={styles.primaryMetric}>
                    <span>Profit / hour</span>
                    <strong>
                        <NumberElement number={Math.round(flip.profitPerHour)} /> Coins
                    </strong>
                </div>
                <div className={styles.primaryMetric}>
                    <span>Forge profit</span>
                    <strong>
                        <NumberElement number={Math.round(profit)} /> Coins
                    </strong>
                </div>
                <div>
                    <span>Input cost</span>
                    <strong>
                        <NumberElement number={Math.round(craft?.craftCost ?? 0)} /> Coins
                    </strong>
                </div>
                <div>
                    <span>Sell price</span>
                    <strong>
                        <NumberElement number={Math.round(craft?.sellPrice ?? 0)} /> Coins
                    </strong>
                </div>
                <div>
                    <span>Duration</span>
                    <strong>{formatDuration(flip.duration)}</strong>
                </div>
                <div>
                    <span>Volume</span>
                    <strong>
                        <NumberElement number={Math.round(craft?.volume ?? 0)} />
                    </strong>
                </div>
            </div>
            <div className={styles.hotm}>Heart of the Mountain {flip.requiredHotMLevel}</div>
            {renderRequirements(flip.requirements)}
        </>
    )
}

function ForgeDetails({
    flip,
    craft,
    isLoadingSubcrafts,
    noWait,
    onNoWaitChange
}: {
    flip: ForgeFlip
    craft?: ProfitableCraft
    isLoadingSubcrafts: boolean
    noWait: boolean
    onNoWaitChange: (noWait: boolean) => void
}) {
    const openIngredient = (ingredient: CraftingIngredient) => {
        if (ingredient.type === 'craft' || ingredient.ingredients?.length) {
            window.open(`/crafts?craft=${encodeURIComponent(ingredient.item.tag)}`, '_blank')
            return
        }
        window.open(`/item/${toVariantItemTag(ingredient.item.tag)}?itemFilter=eyJCaW4iOiJ0cnVlIn0%3D`, '_blank')
    }

    return (
        <div className={styles.details}>
            <div className={styles.detailsSummary}>
                <div>
                    <span>Median sell price</span>
                    <strong>
                        <NumberElement number={Math.round(flip.craftData?.sellPrice ?? 0)} /> Coins
                    </strong>
                </div>
                <div>
                    <span>Forge time</span>
                    <strong>{formatDuration(flip.duration)}</strong>
                </div>
            </div>
            <div className={styles.detailsRequirements}>
                <Badge bg="secondary">Heart of the Mountain {flip.requiredHotMLevel}</Badge>
                {renderRequirements(flip.requirements)}
            </div>
            <hr />
            <CostBreakdown
                ingredients={craft?.ingredients ?? []}
                sellPrice={flip.craftData?.sellPrice ?? 0}
                onItemClick={openIngredient}
                loading={isLoadingSubcrafts}
                noWait={noWait}
                onNoWaitChange={onNoWaitChange}
            />
        </div>
    )
}

function filterFunction(flip: ForgeFlip, nameFilter: string | null | undefined, minimumProfit: number) {
    const nameMatch = !nameFilter || getOutputName(flip).toLowerCase().includes(nameFilter.toLowerCase())
    const profitMatch = getCraftProfit(flip.craftData) >= minimumProfit
    return nameMatch && profitMatch
}

function hasNoWaitInputs(flip: ForgeFlip, forgeTags: Set<string>) {
    return (
        flip.craftData?.ingredients?.length &&
        flip.craftData.ingredients.every(ingredient => {
            const hasInstantSource =
                (ingredient.buyOrderUnitPrice ?? 0) > 0 ||
                (ingredient.instaBuyUnitPrice ?? 0) > 0 ||
                ((ingredient as typeof ingredient & { npcCapacity?: number }).npcCapacity ?? 0) >= ingredient.count
            return Boolean(hasInstantSource && ingredient.itemId && !forgeTags.has(ingredient.itemId))
        })
    )
}

function censoredFlip(): ForgeFlip {
    return {
        duration: 60,
        profitPerHour: 123456,
        requiredHotMLevel: 9,
        craftData: {
            itemId: 'SECRET_FORGE_FLIP',
            sellPrice: 1_000_000,
            craftCost: 500_000,
            buyOrderCraftCost: 500_000,
            volume: 999,
            median: 900_000,
            lastUpdated: new Date().toISOString()
        }
    }
}

export function ForgeFlips() {
    const [loadSubcrafts, setLoadSubcrafts] = useState(false)
    const [noWaitOnly, setNoWaitOnly] = useState(false)
    const query = useGetApiFlipForge()
    const craftQuery = useGetApiCraftProfit(undefined, { query: { enabled: loadSubcrafts } })
    const response = query.data
    const safeFlips = useMemo(() => (hasSuccessfulArrayResponse<ForgeFlip>(response) ? response.data : []), [response])
    const craftResponse = craftQuery.data
    const safeCrafts = useMemo(() => (hasSuccessfulArrayResponse<GeneratedProfitableCraft>(craftResponse) ? craftResponse.data : []), [craftResponse])
    const forgeTags = useMemo(() => new Set(safeFlips.flatMap(flip => (flip.craftData?.itemId ? [flip.craftData.itemId] : []))), [safeFlips])
    const expandedForgeCrafts = useMemo(() => {
        const forgeCrafts = safeFlips.flatMap(flip => (flip.craftData?.itemId && flip.craftData.ingredients ? [flip.craftData] : []))
        const normalCrafts = safeCrafts.filter(craft => craft.type !== 'forge' && craft.itemId && craft.ingredients)

        return new Map(parseProfitableCrafts(normalCrafts, forgeCrafts).map(craft => [craft.item.tag, craft]))
    }, [safeCrafts, safeFlips])
    const errorMessage = getGeneratedApiErrorMessage(response, query.error, 'Unable to load forge flips right now')
    const forgeFilterFunction = useCallback(
        (flip: ForgeFlip, nameFilter: string | null | undefined, minimumProfit: number) =>
            filterFunction(flip, nameFilter, minimumProfit) && (!noWaitOnly || Boolean(hasNoWaitInputs(flip, forgeTags))),
        [forgeTags, noWaitOnly]
    )

    function customItemWrapper(flip: ForgeFlip, blur: boolean, key: string, content: React.ReactNode, flipCardClass: string) {
        if (blur) {
            return (
                <div key={key} className={flipCardClass}>
                    {content}
                </div>
            )
        }

        const tag = flip.craftData?.itemId
        return (
            <Tooltip
                key={key}
                className={flipCardClass}
                type="click"
                content={<>{content}</>}
                tooltipTitle={getForgeHeader(flip)}
                tooltipContent={
                    <ForgeDetails
                        flip={flip}
                        craft={tag ? expandedForgeCrafts.get(tag) : undefined}
                        isLoadingSubcrafts={craftQuery.isFetching}
                        noWait={noWaitOnly}
                        onNoWaitChange={setNoWaitOnly}
                    />
                }
                onClick={() => setLoadSubcrafts(true)}
            />
        )
    }

    return (
        <div>
            <p>
                Track the hottest Dwarven Mines forge flips. We pull in live craft costs, sale medians, and forge durations so you can maximise coins per hour
                while meeting Heart of the Mountain requirements.
                <br />
                Use our mod to filter options in game and only see the relevant ones where you meet the required collections and hotm level.
            </p>
            <details>
                <summary>How forge flipping works</summary>
                <ol>
                    <li>Pick a flip with strong profit and volume to ensure demand.</li>
                    <li>Gather or buy the required materials listed under Ingredients.</li>
                    <li>Start the forge process (respect the duration and required HotM level).</li>
                    <li>List the finished item for at least the median sell price shown.</li>
                </ol>
            </details>
            <details>
                <summary>What to watch for</summary>
                <ul>
                    <li>
                        <strong>Profit / hour:</strong> Adjusted for forge time so you can compare long vs short crafts.
                    </li>
                    <li>
                        <strong>Volume:</strong> Higher volume means faster sales.
                    </li>
                    <li>
                        <strong>Requirements:</strong> Some flips need specific nucleus powders, commissions, or unlocks.
                    </li>
                </ul>
            </details>
            <br />
            {query.isLoading && !response ? (
                <p>Loading forge flips…</p>
            ) : errorMessage ? (
                <Alert variant="danger">{errorMessage}</Alert>
            ) : (
                <GenericFlipList
                    items={safeFlips}
                    sortOptions={SORT_OPTIONS}
                    renderFlipContentAction={renderForgeFlip}
                    filterFunction={forgeFilterFunction}
                    getItemKeyAction={flip => flip.craftData?.itemId ?? `forge-${flip.duration}-${flip.requiredHotMLevel}`}
                    censoredItemGenerator={censoredFlip}
                    premiumMessage="The top 3 flips can only be seen with starter premium or better"
                    clickMessage="Select a forge flip to see its inputs and the cheapest way to source them"
                    showColumns
                    customItemWrapper={customItemWrapper}
                    customFilters={
                        <div>
                            <Form.Check
                                type="switch"
                                id="forge-no-wait"
                                label="No-wait flips only"
                                checked={noWaitOnly}
                                onChange={event => setNoWaitOnly(event.target.checked)}
                            />
                            <small className={styles.filterHelp}>Inputs must be instantly purchasable and cannot require another forge output.</small>
                        </div>
                    }
                />
            )}
        </div>
    )
}

export default ForgeFlips
