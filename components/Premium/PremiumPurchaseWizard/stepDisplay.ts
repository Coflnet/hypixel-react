import { PremiumTier } from './types'

export interface StepState {
    /** internal step: 1 tier, 2 plan type, 3 package, 4 duration, 5 purchase */
    currentStep: number
    slotCount: number
    tier: PremiumTier | null
    showSlots?: boolean
    /** the tier came from a plan card or a ?tier= link, so the tier step is skipped and not counted */
    tierPreselected: boolean
    /** the visitor never saw the package step (Starter upgraded in place at the checkout) */
    packageSkipped?: boolean
}

function skipsPackage(state: StepState): boolean {
    return state.tier === PremiumTier.STARTER || !!state.packageSkipped
}

function skippedBefore(state: StepState): number {
    const { currentStep, slotCount } = state
    // slot purchases skip the duration step, starter premium skips the package step
    const skipsOne = (slotCount > 0 && currentStep === 5) || (skipsPackage(state) && currentStep >= 4)
    return skipsOne ? 1 : 0
}

/** the "Step x of y" the visitor sees */
export function getStepDisplay(state: StepState): { visible: number; total: number } {
    const shortPath = state.showSlots || state.slotCount > 0 || skipsPackage(state)
    const tierStep = state.tierPreselected && state.currentStep > 1 ? 1 : 0
    return {
        visible: state.currentStep - skippedBefore(state) - tierStep,
        total: (shortPath ? 4 : 5) - tierStep
    }
}
