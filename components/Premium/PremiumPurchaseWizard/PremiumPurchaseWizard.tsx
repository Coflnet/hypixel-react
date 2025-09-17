'use client'
import { useState } from 'react'
import { Button, Card, ProgressBar } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import styles from './PremiumPurchaseWizard.module.css'
import { PremiumTier, PurchaseType, Duration } from './types'
import { TierSelectionStep, PaymentMethodStep, DurationSelectionStep, PurchaseCompletionStep } from './Steps'

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

    const totalSteps = 4

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Choose Your Premium Tier"
            case 2: return "Choose Your Plan Type"
            case 3: return "Select Duration"
            case 4: return "Complete Purchase"
            default: return "Premium Purchase"
        }
    }

    const canProceed = () => {
        switch (currentStep) {
            case 1: return selectedTier !== null
            case 2: return selectedType !== null
            case 3: return selectedDuration !== null || selectedType === PurchaseType.COFLCOINS
            case 4: return true
            default: return false
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
        switch (currentStep) {
            case 1: 
                return (
                    <TierSelectionStep 
                        selectedTier={selectedTier}
                        onTierSelect={setSelectedTier}
                    />
                )
            case 2: 
                return (
                    <PaymentMethodStep 
                        selectedType={selectedType}
                        onTypeSelect={setSelectedType}
                    />
                )
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
                    />
                )
            default: return null
        }
    }

    return (
        <div className={styles.wizard}>
            <Card className={styles.wizardCard}>
                <Card.Header className={styles.wizardHeader}>
                    <h3>{getStepTitle()}</h3>
                    <ProgressBar 
                        now={(currentStep / totalSteps) * 100} 
                        className={styles.progressBar}
                        variant="success"
                    />
                    <small className={styles.stepIndicator}>Step {currentStep} of {totalSteps}</small>
                </Card.Header>
                
                <Card.Body className={styles.wizardBody}>
                    {renderCurrentStep()}
                </Card.Body>

                <Card.Footer className={styles.wizardFooter}>
                    <div className={styles.navigationButtons}>
                        <Button 
                            variant="outline-secondary" 
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={styles.backButton}
                        >
                            <ChevronLeft /> Back
                        </Button>
                        
                        {currentStep < totalSteps ? (
                            <Button 
                                variant="primary" 
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className={styles.nextButton}
                            >
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
