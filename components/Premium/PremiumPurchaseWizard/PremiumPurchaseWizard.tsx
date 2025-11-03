'use client'
import { useState, useEffect } from 'react'
import { Button, Card, ProgressBar } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import styles from './PremiumPurchaseWizard.module.css'
import { PremiumTier, PurchaseType, Duration } from './types'
import { TierSelectionStep, PaymentMethodStep, DurationSelectionStep, PurchaseCompletionStep } from './Steps'
import { PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import { parseTierFromUrl } from '../../../utils/PremiumUpgradeUtils'

interface Props {
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
    cancellationRightLossConfirmed: boolean
}

function PremiumPurchaseWizard(props: Props) {
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedTier, setSelectedTier] = useState<PremiumTier | null>(null)
    const [selectedType, setSelectedType] = useState<PurchaseType | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<Duration | null>(null)
    const [creatorCode, setCreatorCode] = useState('')

    const totalSteps = 4

    // Helper function to get current tier from active premium product
    const getCurrentTier = (): PremiumTier | null => {
        if (!props.activePremiumProduct) return null

        const productSlug = props.activePremiumProduct.productSlug
        if (productSlug.includes('starter')) return PremiumTier.STARTER
        if (productSlug.includes('premium_plus') || productSlug.includes('premium+')) return PremiumTier.PREMIUM_PLUS
        if (productSlug.includes('premium')) return PremiumTier.PREMIUM

        return null
    }

    // Helper function to get tier rank for comparison
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

    // Helper function to check if user has active premium
    const hasActivePremium = (): boolean => {
        return props.activePremiumProduct && props.activePremiumProduct.expires.getTime() > new Date().getTime()
    }

    // Helper function to get suggested upgrade tier
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

    // Initialize wizard based on URL parameters and current state
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const tierParam = urlParams.get('tier')

        // If tier is specified in URL, pre-select it
        const preSelectedTier = parseTierFromUrl(tierParam)

        if (preSelectedTier) {
            setSelectedTier(preSelectedTier)

            // Skip tier selection step if it's premium+ or if user already has a lower tier
            const currentTier = getCurrentTier()
            const currentTierRank = currentTier ? getTierRank(currentTier) : 0
            const selectedTierRank = getTierRank(preSelectedTier)

            if (preSelectedTier === PremiumTier.PREMIUM_PLUS || (currentTier && selectedTierRank > currentTierRank)) {
                setCurrentStep(2) // Skip to payment method step
            }
        } else if (hasActivePremium()) {
            // If user has active premium but no tier specified, suggest upgrade
            const suggestedTier = getSuggestedUpgradeTier()
            if (suggestedTier) {
                setSelectedTier(suggestedTier)
            }
        }
    }, [props.activePremiumProduct])

    const getStepTitle = () => {
        const currentTier = getCurrentTier()
        const isUpgrade = !!(hasActivePremium() && currentTier)

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
                return 'Select Duration'
            case 4:
                return isUpgrade ? 'Complete Upgrade' : 'Complete Purchase'
            default:
                return 'Premium Purchase'
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return selectedTier !== null
            case 2:
                return selectedType !== null
            case 3:
                return selectedDuration !== null || selectedType === PurchaseType.COFLCOINS
            case 4:
                return true
            default:
                return false
        }
    }

    const handleNext = () => {
        if (canProceed() && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const renderCurrentStep = () => {
        const currentTier = getCurrentTier()
        const isUpgrade = !!(hasActivePremium() && currentTier)
        const suggestedTier = getSuggestedUpgradeTier()

        switch (currentStep) {
            case 1:
                return (
                    <TierSelectionStep
                        selectedTier={selectedTier}
                        onTierSelect={setSelectedTier}
                        currentTier={currentTier}
                        isUpgrade={isUpgrade}
                        suggestedTier={suggestedTier}
                        activePremiumProduct={props.activePremiumProduct}
                    />
                )
            case 2:
                return <PaymentMethodStep selectedType={selectedType} onTypeSelect={setSelectedType} />
            case 3:
                return (
                    <DurationSelectionStep
                        selectedType={selectedType!}
                        selectedTier={selectedTier!}
                        selectedDuration={selectedDuration}
                        onDurationSelect={(duration: Duration) => setSelectedDuration(duration)}
                    />
                )
            case 4:
                return (
                    <PurchaseCompletionStep
                        selectedTier={selectedTier!}
                        selectedType={selectedType!}
                        selectedDuration={selectedDuration}
                        activePremiumProduct={props.activePremiumProduct}
                        premiumSubscriptions={props.premiumSubscriptions}
                        onNewActivePremiumProduct={props.onNewActivePremiumProduct}
                        creatorCode={creatorCode}
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
                    <ProgressBar now={(currentStep / totalSteps) * 100} className={styles.progressBar} variant="success" />
                    <small className={styles.stepIndicator}>
                        Step {currentStep} of {totalSteps}
                    </small>
                </Card.Header>

                <Card.Body className={styles.wizardBody}>{renderCurrentStep()}</Card.Body>

                <Card.Footer className={styles.wizardFooter}>
                    <div className={styles.navigationButtons}>
                        <Button variant="outline-secondary" onClick={handleBack} disabled={currentStep === 1} className={styles.backButton}>
                            <ChevronLeft /> Back
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button variant="primary" onClick={handleNext} disabled={!canProceed()} className={styles.nextButton}>
                                Next <ChevronRight />
                            </Button>
                        ) : (
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
