'use client'
import { useState } from 'react'
import { Button, Card, ProgressBar } from 'react-bootstrap'
import { ChevronLeft, ChevronRight, CheckCircle } from '@mui/icons-material'
import styles from './PremiumPurchaseWizard.module.css'
import BuySubscription from '../BuySubscription/BuySubscription'
import BuyPremium from '../BuyPremium/BuyPremium'

interface Props {
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
    cancellationRightLossConfirmed: boolean
}

enum PremiumTier {
    STARTER = 'starter',
    PREMIUM = 'premium',
    PREMIUM_PLUS = 'premium_plus'
}

enum PurchaseType {
    SUBSCRIPTION = 'subscription',
    COFLCOINS = 'coflcoins'
}

enum Duration {
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
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

    const renderStep1 = () => (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>Which premium tier would you like?</h4>
            <div className={styles.optionsGrid}>
                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.STARTER ? styles.selected : ''}`}
                    onClick={() => setSelectedTier(PremiumTier.STARTER)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>⭐</div>
                        <h5>Starter Premium</h5>
                        <p>Essential features for casual players</p>
                        <ul className={styles.featureList}>
                            <li>Basic price alerts</li>
                            <li>Everything you need to start</li>
                            <li>Ad-free experience</li>
                        </ul>
                    </Card.Body>
                </Card>

                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.PREMIUM ? styles.selected : ''}`}
                    onClick={() => setSelectedTier(PremiumTier.PREMIUM)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🌟</div>
                        <h5>Premium</h5>
                        <p>All Starter features plus advanced tools</p>
                        <small className={styles.recommendation}>Most Popular</small>
                        <ul className={styles.featureList}>
                            <li>Optimized bazaar flips</li>
                            <li>1 year auction house searches</li>
                            <li>Lowball helper</li>
                        </ul>
                    </Card.Body>
                </Card>

                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.PREMIUM_PLUS ? styles.selected : ''}`}
                    onClick={() => setSelectedTier(PremiumTier.PREMIUM_PLUS)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🚀🤯</div>
                        <h5>Premium Plus</h5>
                        <p>All Premium features plus exclusive access</p>
                        <ul className={styles.featureList}>
                            <li>Fastest auction flips</li>
                            <li>Data export & API access</li>
                            <li>Advanced market analysis</li>
                            <li>Advanced money making methods (soon™️)</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>
        </div>
    )

    const renderStep2 = () => {
        return (
            <div className={styles.stepContent}>
                <h4 className={styles.stepQuestion}>How would you like to pay?</h4>
                <div className={styles.optionsGrid}>
                    <Card 
                        className={`${styles.optionCard} ${selectedType === PurchaseType.SUBSCRIPTION ? styles.selected : ''}`}
                        onClick={() => setSelectedType(PurchaseType.SUBSCRIPTION)}
                    >
                        <Card.Body className={styles.optionBody}>
                            <div className={styles.optionIcon}>💳</div>
                            <h5>Subscription</h5>
                            <p>cancel any time (on this page)</p>
                            <small className={styles.recommendation}>Most Popular</small>
                        </Card.Body>
                    </Card>

                    <Card 
                        className={`${styles.optionCard} ${selectedType === PurchaseType.COFLCOINS ? styles.selected : ''}`}
                        onClick={() => setSelectedType(PurchaseType.COFLCOINS)}
                    >
                        <Card.Body className={styles.optionBody}>
                            <div className={styles.optionIcon}>🪙</div>
                            <h5>CoflCoins</h5>
                            <p>That you bought/earned/got gifted</p>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        )
    }

    const renderStep3 = () => {
        if (selectedType === PurchaseType.COFLCOINS) {
            return (
                <div className={styles.stepContent}>
                    <h4 className={styles.stepQuestion}>Ready to purchase with CoflCoins?</h4>
                    <p>You can use your earned CoflCoins to purchase {selectedTier === PremiumTier.STARTER ? 'Starter Premium' : selectedTier === PremiumTier.PREMIUM ? 'Premium' : 'Premium Plus'}.</p>
                    <div className={styles.infoBox}>
                        <CheckCircle className={styles.checkIcon} />
                        <span>This step will take you directly to the purchase options.</span>
                    </div>
                </div>
            )
        }

        return (
            <div className={styles.stepContent}>
                <h4 className={styles.stepQuestion}>How long would you like your subscription?</h4>
                <div className={styles.optionsGrid}>
                    <Card 
                        className={`${styles.optionCard} ${selectedDuration === Duration.MONTHLY ? styles.selected : ''}`}
                        onClick={() => setSelectedDuration(Duration.MONTHLY)}
                    >
                        <Card.Body className={styles.optionBody}>
                            <div className={styles.optionIcon}>📅</div>
                            <h5>Monthly</h5>
                            <p>Flexible monthly subscription</p>
                        </Card.Body>
                    </Card>

                    <Card 
                        className={`${styles.optionCard} ${selectedDuration === Duration.YEARLY ? styles.selected : ''}`}
                        onClick={() => setSelectedDuration(Duration.YEARLY)}
                    >
                        <Card.Body className={styles.optionBody}>
                            <div className={styles.optionIcon}>🎯</div>
                            <h5>Yearly</h5>
                            <p>Best value - save with annual billing</p>
                            <small className={styles.recommendation}>Best Value</small>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        )
    }

    const renderStep4 = () => {
        return (
            <div className={styles.stepContent}>
                <h4 className={styles.stepQuestion}>Complete your purchase</h4>
                <div className={styles.summaryBox}>
                    <h6>Your Selection:</h6>
                    <p><strong>Tier:</strong> {selectedTier === PremiumTier.STARTER ? 'Starter Premium' : selectedTier === PremiumTier.PREMIUM ? 'Premium' : 'Premium Plus'}</p>
                    <p><strong>Type:</strong> {selectedType === PurchaseType.SUBSCRIPTION ? 'Subscription' : 'CoflCoins'}</p>
                    {selectedDuration && (
                        <p><strong>Duration:</strong> {selectedDuration === Duration.MONTHLY ? 'Monthly' : 'Yearly'}</p>
                    )}
                </div>
                
                <div className={styles.purchaseComponent}>
                    {selectedType === PurchaseType.SUBSCRIPTION && (
                        <BuySubscription activePremiumProduct={props.activePremiumProduct} />
                    )}
                    {selectedType === PurchaseType.COFLCOINS && (
                        <BuyPremium 
                            activePremiumProduct={props.activePremiumProduct}
                            premiumSubscriptions={props.premiumSubscriptions}
                            onNewActivePremiumProduct={props.onNewActivePremiumProduct}
                        />
                    )}
                </div>
            </div>
        )
    }

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1()
            case 2: return renderStep2()
            case 3: return renderStep3()
            case 4: return renderStep4()
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
