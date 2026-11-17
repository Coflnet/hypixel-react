'use client'
import { useState, useEffect, useRef } from 'react'
import { Button, Card, ProgressBar } from 'react-bootstrap'
import { ChevronLeft } from '@mui/icons-material'
import styles from './PremiumPurchaseWizard.module.css'
import { PremiumTier, PurchaseType, Duration } from './types'
import { getStepDisplay } from './stepDisplay'
import { TierSelectionStep, PaymentMethodStep, DurationSelectionStep, PurchaseCompletionStep } from './Steps'
import { PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import { parseTierFromUrl } from '../../../utils/PremiumUpgradeUtils'
import { getActiveSubscriptionDiscount } from '../../../utils/DiscountUtils'
import { useCountryDetection } from '../../../hooks/useCountryDetection'
import SlotPurchase from '../SlotPurchase/SlotPurchase'
import PackageSelectionStep from './Steps/PackageSelectionStep'
import useSlotCatalog from '../../../hooks/useSlotCatalog'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'

interface Props {
    showSlots: boolean
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
    /** a tier the visitor explicitly picked on the page (plan cards); every new request selects it like a click on its tier card */
    requestedTier?: TierRequest | null
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

function PremiumPurchaseWizard(props: Props) {
    const [currentStep, setCurrentStep] = useState(1)
    const [slotCount, setSlotCount] = useState(0)
    const [slotPurchaseBusy, setSlotPurchaseBusy] = useState(false)
    const [selectedTier, setSelectedTier] = useState<PremiumTier | null>(null)
    const [selectedType, setSelectedType] = useState<PurchaseType | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<Duration | null>(null)
    const [urlDiscountCode, setUrlDiscountCode] = useState<string | null>(null)
    const [upgradeDiscountCode, setUpgradeDiscountCode] = useState<string | null>(null)
    const { selectedCountry, handleCountryChange } = useCountryDetection()
    const slotCatalog = useSlotCatalog(selectedCountry?.value)
    const variant = usePremiumVariant()
    useTrackWizardStep(currentStep, selectedTier)

    const [tierPreselected, setTierPreselected] = useState(false)
    const { visible: visibleStep, total: totalSteps } = getStepDisplay({
        currentStep,
        slotCount,
        tier: selectedTier,
        showSlots: props.showSlots,
        tierPreselected
    })

    const getCurrentTier = (): PremiumTier | null => {
        if (!props.activePremiumProduct) return null

        const productSlug = props.activePremiumProduct.productSlug
        if (productSlug.includes('starter')) return PremiumTier.STARTER
        if (productSlug.includes('premium_plus') || productSlug.includes('premium+')) return PremiumTier.PREMIUM_PLUS
        if (productSlug.includes('premium')) return PremiumTier.PREMIUM

        return null
    }

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
            handleTierSelect(getSuggestedUpgradeTier() ?? currentTier)
            setCurrentStep(1)
            setTierPreselected(false)
            return
        }
        handleTierSelect(tier)
        setTierPreselected(true)
    }

    const getStepTitle = () => {
        const currentTier = getCurrentTier()
        const isUpgrade = !props.showSlots && !!(hasActivePremium() && currentTier)

        switch (currentStep) {
            case 1:
                if (isUpgrade) {
                    return `Upgrade Your ${
                        currentTier === PremiumTier.STARTER ? 'Starter Premium' : currentTier === PremiumTier.PREMIUM ? 'Premium' : 'Premium Plus'
                    }`
                }
                return 'Choose Your Premium Tier'
            case 2:
                return 'Choose Your Plan Type'
            case 3:
                return 'Choose Your Package'
            case 4:
                return 'Select Duration'
            case 5:
                return isUpgrade && slotCount === 0 ? 'Complete Upgrade' : 'Complete Purchase'
            default:
                return 'Premium Purchase'
        }
    }

    // Auto-advance handlers for each step
    const handleTierSelect = (tier: PremiumTier) => {
        setSelectedTier(tier)
        setSlotCount(0)
        setSelectedType(null)
        setSelectedDuration(null)
        setCurrentStep(2)
    }

    const handleTypeSelect = (type: PurchaseType) => {
        setSelectedType(type)
        setCurrentStep(selectedTier === PremiumTier.STARTER ? 4 : 3)
    }

    const handleDurationSelect = (duration: Duration) => {
        setSelectedDuration(duration)
        // Auto-advance to next step
        setCurrentStep(5)
    }

    const handleBack = () => {
        if (currentStep <= 1) return
        // back from the first counted step lets the visitor change the preselected tier
        if (currentStep === 2) setTierPreselected(false)
        setCurrentStep(currentStep === 5 && slotCount > 0 ? 3 : currentStep === 4 && selectedTier === PremiumTier.STARTER ? 2 : currentStep - 1)
    }

    // Upgrade to a higher tier in place (from the "What you could get" panel) and
    // auto-apply the active sale code so the discount is already filled in.
    const handleTierUpgrade = (tier: PremiumTier) => {
        setSelectedTier(tier)
        const discount = getActiveSubscriptionDiscount()
        if (discount) {
            setUpgradeDiscountCode(discount.code)
        }
    }

    const renderCurrentStep = () => {
        const currentTier = getCurrentTier()
        const isUpgrade = !props.showSlots && !!(hasActivePremium() && currentTier)
        const suggestedTier = props.showSlots ? null : getSuggestedUpgradeTier()

        switch (currentStep) {
            case 1:
                return (
                    <TierSelectionStep
                        onTierSelect={handleTierSelect}
                        forFriends={props.showSlots}
                        currentTier={currentTier}
                        isUpgrade={isUpgrade}
                        suggestedTier={suggestedTier}
                        activePremiumProduct={props.activePremiumProduct}
                        selectedCountry={selectedCountry}
                        onCountryChange={handleCountryChange}
                    />
                )
            case 2:
                return <PaymentMethodStep selectedType={selectedType} onTypeSelect={handleTypeSelect} />
            case 3:
                return (
                    <PackageSelectionStep
                        forFriends={props.showSlots}
                        catalog={slotCatalog}
                        tier={selectedTier!}
                        purchaseType={selectedType!}
                        slotCount={slotCount}
                        onSelect={count => {
                            if (count > 0) trackPremiumFunnelEvent('slots click', variant, { source: 'wizard', slots: count, tier: selectedTier })
                            setSlotCount(count)
                            setCurrentStep(count > 0 ? 5 : 4)
                        }}
                    />
                )
            case 4:
                return (
                    <DurationSelectionStep
                        selectedType={selectedType!}
                        selectedTier={selectedTier!}
                        selectedDuration={selectedDuration}
                        onDurationSelect={handleDurationSelect}
                        countryCode={selectedCountry?.value}
                    />
                )
            case 5:
                if (slotCount > 0)
                    return (
                        <SlotPurchase
                            catalog={slotCatalog}
                            tier={selectedTier!}
                            purchaseType={selectedType!}
                            slotCount={slotCount}
                            busy={slotPurchaseBusy}
                            onBusyChange={setSlotPurchaseBusy}
                            onCountryChange={handleCountryChange}
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
                        countryCode={selectedCountry?.value}
                        onSelectTier={handleTierUpgrade}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className={styles.wizard}>
            <Card className={styles.wizardCard}>
                <Card.Header className={styles.wizardHeader}>
                    <h3>{getStepTitle()}</h3>
                    <ProgressBar now={(visibleStep / totalSteps) * 100} className={styles.progressBar} variant="success" />
                    <small className={styles.stepIndicator}>{`Step ${visibleStep} of ${totalSteps}`}</small>
                </Card.Header>

                <Card.Body className={styles.wizardBody}>{renderCurrentStep()}</Card.Body>

                <Card.Footer className={styles.wizardFooter}>
                    <div className={styles.navigationButtons}>
                        <Button variant="outline-secondary" onClick={handleBack} disabled={currentStep === 1 || slotPurchaseBusy} className={styles.backButton}>
                            <ChevronLeft /> Back
                        </Button>

                        {visibleStep === totalSteps && (
                            <div className={styles.finalStep}>
                                <small>Complete your purchase using the options above</small>
                            </div>
                        )}
                    </div>
                </Card.Footer>
            </Card>
        </div>
    )
}

export default PremiumPurchaseWizard
