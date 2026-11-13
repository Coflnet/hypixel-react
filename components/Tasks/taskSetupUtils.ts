import type { PublicGearTaggedItem, PublicTaskGearSetup, PublicTaskGearSetups } from '../../api/publicTaskApi'
import type { PublicGearSpec, PublicModifierEffect } from '../../api/_generated/skyApi.schemas'
import { formatCoins, formatCount } from './taskUtils'

/** Null-safe coin formatting for premium numbers: a missing value is a dash, negative values keep their sign. */
export function formatMaybeCoins(value?: number | null): string {
    if (value === null || value === undefined) {
        return '–'
    }
    const rounded = Math.round(value)
    return rounded < 0 ? `-${formatCoins(-rounded)}` : formatCoins(rounded)
}

/** Coins with an explicit sign, zero has none. */
export function formatSignedCoins(value?: number | null): string {
    if (value === null || value === undefined) {
        return '–'
    }
    const rounded = Math.round(value)
    return rounded > 0 ? `+${formatCoins(rounded)}` : formatMaybeCoins(rounded)
}

export function formatHours(value?: number | null): string {
    if (value === null || value === undefined) {
        return '–'
    }
    return value < 10 ? `${value.toFixed(1)} h` : `${formatCount(value)} h`
}

export function formatPercent(value?: number | null): string {
    if (value === null || value === undefined) {
        return '–'
    }
    return `${(value * 100).toFixed(1)}%`
}

export function formatSignedPercent(value?: number | null): string {
    if (value === null || value === undefined) {
        return '–'
    }
    return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

export function getStatusLabel(status?: string | null): string {
    switch (status) {
        case 'baseline':
            return 'Baseline gear'
        case 'reached':
            return 'Typical gear for this or a lower tier'
        default:
            return 'Upgrade'
    }
}

export function getStatusBg(status?: string | null): string {
    switch (status) {
        case 'baseline':
            return 'secondary'
        case 'reached':
            return 'info'
        default:
            return 'primary'
    }
}

export function getConfidenceBg(confidence?: string | null): string {
    switch (confidence) {
        case 'high':
            return 'success'
        case 'medium':
            return 'warning'
        default:
            return 'secondary'
    }
}

export function getStabilityBg(stability?: string | null): string {
    switch (stability) {
        case 'stable':
            return 'success'
        case 'moderate':
            return 'info'
        case 'volatile':
            return 'danger'
        case 'illiquid':
            return 'warning'
        default:
            return 'secondary'
    }
}

export function capitalize(value?: string | null): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

/** Whether a payback can be shown at all: baseline and reached gear never have one. */
export function hasPayback(setup: PublicTaskGearSetup): boolean {
    return setup.status === 'upgrade' && !setup.noProfitGain
}

export function getSetupRows(setups: PublicTaskGearSetups): PublicTaskGearSetup[] {
    return [setups.baseline, ...setups.setups].filter((s): s is PublicTaskGearSetup => !!s)
}

/** "Mid and endgame" for the tiers whose numbers are still locked. */
export function describeLockedTiers(rows: PublicTaskGearSetup[]): string {
    const names = rows.filter(s => s.locked).map(s => (s.tier || s.name).toLowerCase())
    const text = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? ''
    return capitalize(text)
}

/** The table island only needs names and numbers, so the rest (sources, reasons, ...) stays out of the page payload. */
export function toTableSetups(setups: PublicTaskGearSetups): PublicTaskGearSetups {
    const lean = (s: PublicTaskGearSetup): PublicTaskGearSetup => ({
        ...s,
        assumptions: [],
        sources: [],
        unlocksTask: undefined,
        confidence: undefined,
        statMedians: undefined,
        items: s.items.map(i => ({ ...i, slot: undefined, reason: undefined, spec: undefined, acquisition: undefined }))
    })
    return { ...setups, baseline: setups.baseline && lean(setups.baseline), setups: setups.setups.map(lean) }
}

/** A measured setup has data of at least two players, everything else is a modelled estimate. */
/** The few fields the badges need, so the client components never receive a whole setup. */
export type BasisInfo = Pick<PublicTaskGearSetup, 'basis' | 'playersLabel' | 'hours'>

export function toBasisInfo(setup: PublicTaskGearSetup): BasisInfo {
    return { basis: setup.basis, playersLabel: setup.playersLabel, hours: setup.hours }
}

export function isMeasured(setup: BasisInfo): boolean {
    return setup.basis === 'measured'
}

/** "Measured · 2+ players · 14 h", parts without data are left out. */
export function getMeasuredLabel(setup: BasisInfo): string {
    const parts = ['Measured']
    if (setup.playersLabel) {
        parts.push(`${setup.playersLabel} players`)
    }
    if (setup.hours !== null && setup.hours !== undefined) {
        parts.push(formatHours(setup.hours))
    }
    return parts.join(' · ')
}

/** "harvesting" and "farming_fortune" to "Harvesting" and "Farming Fortune". */
export function prettifyKey(key?: string | null): string {
    return (key ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const MAX_SPEC_ENCHANTS = 6

function describeEnchants(enchants?: Record<string, number> | null): string | undefined {
    const entries = Object.entries(enchants ?? {})
    if (entries.length === 0) {
        return undefined
    }
    const shown = entries.slice(0, MAX_SPEC_ENCHANTS).map(([name, level]) => `${prettifyKey(name)} ${level}`)
    const more = entries.length - shown.length
    return more > 0 ? `${shown.join(', ')} +${more} more` : shown.join(', ')
}

function describeUpgrades(spec: PublicGearSpec): string[] {
    const parts: string[] = []
    if (spec.reforge) parts.push(prettifyKey(spec.reforge))
    if (spec.stars) parts.push(`${spec.stars}★`)
    if (spec.hotPotatoCount) parts.push(`${spec.hotPotatoCount} HPB`)
    if (spec.recombobulated) parts.push('Recombobulated')
    if (spec.petLevel) parts.push(`Lvl ${spec.petLevel}`)
    if (spec.heldItem) parts.push(prettifyKey(spec.heldItem))
    return parts
}

/** Compact spec of an item: enchant levels, reforge, stars, HPB, pet level and held item. */
export function describeSpec(spec?: PublicGearSpec | null): string[] {
    if (!spec) {
        return []
    }
    return [describeEnchants(spec.enchants), ...describeUpgrades(spec)].filter((p): p is string => !!p)
}

/** "tool.enchants.harvesting" becomes "Harvesting", "tool.reforge" "Tool reforge" and "pet" "Pet". */
export function formatChangeComponent(component?: string | null): string {
    const parts = (component ?? '').split('.')
    if (parts[1] === 'enchants' && parts[2]) {
        return prettifyKey(parts.slice(2).join(' '))
    }
    return capitalize(parts.join(' '))
}

function formatChangeValue(value?: string | null): string {
    return value ? prettifyKey(value) : 'none'
}

/** "Harvesting 5 → 6: +12% coins/h (2+ players)", the API sends the change already in percent. */
export function formatModifierEffect(effect: PublicModifierEffect): string {
    const changes = (effect.changes ?? []).map(c => `${formatChangeComponent(c.component)} ${formatChangeValue(c.from)} → ${formatChangeValue(c.to)}`)
    const rounded = Math.round(effect.percentChange)
    const percent = `${rounded > 0 ? '+' : ''}${rounded}%`
    const players = effect.playersLabel ? ` (${effect.playersLabel} players)` : ''
    return `${changes.join(', ')}: ${percent} coins/h${players}`
}

/** "≥ 3.1M" when the price is only a lower bound, e.g. the item still needs grinding. */
export function formatPrice(value?: number | null, lowerBound?: boolean | null): string {
    const text = formatMaybeCoins(value)
    return lowerBound && text !== '–' ? `≥ ${text}` : text
}

/** The table rows: a missing baseline is shown as the community average, when its rate is known. */
export function getTableRows(setups: PublicTaskGearSetups): PublicTaskGearSetup[] {
    const rows = getSetupRows(setups)
    if (setups.baseline || setups.baselineCoinsPerHour === null || setups.baselineCoinsPerHour === undefined) {
        return rows
    }
    const community: PublicTaskGearSetup = {
        id: 'community-average', name: 'Community average', tier: 'baseline', status: 'baseline', locked: false,
        coinsPerHour: setups.baselineCoinsPerHour, assumptions: [], sources: [], items: []
    }
    return [community, ...rows]
}

/** What the Δ column of measured tiers is relative to. */
export function describeComparison(setups: PublicTaskGearSetups): string | undefined {
    const rate = setups.comparisonCoinsPerHour
    if (rate === null || rate === undefined) {
        return undefined
    }
    const reference = setups.baseline && setups.baseline.basis === 'measured' ? 'the measured baseline' : 'the community average'
    return `Δ coins/h of measured setups is relative to ${reference} (${formatMaybeCoins(rate)} coins/h).`
}

/** The only item fields the client component needs, so the rest of the item stays out of its serialized props. */
export type AcquisitionItem = Pick<PublicGearTaggedItem, 'spec' | 'acquisition' | 'modifiersMeasured' | 'priceLowerBound'>

export function toAcquisitionItem(item: PublicGearTaggedItem): AcquisitionItem {
    return { spec: item.spec, acquisition: item.acquisition, modifiersMeasured: item.modifiersMeasured, priceLowerBound: item.priceLowerBound }
}
