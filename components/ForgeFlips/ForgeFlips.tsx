'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { useSuspenseQuery } from '@tanstack/react-query'
import api from '../../api/ApiHelper'
import { GenericFlipList, SortOption } from '../GenericFlipList'
import NumberElement from '../Number/Number'
import { convertTagToName } from '../../utils/Formatter'
import { getApiFlipForge, getGetApiFlipForgeQueryKey } from '../../api/_generated/skyApi'
import { ForgeFlip, ProfitableCraft } from '../../api/_generated/skyApi.schemas'

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

function getCraftProfit(craft?: ProfitableCraft | null) {
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
        <p>
            <span style={{ width: '200px', float: 'left' }}>Requirements:</span>
            <span>
                {Object.entries(requirements).map(([key, value]) => (
                    <span key={key} style={{ display: 'inline-block', marginRight: '12px' }}>
                        {key}: {value}
                    </span>
                ))}
            </span>
        </p>
    )
}

function renderIngredients(craft?: ProfitableCraft | null) {
    if (!craft?.ingredients || craft.ingredients.length === 0) {
        return null
    }
    return (
        <div style={{ marginTop: '8px' }}>
            <strong>Ingredients:</strong>
            <ul>
                {craft.ingredients.map(ingredient => (
                    <li key={`${ingredient.itemId}-${ingredient.type}-${ingredient.count}`}>
                        {ingredient.count}x {ingredient.itemId ? convertTagToName(ingredient.itemId) : ingredient.type ?? 'Unknown'}
                        {ingredient.cost ? (
                            <span>
                                {' '}
                                (<NumberElement number={Math.round(ingredient.cost)} /> Coins)
                            </span>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function renderForgeFlip(flip: ForgeFlip) {
    const craft = flip.craftData
    const tag = getForgeOutputTag(flip)
    const imageUrl = tag ? api.getItemImageUrl({ tag }) : null
    const profit = getCraftProfit(craft)
    const durationText = formatDuration(flip.duration)

    return (
        <>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {imageUrl ? <Image src={imageUrl} alt={getOutputName(flip)} width={32} height={32} loading="lazy" crossOrigin="anonymous" /> : null}
                <span>{getOutputName(flip)}</span>
            </h4>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Profit / hour:</span> <NumberElement number={Math.round(flip.profitPerHour)} /> Coins
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Craft profit:</span> <NumberElement number={Math.round(profit)} /> Coins
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Median sell price:</span> <NumberElement number={Math.round(craft?.sellPrice ?? 0)} /> Coins
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Craft cost:</span> <NumberElement number={Math.round(craft?.craftCost ?? 0)} /> Coins
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Volume:</span> <NumberElement number={Math.round(craft?.volume ?? 0)} />
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Duration:</span> {durationText}
            </p>
            <p>
                <span style={{ width: '200px', float: 'left' }}>Required HotM level:</span> {flip.requiredHotMLevel}
            </p>
            {renderRequirements(flip.requirements)}
            {renderIngredients(craft)}
        </>
    )
}

function filterFunction(flip: ForgeFlip, nameFilter: string | null | undefined, minimumProfit: number) {
    const nameMatch = !nameFilter || getOutputName(flip).toLowerCase().includes(nameFilter.toLowerCase())
    const profitMatch = getCraftProfit(flip.craftData) >= minimumProfit
    return nameMatch && profitMatch
}

function getFlipLink(flip: ForgeFlip) {
    const tag = flip.craftData?.itemId
    if (!tag) {
        return undefined
    }
    return `https://sky.coflnet.com/item/${tag}`
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
    const { data: { data: flips } = { data: [] } } = useSuspenseQuery({
        queryKey: [getGetApiFlipForgeQueryKey()],
        queryFn: () => getApiFlipForge()
    })

    const safeFlips = useMemo(() => flips ?? [], [flips])

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
            <GenericFlipList
                items={safeFlips}
                sortOptions={SORT_OPTIONS}
                renderFlipContentAction={renderForgeFlip}
                filterFunction={filterFunction}
                getItemKeyAction={flip => flip.craftData?.itemId ?? `forge-${flip.duration}-${flip.requiredHotMLevel}`}
                getFlipLink={getFlipLink}
                censoredItemGenerator={censoredFlip}
                premiumMessage="The top 3 flips can only be seen with starter premium or better"
                clickMessage="Click on a flip for further details"
                showColumns
            />
        </div>
    )
}

export default ForgeFlips
