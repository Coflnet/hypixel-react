import { useState } from 'react'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import api from '../../../api/ApiHelper'
import { Button, Card, Col, Row } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import NumberElement from '../../Number/Number'
import { toast } from 'react-toastify'
import { Duration, PremiumTier, getTierDisplayName } from '../PremiumPurchaseWizard/types'

interface Props {
    activePremiumProduct: PremiumProduct
    selectedTier?: PremiumTier
    selectedDuration?: Duration | null
}

function BuySubscription(props: Props) {
    const [selectedPremiumType, setSelectedPremiumType] = useState<PremiumType>()
    const [isYearOption, setIsYearOption] = useState<boolean>()

    // If we have wizard selections, use them to determine the selected type and duration
    const wizardSelectedType = props.selectedTier ?
        PREMIUM_TYPES.find(type => {
            switch (props.selectedTier) {
                case PremiumTier.PREMIUM: return type.productId === 'premium'
                case PremiumTier.PREMIUM_PLUS: return type.productId === 'premium_plus'
                case PremiumTier.STARTER: return type.productId === 'starter_premium'
                default: return type.productId === 'premium'
            }
        }) : undefined

    const wizardIsYearOption = props.selectedDuration === Duration.YEARLY

    const getDisplayTierName = () => {
        return props.selectedTier ? getTierDisplayName(props.selectedTier) : 'Premium'
    }

    function getSubscriptionPrice() {
        const targetType = selectedPremiumType || wizardSelectedType
        console.log('targetType', targetType, selectedPremiumType, wizardSelectedType)
        if (!targetType) {
            return -1
        }
        const yearOption = isYearOption !== undefined ? isYearOption : wizardIsYearOption

        if (targetType.productId === 'premium') {
            return yearOption ? 96.69 : 8.69
        }
        if (targetType.productId === 'premium_plus') {
            return yearOption ? 354.20 : 35.69
        }
        if (targetType.productId === 'starter_premium') {
            return 16.99 // only yearly option
        }
        return -1
    }

    function startSubscriptionPurchase(targetType: PremiumType, yearOption: boolean) {
        if (!targetType) return
        const googleToken = sessionStorage.getItem('googleId')
        if (!googleToken) {
            toast.error('Please login to continue with the purchase')
            return
        }

        let productId = ''
        if (targetType.productId === 'premium') {
            productId = 'l_premium'
        }
        if (targetType.productId === 'premium_plus') {
            productId = 'l_prem_plus'
        }
        if (targetType.productId === 'starter_premium') {
            productId = 'l_starter_premium'
        }
        if (yearOption) {
            productId += '-year'
        }

        api.purchasePremiumSubscription(productId, googleToken).then(data => {
            window.open(data.directLink, '_self')
        }).catch(() => {
            toast.error('Failed to redirect to payment provider. Please try again.')
        })
    }

    // If coming from wizard, show only the selected option with summary
    if (props.selectedTier && props.selectedDuration !== undefined) {
        const targetType = wizardSelectedType!
        const yearOption = wizardIsYearOption
        const price = getSubscriptionPrice()

        return (
            <>
                <Card className={styles.selectedOptionCard}>
                    <Card.Header>
                        <Card.Title>Complete Your {getDisplayTierName()} Subscription</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className={styles.summarySection}>
                            <h6>Your Selection:</h6>
                            <p><strong>Tier:</strong> <span className={`${styles.summaryValue} ${props.selectedTier === PremiumTier.PREMIUM ? styles.tierPremium : ''} ${props.selectedTier === PremiumTier.PREMIUM_PLUS ? styles.tierPremiumPlus : ''}`}>{getDisplayTierName()}</span></p>
                            <p><strong>Billing:</strong> {yearOption ? 'Yearly (52 weeks)' : 'Monthly (4 weeks)'}</p>
                            <p>{yearOption ? (
                                <>
                                    <strong>Price:</strong> <NumberElement number={price} /> Euro (+VAT) per year&nbsp;<br/>
                                    (<NumberElement number={parseFloat((price / 13).toFixed(2))} /> Euro (+VAT) per 4 weeks)
                                </>
                            ) : (
                                <>
                                    <strong>Price:</strong> <NumberElement number={price} /> Euro (+VAT) per 4 weeks
                                </>
                            )}
                                </p>
                            {yearOption && (
                                <>
                                    {targetType.productId !== 'starter_premium' && (
                                        <p className={styles.discount}>
                                            <strong>Savings:</strong> {targetType.productId === 'premium_plus' ? '23%' : '14%'} off compared to monthly billing
                                        </p>
                                    )}
                                    <p>
                                        You qualify for using code <code>M2OTC1OQ</code> at checkout, to get an extra <strong>20% discount</strong> on the yearly option
                                    </p>
                                </>
                            )}
                        </div>

                        <div className={styles.featuresSection}>
                            <h6>What you'll get:</h6>
                            <ul>
                                {targetType.productId === 'premium_plus' ? (
                                    <>
                                        <li>Top flip receive time</li>
                                        <li>All tools for analysis</li>
                                        <li>Full auction archive</li>
                                        <li>Data export & API access</li>
                                    </>
                                ) : targetType.productId === 'starter_premium' ? (
                                    <>
                                        <li>Ad-free experience</li>
                                        <li>Extended limits across features</li>
                                        <li>Starter tools & access</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Up to 1s slower than Premium+</li>
                                        <li>A lot of tools</li>
                                        <li>Extended history & filter access</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <div className={styles.purchaseButtonContainer}>
                            <Button
                                variant="success"
                                size="lg"
                                className={styles.purchaseButton}
                                onClick={() => {
                                    setSelectedPremiumType(targetType)
                                    setIsYearOption(yearOption)
                                    startSubscriptionPurchase(selectedPremiumType || wizardSelectedType!, isYearOption !== undefined ? isYearOption : wizardIsYearOption)
                                    const activeEl = document.activeElement as HTMLElement | null;
                                    if (activeEl && activeEl.tagName === 'BUTTON') {
                                        activeEl.innerText = 'Redirecting to payment provider...';
                                        (activeEl as HTMLButtonElement).disabled = true;
                                    }
                                }}
                            >
                                Continue to our secure payment processor
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </>
        )
    }

    return (
        <>
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title><b>Premium+</b></Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <ul>
                                <li>top flip receive time</li>
                                <li>all tools for analysis</li>
                                <li>full auction archive</li>
                            </ul>
                            <div className={styles.purchaseButtonContainer}>
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        setIsYearOption(false)
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium_plus'))
                                    }}
                                >
                                    <NumberElement number={35.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {(!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3) ?
                                    (<><p>Use code <code>M2OTC1OQ</code> at checkout, to get a <b>20% discount</b> on the yearly options</p>
                                        <Button
                                            variant="success"
                                            className={styles.purchaseButton}
                                            onClick={() => {
                                                setIsYearOption(true)
                                                setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium_plus'))
                                            }}
                                        >
                                            <NumberElement number={354.20} /> Euro (+VAT) / 52 weeks (23% off)
                                        </Button>
                                    </>) : null}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title>Premium</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <ul>
                                <li>up to 1s slower than prem+</li>
                                <li>a lot of tools</li>
                                <li>extended history & filter access</li>
                            </ul>
                            <div className={styles.purchaseButtonContainer}>
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium'))
                                    }}
                                >
                                    <NumberElement number={8.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {(!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3) ?
                                    (<p>Use code <code>M2OTC1OQ</code> at checkout, to get an extra <b>20% discount</b> on the yearly options</p>) : null}
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        setIsYearOption(true)
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium'))
                                    }}
                                >
                                    <NumberElement number={96.69} /> Euro (+VAT) / 52 weeks (14% off)
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    )
}

export default BuySubscription
