import type { BazaarPlanConfidence, BazaarPlanRequest } from '../api/_generated/skyApi.schemas'
import { getNumberFromShortenString } from './Formatter'

export type BazaarPlanModeChoice = 'Active' | 'Investing' | 'Both'

export const BAZAAR_PLAN_MODES: BazaarPlanModeChoice[] = ['Active', 'Investing', 'Both']
export const BAZAAR_PLAN_DEFAULT_HORIZON_HOURS = 24
export const BAZAAR_PLAN_MIN_HORIZON_HOURS = 1
export const BAZAAR_PLAN_MAX_HORIZON_HOURS = 48

export interface BazaarPlanBadge {
    variant: 'success' | 'warning' | 'secondary'
    text: string
    tooltip?: string
}

/**
 * Fields the engine sends on the confidence object that the generated SkyApi types do not carry yet.
 * Intersected with the generated type so regeneration does not break it.
 */
export type BazaarPlanConfidenceExt = BazaarPlanConfidence & {
    /** Probability needed for Qualified, null from older engines means 0.95 */
    qualifyThreshold?: number | null
    /** "simulation" or "prospective" */
    evidenceSource?: string | null
}

export const BAZAAR_PLAN_SIMULATED_TOOLTIP = 'Estimated from historical market replay, not yet confirmed by tracked trades.'

export function parseBazaarPlanMode(value: unknown): BazaarPlanModeChoice {
    return BAZAAR_PLAN_MODES.find(mode => mode === value) ?? 'Active'
}

export function includesInvesting(mode: BazaarPlanModeChoice): boolean {
    return mode !== 'Active'
}

export function modesOf(mode: BazaarPlanModeChoice): string[] {
    switch (mode) {
        case 'Investing':
            return ['investing']
        case 'Both':
            return ['active', 'investing']
        default:
            return ['active']
    }
}

/** Parses "5000000", "5,000,000" or "5m"; undefined when empty or not a positive number. */
export function parseCoins(value: string): number | undefined {
    const text = value.trim().replace(/[,\s]/g, '')
    if (!text) {
        return undefined
    }
    const parsed = /[a-zA-Z]/.test(text) ? getNumberFromShortenString(text) : Number(text)
    return parsed !== undefined && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/** Returns an error text for an invalid horizon input, null when it is valid. */
export function validateHorizon(value: string): string | null {
    const hours = Number(value)
    if (!value.trim() || !Number.isFinite(hours) || hours < BAZAAR_PLAN_MIN_HORIZON_HOURS || hours > BAZAAR_PLAN_MAX_HORIZON_HOURS) {
        return `The investing horizon must be between ${BAZAAR_PLAN_MIN_HORIZON_HOURS} and ${BAZAAR_PLAN_MAX_HORIZON_HOURS} hours`
    }
    return null
}

/** Returns an error text for an invalid budget input, null for empty (default) or valid input. */
export function validateBudget(value: string): string | null {
    if (!value.trim()) {
        return null
    }
    return parseCoins(value) === undefined ? 'The budget must be a positive number of coins' : null
}

/** Returns an error text for an invalid sell tax percentage input, null for empty (assumed rate) or valid input. */
export function validateTax(value: string): string | null {
    if (!value.trim()) {
        return null
    }
    const percent = Number(value)
    return Number.isFinite(percent) && percent >= 0 && percent < 100 ? null : 'The sell tax must be a percentage between 0 and 100'
}

/**
 * The request body for the entered controls. Fields the user did not touch are left out so that the
 * server applies its smart defaults (purse based budget, assumed tax).
 */
export function buildBazaarPlanRequest(mode: BazaarPlanModeChoice, horizon: string, budget: string, tax: string): BazaarPlanRequest {
    const body: BazaarPlanRequest = { modes: modesOf(mode) }
    if (includesInvesting(mode)) {
        body.investingHorizonHours = Number(horizon)
    }
    const coins = parseCoins(budget)
    if (coins !== undefined) {
        body.budgetCoins = coins
    }
    if (tax.trim()) {
        body.sellTaxRate = Number(tax) / 100
    }
    return body
}

function percent(fraction: number): string {
    return `${Math.floor(fraction * 1000) / 10}%`
}

/**
 * The badge of the full cycle confidence. A missing probability is unknown and never rendered as a
 * percentage, the lower bound is only shown for qualified entries.
 */
export function getConfidenceBadge(confidence?: BazaarPlanConfidenceExt | null): BazaarPlanBadge | null {
    switch (confidence?.status) {
        case 'NotApplicable':
            return null
        case 'Qualified':
            if (confidence.probability == null) {
                return { variant: 'secondary', text: 'unknown' }
            }
            const threshold = typeof confidence.qualifyThreshold === 'number' && Number.isFinite(confidence.qualifyThreshold) ? confidence.qualifyThreshold : 0.95
            const simulated = confidence.evidenceSource === 'simulation'
            const base = `>${percent(threshold)} full cycle${simulated ? ' (simulated)' : ''}`
            return {
                variant: 'success',
                text: confidence.lowerBound == null ? base : `${base} (lb ${percent(confidence.lowerBound)})`,
                ...(simulated ? { tooltip: BAZAAR_PLAN_SIMULATED_TOOLTIP } : {})
            }
        case 'SimulationOnly':
            return { variant: 'warning', text: 'simulation only, not proven' }
        case 'StaleInputs':
            return { variant: 'warning', text: 'stale inputs' }
        default:
            return { variant: 'secondary', text: 'unknown' }
    }
}

export function getDeadlineText(semantics?: string | null, lockHours?: number): string {
    const lock = lockHours == null ? '' : `Capital locked for at most ${lockHours} h`
    if (semantics === 'FixedFromFirstAcceptedBuy') {
        return `${lock ? `${lock}. ` : ''}The deadline starts with your first accepted buy order and is not extended by replacement orders.`
    }
    return semantics ? (lock ? `${lock} (${semantics})` : `(${semantics})`) : lock
}

export function getTaxText(rate: number, source?: string | null): string {
    const shown = `${Math.round(rate * 10000) / 100}%`
    if (source === 'AccountAttested') {
        return `${shown} tax, your rate`
    }
    return `${shown} tax, assumed`
}
