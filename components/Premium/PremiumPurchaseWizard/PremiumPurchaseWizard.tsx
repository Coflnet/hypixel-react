'use client'
import { useState, useEffect } from 'react'
import { Button, Card, ProgressBar } from 'react-bootstrap'
import { ChevronLeft } from '@mui/icons-material'
import styles from './PremiumPurchaseWizard.module.css'
import { PremiumTier, PurchaseType, Duration } from './types'
import { TierSelectionStep, PaymentMethodStep, DurationSelectionStep, PurchaseCompletionStep } from './Steps'
import { PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import { parseTierFromUrl } from '../../../utils/PremiumUpgradeUtils'
import { getActiveSubscriptionDiscount } from '../../../utils/DiscountUtils'
import { useCountryDetection } from '../../../hooks/useCountryDetection'
import SlotPurchase from '../SlotPurchase/SlotPurchase'
import PackageSelectionStep from './Steps/PackageSelectionStep'
import useSlotCatalog from '../../../hooks/useSlotCatalog'

interface Props {
    showSlots: boolean
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
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

    const totalSteps = props.showSlots || slotCount > 0 || selectedTier === PremiumTier.STARTER ? 4 : 5
    const visibleStep = currentStep - ((slotCount > 0 && currentStep === 5) || (selectedTier === PremiumTier.STARTER && currentStep >= 4) ? 1 : 0)

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

        const preSelectedTier = parseTierFromUrl(tierParam)

        if (preSelectedTier) {
            setSelectedTier(preSelectedTier)

            const currentTier = getCurrentTier()
            const currentTierRank = currentTier ? getTierRank(currentTier) : 0
            const selectedTierRank = getTierRank(preSelectedTier)

            if (preSelectedTier === PremiumTier.PREMIUM_PLUS || (currentTier && selectedTierRank > currentTierRank)) {
                setCurrentStep(2) // Skip to payment for a preselected tier
            }
        } else if (hasActivePremium()) {
            const suggestedTier = props.showSlots ? null : getSuggestedUpgradeTier()
            if (suggestedTier) {
                setSelectedTier(suggestedTier)
            }
        }
    }, [props.activePremiumProduct])

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
        if (currentStep > 1) {
            setCurrentStep(currentStep === 5 && slotCount > 0 ? 3 : currentStep === 4 && selectedTier === PremiumTier.STARTER ? 2 : currentStep - 1)
        }
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
