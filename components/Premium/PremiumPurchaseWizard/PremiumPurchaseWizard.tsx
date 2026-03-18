'use client'
import { useState, useEffect } from 'react'
import { Button, Card, ProgressBar } from 'react-bootstrap'
import { ChevronLeft } from '@mui/icons-material'
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
    const [urlDiscountCode, setUrlDiscountCode] = useState<string | null>(null)
    const [countryCode, setCountryCode] = useState<string>('US')

    const totalSteps = 4

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('countryCode')
            if (stored) setCountryCode(stored)
        }
    }, [])

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
                setCurrentStep(2) // Skip to payment method step
            }
        } else if (hasActivePremium()) {
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
                    return `Upgrade Your ${currentTier === PremiumTier.STARTER ? 'Starter Premium' : currentTier === PremiumTier.PREMIUM ? 'Premium' : 'Premium Plus'
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

    // Auto-advance handlers for each step
    const handleTierSelect = (tier: PremiumTier) => {
        setSelectedTier(tier)
        // Auto-advance to next step
        setCurrentStep(2)
    }

    const handleTypeSelect = (type: PurchaseType) => {
        setSelectedType(type)
        // Auto-advance to next step
        setCurrentStep(3)
    }

    const handleDurationSelect = (duration: Duration) => {
        setSelectedDuration(duration)
        // Auto-advance to next step
        setCurrentStep(4)
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
                        onTierSelect={handleTierSelect}
                        currentTier={currentTier}
                        isUpgrade={isUpgrade}
                        suggestedTier={suggestedTier}
                        activePremiumProduct={props.activePremiumProduct}
                        onCountryCodeChange={setCountryCode}
                    />
                )
            case 2:
                return <PaymentMethodStep selectedType={selectedType} onTypeSelect={handleTypeSelect} />
            case 3:
                return (
                    <DurationSelectionStep
                        selectedType={selectedType!}
                        selectedTier={selectedTier!}
                        selectedDuration={selectedDuration}
                        onDurationSelect={handleDurationSelect}
                        countryCode={countryCode}
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
                        initialDiscountCode={urlDiscountCode}
                        countryCode={countryCode}
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

                        {currentStep === totalSteps && (
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
