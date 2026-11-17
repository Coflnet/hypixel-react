import { Duration, PremiumTier, PurchaseType, getDurationOptions, getTierDisplayName } from './types'

/** the wizard's internal steps; some are skipped depending on the choices (see getStepFlow) */
export const STEP = {
    TIER: 1,
    TYPE: 2,
    PACKAGE: 3,
    DURATION: 4,
    PURCHASE: 5
} as const

/** step names for the progress bar (read by screen readers) and the summary chips */
export const STEP_NAMES: Record<number, string> = {
    [STEP.TIER]: 'Tier',
    [STEP.TYPE]: 'Plan type',
    [STEP.PACKAGE]: 'Package',
    [STEP.DURATION]: 'Duration',
    [STEP.PURCHASE]: 'Checkout'
}

export interface WizardState {
    currentStep: number
    tier: PremiumTier | null
    type: PurchaseType | null
    slotCount: number
    duration: Duration | null
    /** slot mode: only slot packages, no personal access */
    showSlots?: boolean
    /** the tier came from a plan card or a ?tier= link, so the tier step is skipped and not counted */
    tierPreselected?: boolean
    /** the visitor never saw the package step (Starter upgraded in place at the checkout) */
    packageSkipped?: boolean
    /** an upgrade of the active tier: lower tiers and the active one cannot be bought */
    isUpgrade?: boolean
    currentTier?: PremiumTier | null
}

const TIER_RANKS: Record<PremiumTier, number> = {
    [PremiumTier.STARTER]: 1,
    [PremiumTier.PREMIUM]: 2,
    [PremiumTier.PREMIUM_PLUS]: 3
}

/** an upgrade only offers tiers above the active one */
export function canSelectTier(tier: PremiumTier, currentTier?: PremiumTier | null, isUpgrade?: boolean): boolean {
    if (!isUpgrade || !currentTier) return true
    return TIER_RANKS[tier] > TIER_RANKS[currentTier]
}

export interface WizardChip {
    step: number
    value: string
    ariaLabel: string
}

/** "Just for me" (0 slots) is preselected unless the visitor buys for friends only */
function hasPackage(state: WizardState): boolean {
    return state.slotCount > 0 || !state.showSlots
}

function skipsPackage(state: WizardState): boolean {
    return state.tier === PremiumTier.STARTER || !!state.packageSkipped
}

function skipsDuration(state: WizardState): boolean {
    return !!state.showSlots || state.slotCount > 0
}

/** the internal steps the visitor goes through, in order; matches the numbers of getStepDisplay */
export function getStepFlow(state: WizardState): number[] {
    const flow: number[] = []
    if (!(state.tierPreselected && state.currentStep > STEP.TIER)) flow.push(STEP.TIER)
    flow.push(STEP.TYPE)
    if (!skipsPackage(state)) flow.push(STEP.PACKAGE)
    if (!skipsDuration(state)) flow.push(STEP.DURATION)
    flow.push(STEP.PURCHASE)
    return flow
}

/** the step Continue leads to, or null while the current step has no answer yet */
export function getNextStep(state: WizardState): number | null {
    switch (state.currentStep) {
        case STEP.TIER:
            return state.tier && canSelectTier(state.tier, state.currentTier, state.isUpgrade) ? STEP.TYPE : null
        case STEP.TYPE:
            if (!state.type) return null
            return skipsPackage(state) ? STEP.DURATION : STEP.PACKAGE
        case STEP.PACKAGE:
            if (!hasPackage(state)) return null
            return state.slotCount > 0 ? STEP.PURCHASE : STEP.DURATION
        case STEP.DURATION:
            return state.duration ? STEP.PURCHASE : null
        default:
            return null
    }
}

/** the step Back leads to, or null on the first step */
export function getPreviousStep(state: WizardState): number | null {
    if (state.currentStep <= STEP.TIER) return null
    if (state.currentStep === STEP.PURCHASE && state.slotCount > 0) return STEP.PACKAGE
    if (state.currentStep === STEP.DURATION && skipsPackage(state)) return STEP.TYPE
    return state.currentStep - 1
}

function getTypeLabel(type: PurchaseType): string {
    return type === PurchaseType.SUBSCRIPTION ? 'Subscription' : 'CoflCoins'
}

export function getPackageLabel(slotCount: number): string {
    if (slotCount === 0) return 'Just for me'
    return slotCount === 1 ? '1 slot' : `${slotCount} slots`
}

function getDurationLabel(state: WizardState): string | null {
    if (!state.tier || !state.type || !state.duration) return null
    return getDurationOptions(state.tier, state.type).find(option => option.value === state.duration)?.label ?? null
}

function chip(step: number, value: string | null): WizardChip | null {
    if (!value) return null
    return { step, value, ariaLabel: `Change ${STEP_NAMES[step].toLowerCase()}: ${value}` }
}

/** one chip per answered step before the current one; each jumps back to its step */
export function getSummaryChips(state: WizardState): WizardChip[] {
    const answered = getStepFlow(state).filter(step => step > STEP.TIER && step < state.currentStep)
    return answered
        .map(step => {
            if (step === STEP.TYPE) return chip(step, state.type && getTypeLabel(state.type))
            if (step === STEP.PACKAGE) return chip(step, hasPackage(state) ? getPackageLabel(state.slotCount) : null)
            return chip(step, getDurationLabel(state))
        })
        .filter((value): value is WizardChip => value !== null)
}

interface CopyContext {
    isUpgrade: boolean
    currentTier: PremiumTier | null
    forFriends: boolean
    slotCount: number
    tier: PremiumTier | null
    type: PurchaseType | null
}

export function getStepTitle(step: number, context: CopyContext): string {
    switch (step) {
        case STEP.TIER:
            return context.isUpgrade && context.currentTier ? `Upgrade Your ${getTierDisplayName(context.currentTier)}` : 'Choose Your Premium Tier'
        case STEP.TYPE:
            return 'Choose Your Plan Type'
        case STEP.PACKAGE:
            return 'Choose Your Package'
        case STEP.DURATION:
            return 'Select Duration'
        case STEP.PURCHASE:
            return context.isUpgrade && context.slotCount === 0 ? 'Complete Upgrade' : 'Complete Purchase'
        default:
            return 'Premium Purchase'
    }
}

function getTierHelper(context: CopyContext): string {
    if (context.isUpgrade) return 'Pick the higher tier you want. Your current tier is paused, not lost.'
    if (context.forFriends) return 'Choose the tier your friends will receive.'
    return 'Choose the tier that best fits your needs. Higher tiers include all features from lower tiers.'
}

function getDurationHelper(context: CopyContext): string {
    if (context.type === PurchaseType.COFLCOINS) {
        const tierName = context.tier ? getTierDisplayName(context.tier) : 'Premium'
        return `How long would you like ${tierName}? Different durations may have different per-week pricing.`
    }
    return 'Choose your billing cycle. You can cancel any time and keep access until the end of your billing period.'
}

/** the muted line under the title; null when the step needs none */
export function getStepHelper(step: number, context: CopyContext): string | null {
    switch (step) {
        case STEP.TIER:
            return getTierHelper(context)
        case STEP.TYPE:
            return 'Both options give the same Premium features.'
        case STEP.PACKAGE:
            return context.forFriends ? 'Slots can be assigned to friends after payment.' : 'Premium for your own account, or slots you can assign to friends.'
        case STEP.DURATION:
            return getDurationHelper(context)
        default:
            return null
    }
}

/**
 * A pointer click (mouse, touch, pen) carries a click count. Keyboard activation and arrow keys in a radio group
 * dispatch clicks with detail 0: those only select, so keyboard users are not moved on while they look at the options.
 */
export function isPointerClick(event: { detail: number }): boolean {
    return event.detail > 0
}
