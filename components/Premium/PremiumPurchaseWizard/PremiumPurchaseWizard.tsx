'use client'
import { useState, useEffect, useRef, useId } from 'react'
import styles from './PremiumPurchaseWizard.module.css'
import { PremiumTier, PurchaseType, Duration, CheckoutCodes } from './types'
import { getStepDisplay } from './stepDisplay'
import { TierSelectionStep, PaymentMethodStep, DurationSelectionStep, PurchaseCompletionStep } from './Steps'
import { PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import { getTierOfProduct, parseTierFromUrl } from '../../../utils/PremiumUpgradeUtils'
import { getActiveSubscriptionDiscount } from '../../../utils/DiscountUtils'
import { useCountryDetection } from '../../../hooks/useCountryDetection'
import SlotPurchase from '../SlotPurchase/SlotPurchase'
import PackageSelectionStep from './Steps/PackageSelectionStep'
import useSlotCatalog from '../../../hooks/useSlotCatalog'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import { STEP, WizardState, getNextStep, getPreviousStep, getStepFlow, getStepHelper, getStepTitle, getSummaryChips } from './wizardFlow'
import { useStepTitleFocus } from './useStepTitleFocus'
import WizardHeader from './WizardHeader'

interface Props {
    showSlots: boolean
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
    /** a tier the visitor explicitly picked on the page (plan cards); every new request selects it like a click on its tier card */
    requestedTier?: TierRequest | null
    /** the tier chosen in the wizard changed, e.g. for the heading above it */
    onTierChange?(tier: PremiumTier | null): void
}

export interface TierRequest {
    tier: PremiumTier
}

/** reports every wizard step the visitor reaches on /premium; tier changes within a step are not counted again */
function useTrackWizardStep(step: number, tier: PremiumTier | null) {
    const variant = usePremiumVariant()
    const tierRef = useRef(tier)
    tierRef.current = tier
    useEffect(() => {
        trackPremiumFunnelEvent('wizard step', variant, { step, tier: tierRef.current })
    }, [variant, step])
}

function ChevronLeftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
        </svg>
    )
}

interface FooterProps {
    canGoBack: boolean
    backDisabled: boolean
    showContinue: boolean
    canContinue: boolean
    onBack(): void
    onContinue(): void
}

/** Back is left out on the first step instead of disabled; Continue moves on after a keyboard choice or a return via Back */
function WizardFooter({ canGoBack, backDisabled, showContinue, canContinue, onBack, onContinue }: FooterProps) {
    return (
        <div className={styles.footer}>
            {canGoBack ? (
                <button type="button" className={styles.backButton} onClick={onBack} disabled={backDisabled}>
                    <ChevronLeftIcon />
                    Back
                </button>
            ) : null}
            <span className={styles.spacer} />
            {showContinue ? (
                <button type="button" className={styles.continueButton} onClick={onContinue} disabled={!canContinue}>
                    Continue
                </button>
            ) : null}
        </div>
    )
}

function PremiumPurchaseWizard(props: Props) {
    const [currentStep, setCurrentStep] = useState<number>(STEP.TIER)
    const [slotCount, setSlotCount] = useState(0)
    const [slotPurchaseBusy, setSlotPurchaseBusy] = useState(false)
    const [selectedTier, setTier] = useState<PremiumTier | null>(null)
    const [selectedType, setSelectedType] = useState<PurchaseType | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<Duration | null>(null)
    const [urlDiscountCode, setUrlDiscountCode] = useState<string | null>(null)
    const [upgradeDiscountCode, setUpgradeDiscountCode] = useState<string | null>(null)
    const [upgradeCreatorCode, setUpgradeCreatorCode] = useState<string | null>(null)
    const { selectedCountry, handleCountryChange } = useCountryDetection()
    const slotCatalog = useSlotCatalog(selectedCountry?.value)
    const variant = usePremiumVariant()
    const titleId = useId()
    const { titleRef, focusNextTitle } = useStepTitleFocus()
    useTrackWizardStep(currentStep, selectedTier)

    function setSelectedTier(tier: PremiumTier | null) {
        setTier(tier)
        props.onTierChange?.(tier)
    }

    const [tierPreselected, setTierPreselected] = useState(false)
    const [packageSkipped, setPackageSkipped] = useState(false)

    const getCurrentTier = (): PremiumTier | null => getTierOfProduct(props.activePremiumProduct)

    const getTierRank = (tier: PremiumTier): number => {
        switch (tier) {
            case PremiumTier.STARTER:
                return PREMIUM_RANK.STARTER
            case PremiumTier.PREMIUM:
                return PREMIUM_RANK.PREMIUM
            case PremiumTier.PREMIUM_PLUS:
                return PREMIUM_RANK.PREMIUM_PLUS
            default:
                return 0
        }
    }

    const hasActivePremium = (): boolean => {
        return props.activePremiumProduct && props.activePremiumProduct.expires.getTime() > new Date().getTime()
    }

    const getSuggestedUpgradeTier = (): PremiumTier | null => {
        const currentTier = getCurrentTier()
        if (!currentTier) return null

        switch (currentTier) {
            case PremiumTier.STARTER:
                return PremiumTier.PREMIUM
            case PremiumTier.PREMIUM:
                return PremiumTier.PREMIUM_PLUS
            case PremiumTier.PREMIUM_PLUS:
                return null // Already highest tier
            default:
                return null
        }
    }

    const isUpgradeFlow = (): boolean => !props.showSlots && !!(hasActivePremium() && getCurrentTier())

    const { visible: visibleStep, total: totalSteps } = getStepDisplay({
        currentStep,
        slotCount,
        tier: selectedTier,
        showSlots: props.showSlots,
        tierPreselected,
        packageSkipped
    })
    const flowState: WizardState = {
        currentStep,
        tier: selectedTier,
        type: selectedType,
        slotCount,
        duration: selectedDuration,
        showSlots: props.showSlots,
        tierPreselected,
        packageSkipped,
        isUpgrade: isUpgradeFlow(),
        currentTier: getCurrentTier()
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const tierParam = urlParams.get('tier')
        const codeParam = urlParams.get('code')

        // If discount code is in URL, store it for auto-apply
        if (codeParam) {
            setUrlDiscountCode(codeParam)
        }

        if (props.requestedTier) {
            selectRequestedTier(props.requestedTier.tier)
            return
        }

        const preSelectedTier = parseTierFromUrl(tierParam)

        if (preSelectedTier) {
            // a ?tier= link is a choice already made, like a plan card
            selectRequestedTier(preSelectedTier)
        } else if (hasActivePremium()) {
            const suggestedTier = props.showSlots ? null : getSuggestedUpgradeTier()
            if (suggestedTier) {
                setSelectedTier(suggestedTier)
            }
        }
    }, [props.activePremiumProduct, props.requestedTier])

    function selectRequestedTier(tier: PremiumTier) {
        const currentTier = getCurrentTier()
        const isUpgrade = !props.showSlots && !!(hasActivePremium() && currentTier)
        // the same tier extends it (like /premium?tier=...), only a downgrade stays on the tier step
        if (isUpgrade && currentTier && getTierRank(tier) < getTierRank(currentTier)) {
            // the active tier cannot be bought as an upgrade: without a higher tier nothing is chosen
            resetChoices(getSuggestedUpgradeTier())
            setCurrentStep(STEP.TIER)
            setTierPreselected(false)
            return
        }
        handleTierSelect(tier)
        setTierPreselected(true)
    }

    const getCopyContext = () => ({
        isUpgrade: isUpgradeFlow(),
        currentTier: getCurrentTier(),
        forFriends: props.showSlots,
        slotCount,
        tier: selectedTier,
        type: selectedType
    })

    /** a step change the visitor made: the new step's title takes the focus */
    function goToStep(step: number | null) {
        if (step === null || step === currentStep) return
        // back at the plan type the package step is offered again
        if (step <= STEP.TYPE) setPackageSkipped(false)
        focusNextTitle()
        setCurrentStep(step)
    }

    function advanceWith(patch: Partial<WizardState>) {
        goToStep(getNextStep({ ...flowState, ...patch }))
    }

    function resetChoices(tier: PremiumTier | null) {
        setSelectedTier(tier)
        setSlotCount(0)
        setSelectedType(null)
        setSelectedDuration(null)
        setPackageSkipped(false)
    }

    // a tier picked on the page (plan card, ?tier= link) starts over at the plan type
    const handleTierSelect = (tier: PremiumTier) => {
        resetChoices(tier)
        setCurrentStep(STEP.TYPE)
    }

    // a pointer click selects and advances (advance = true); arrow keys and Space only select
    const chooseTier = (tier: PremiumTier, advance: boolean) => {
        if (tier !== selectedTier) resetChoices(tier)
        if (advance) advanceWith({ tier })
    }

    const chooseType = (type: PurchaseType, advance: boolean) => {
        // the durations differ per plan type
        const duration = type === selectedType ? selectedDuration : null
        setSelectedType(type)
        setSelectedDuration(duration)
        if (advance) advanceWith({ type, duration })
    }

    function trackSlotsChoice(count: number) {
        if (count > 0) trackPremiumFunnelEvent('slots click', variant, { source: 'wizard', slots: count, tier: selectedTier })
    }

    const choosePackage = (count: number, advance: boolean) => {
        setSlotCount(count)
        if (!advance) return
        trackSlotsChoice(count)
        advanceWith({ slotCount: count })
    }

    const chooseDuration = (duration: Duration, advance: boolean) => {
        setSelectedDuration(duration)
        if (advance) advanceWith({ duration })
    }

    const handleContinue = () => {
        if (currentStep === STEP.PACKAGE) trackSlotsChoice(slotCount)
        goToStep(getNextStep(flowState))
    }

    const handleBack = () => {
        const previousStep = getPreviousStep(flowState)
        if (previousStep === null) return
        // back from the first counted step lets the visitor change the preselected tier
        if (currentStep === STEP.TYPE) setTierPreselected(false)
        goToStep(previousStep)
    }

    // Upgrade to a higher tier in place (from the "What you could get" panel). The codes the buyer applied go along; without
    // an applied discount code the active sale code is filled in.
    const handleTierUpgrade = (tier: PremiumTier, codes?: CheckoutCodes) => {
        // Starter never showed the package step; the upgraded flow keeps leaving it out (personal access)
        if (selectedTier === PremiumTier.STARTER) setPackageSkipped(true)
        setSelectedTier(tier)
        setUpgradeCreatorCode(codes?.creatorCode ?? null)
        // an empty code is the buyer's "cleared": neither the link's code nor the sale code comes back
        setUpgradeDiscountCode(codes?.discountCode === null ? '' : (codes?.discountCode ?? getActiveSubscriptionDiscount()?.code ?? null))
    }

    const renderCurrentStep = () => {
        const currentTier = getCurrentTier()
        const isUpgrade = isUpgradeFlow()
        const suggestedTier = props.showSlots ? null : getSuggestedUpgradeTier()

        switch (currentStep) {
            case STEP.TIER:
                return (
                    <TierSelectionStep
                        onTierSelect={chooseTier}
                        selectedTier={selectedTier}
                        forFriends={props.showSlots}
                        currentTier={currentTier}
                        isUpgrade={isUpgrade}
                        suggestedTier={suggestedTier}
                        activePremiumProduct={props.activePremiumProduct}
                        selectedCountry={selectedCountry}
                        onCountryChange={handleCountryChange}
                    />
                )
            case STEP.TYPE:
                return <PaymentMethodStep selectedType={selectedType} onTypeSelect={chooseType} />
            case STEP.PACKAGE:
                return (
                    <PackageSelectionStep
                        forFriends={props.showSlots}
                        catalog={slotCatalog}
                        tier={selectedTier!}
                        purchaseType={selectedType!}
                        slotCount={slotCount}
                        onSelect={choosePackage}
                    />
                )
            case STEP.DURATION:
                return (
                    <DurationSelectionStep
                        selectedType={selectedType!}
                        selectedTier={selectedTier!}
                        selectedDuration={selectedDuration}
                        onDurationSelect={chooseDuration}
                        countryCode={selectedCountry?.value}
                    />
                )
            case STEP.PURCHASE:
                if (slotCount > 0)
                    return (
                        <SlotPurchase
                            catalog={slotCatalog}
                            tier={selectedTier!}
                            purchaseType={selectedType!}
                            slotCount={slotCount}
                            initialDiscountCode={urlDiscountCode}
                            countryCode={selectedCountry?.value}
                            busy={slotPurchaseBusy}
                            onBusyChange={setSlotPurchaseBusy}
                            onCountryChange={handleCountryChange}
                            onChooseSlotCount={setSlotCount}
                            onChooseTier={setSelectedTier}
                        />
                    )
                return (
                    <PurchaseCompletionStep
                        selectedTier={selectedTier!}
                        selectedType={selectedType!}
                        selectedDuration={selectedDuration}
                        activePremiumProduct={props.activePremiumProduct}
                        premiumSubscriptions={props.premiumSubscriptions}
                        onNewActivePremiumProduct={props.onNewActivePremiumProduct}
                        initialDiscountCode={upgradeDiscountCode ?? urlDiscountCode}
                        initialCreatorCode={upgradeCreatorCode}
                        countryCode={selectedCountry?.value}
                        onSelectTier={handleTierUpgrade}
                        onSelectDuration={setSelectedDuration}
                    />
                )
            default:
                return null
        }
    }

    const copyContext = getCopyContext()
    return (
        <section className={styles.wizard} aria-labelledby={titleId} data-testid="premium-wizard">
            <WizardHeader
                flow={getStepFlow(flowState)}
                currentStep={currentStep}
                visibleStep={visibleStep}
                totalSteps={totalSteps}
                title={getStepTitle(currentStep, copyContext)}
                titleId={titleId}
                titleRef={titleRef}
                helper={getStepHelper(currentStep, copyContext)}
                tier={selectedTier}
                chips={getSummaryChips(flowState)}
                chipsDisabled={slotPurchaseBusy}
                onChipClick={goToStep}
            />
            <div>{renderCurrentStep()}</div>
            <WizardFooter
                canGoBack={getPreviousStep(flowState) !== null}
                backDisabled={slotPurchaseBusy}
                showContinue={currentStep < STEP.PURCHASE}
                canContinue={getNextStep(flowState) !== null}
                onBack={handleBack}
                onContinue={handleContinue}
            />
        </section>
    )
}

export default PremiumPurchaseWizard
