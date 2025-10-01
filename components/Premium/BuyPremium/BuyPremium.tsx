'use client'
import { ChangeEvent, useState, useEffect } from 'react'
import { Button, Card, Form, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { useCoflCoins } from '../../../utils/Hooks'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import { CoflCoinsDisplay } from '../../CoflCoins/CoflCoinsDisplay'
import Number from '../../Number/Number'
import styles from './BuyPremium.module.css'
import BuyPremiumConfirmationDialog from '../BuyPremiumConfirmationDialog/BuyPremiumConfirmationDialog'
import { PremiumTier, Duration, getTierDisplayName } from '../PremiumPurchaseWizard/types'

interface Props {
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct()
    selectedTier?: PremiumTier
    selectedDuration?: Duration | null
}

// Helper function to find the best matching premium option based on wizard duration
const findMatchingPremiumOption = (premiumType: PremiumType, wizardDuration: Duration | null | undefined): PremiumTypeOption => {
    if (!wizardDuration) return premiumType.options[0]

    const durationOption = premiumType.options.find(option => {
        const labelStr = typeof option.label === 'string' ? option.label : String(option.label)
        const lowerLabel = labelStr.toLowerCase()

        switch (wizardDuration) {
            case Duration.HOUR:
                return lowerLabel.includes('hour')
            case Duration.DAY:
                return lowerLabel.includes('day') && !lowerLabel.includes('week')
            case Duration.WEEK:
                return lowerLabel.includes('week') && !lowerLabel.includes('month')
            case Duration.MONTHLY:
                return lowerLabel.includes('month') || lowerLabel.includes('4 weeks')
            case Duration.QUARTER:
                return lowerLabel.includes('11 weeks') || lowerLabel.includes('6 months')
            case Duration.YEARLY:
                return lowerLabel.includes('year') || lowerLabel.includes('12 months')
            default:
                return false
        }
    })

    return durationOption || premiumType.options[0]
}

function BuyPremium(props: Props) {
    // Get initial premium type based on selected tier
    const getInitialPremiumType = () => {
        if (!props.selectedTier) return PREMIUM_TYPES[0]

        switch (props.selectedTier) {
            case PremiumTier.STARTER:
                return PREMIUM_TYPES.find(type => type.productId === 'starter_premium') || PREMIUM_TYPES[0]
            case PremiumTier.PREMIUM:
                return PREMIUM_TYPES.find(type => type.productId === 'premium') || PREMIUM_TYPES[0]
            case PremiumTier.PREMIUM_PLUS:
                return PREMIUM_TYPES.find(type => type.productId === 'premium_plus') || PREMIUM_TYPES[0]
            default:
                return PREMIUM_TYPES[0]
        }
    }

    const initialPremiumType = getInitialPremiumType()
    let [purchasePremiumType, setPurchasePremiumType] = useState<PremiumType>(initialPremiumType)
    let [purchaseSuccessfulOption, setPurchaseSuccessfulDuration] = useState<PremiumTypeOption>()
    let [isPurchasing, setIsPurchasing] = useState(false)
    let [purchasePremiumOption, setPurchasePremiumOption] = useState<PremiumTypeOption>(findMatchingPremiumOption(initialPremiumType, props.selectedDuration))
    let [showPrepaidConfirmationDialog, setShowPrepaidConfirmationDialog] = useState(false)
    let coflCoins = useCoflCoins()

    // Set initial selection based on wizard choices
    useEffect(() => {
        const premiumType = getInitialPremiumType()
        setPurchasePremiumType(premiumType)

        // Use the helper function to find the best matching option
        const initialOption = findMatchingPremiumOption(premiumType, props.selectedDuration)
        setPurchasePremiumOption(initialOption)
    }, [props.selectedTier, props.selectedDuration])

    function onDurationChange(event: ChangeEvent<HTMLSelectElement>) {
        let option = JSON.parse(event.target.value)
        setPurchasePremiumOption(option)
    }

    function onPremiumTypeChange(productId) {
        let selectedType = PREMIUM_TYPES.find(type => type.productId === productId)
        if (selectedType) {
            setPurchasePremiumType(selectedType)
            setPurchasePremiumOption(selectedType.options[0])
        }
    }

    function onPremiumBuy(googleToken: string) {
        setShowPrepaidConfirmationDialog(false)
        setIsPurchasing(true)

        api.purchaseWithCoflcoins(purchasePremiumOption.productId, googleToken, purchasePremiumOption.value).then(() => {
            document.dispatchEvent(
                new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, {
                    detail: { coflCoins: coflCoins - getPurchasePrice() }
                })
            )
            setPurchaseSuccessfulDuration(purchasePremiumOption)
            setIsPurchasing(false)
            toast.success('Purchase successful')
            props.onNewActivePremiumProduct()
        })
    }

    function onPremiumBuyCancel() {
        setShowPrepaidConfirmationDialog(false)
    }

    function getPurchasePrice() {
        return purchasePremiumOption.value * purchasePremiumOption.price
    }

    function getDurationString(): string {
        let durationString = purchasePremiumType.durationString
        let duration = +purchasePremiumOption.value
        if (durationString && duration > 1) {
            durationString += 's'
        }
        return durationString
    }

    function getPremiumToggleButtonStyle(premiumType: PremiumType) {
        switch (premiumType.productId) {
            case 'premium':
                return { color: 'var(--bs-success)' }
            case 'premium_plus':
                return { color: 'var(--bs-body-color)' }
            default:
                return {}
        }
    }

    const getDisplayTierName = () => {
        return props.selectedTier ? getTierDisplayName(props.selectedTier) : purchasePremiumType.label
    }

    const getDurationDisplayName = () => {
        if (!props.selectedDuration) return getDurationString()
        switch (props.selectedDuration) {
            case Duration.HOUR:
                return '1 Hour'
            case Duration.WEEK:
                return '1 Week'
            case Duration.MONTHLY:
                return 'Monthly'
            case Duration.QUARTER:
                return 'Quarterly'
            case Duration.YEARLY:
                return 'Yearly'
            default:
                return getDurationString()
        }
    }

    // If coming from wizard, show only the selected option with summary
    if (props.selectedTier && props.selectedDuration !== undefined) {
        return (
            <>
                <div className={styles.summarySection}>
                    <h6>Your Selection:</h6>
                    <p>
                        <strong>Tier:</strong>{' '}
                        <span
                            className={`${styles.summaryValue} ${props.selectedTier === PremiumTier.PREMIUM ? styles.tierPremium : ''} ${
                                props.selectedTier === PremiumTier.PREMIUM_PLUS ? styles.tierPremiumPlus : ''
                            }`}
                        >
                            {getDisplayTierName()}
                        </span>
                    </p>
                    <p>
                        <strong>Payment Method:</strong> CoflCoins
                    </p>
                    <p>
                        <strong>Duration:</strong> {purchasePremiumOption.value > 1 ? purchasePremiumOption.value + 'x' : ''}
                        {purchasePremiumOption.label}
                    </p>
                    <p>
                        <strong>Price:</strong> <Number number={getPurchasePrice()} /> CoflCoins
                    </p>
                </div>

                <div className={styles.balanceSection}>
                    <div className={styles.coinBalance}>
                        <CoflCoinsDisplay />
                    </div>
                    {coflCoins >= getPurchasePrice() ? (
                        <p className={styles.remainingBalance}>
                            <strong>Remaining after purchase:</strong> <Number number={coflCoins - getPurchasePrice()} /> CoflCoins
                        </p>
                    ) : (
                        <p className={styles.insufficientFunds}>You don't have enough CoflCoins for this purchase, scroll down to buy more!</p>
                    )}
                </div>

                <div className={styles.featuresSection}>
                    <h6>What you'll get:</h6>
                    <ul>
                        {props.selectedTier === PremiumTier.PREMIUM_PLUS ? (
                            <>
                                <li>Top flip receive time</li>
                                <li>All tools for analysis</li>
                                <li>Full auction archive</li>
                                <li>Data export & API access</li>
                            </>
                        ) : props.selectedTier === PremiumTier.PREMIUM ? (
                            <>
                                <li>Up to 1s slower than Premium+</li>
                                <li>A lot of tools</li>
                                <li>Extended history & filter access</li>
                            </>
                        ) : (
                            <>
                                <li>Premium flip notifications</li>
                                <li>Basic tools and analysis</li>
                                <li>Limited history access</li>
                            </>
                        )}
                    </ul>
                </div>

                <div className={styles.purchaseInfo}>
                    <p>This is a prepaid service. We won't automatically charge you after your premium time runs out!</p>
                </div>

                <div className={styles.purchaseButtonContainer}>
                    <Button
                        variant="success"
                        size="lg"
                        className={styles.purchaseButton}
                        onClick={() => setShowPrepaidConfirmationDialog(true)}
                        disabled={getPurchasePrice() > coflCoins || isPurchasing}
                    >
                        Purchase for <Number number={getPurchasePrice()} /> CoflCoins
                    </Button>
                </div>
                <BuyPremiumConfirmationDialog
                    type="prepaid"
                    show={showPrepaidConfirmationDialog}
                    durationString={getDurationString()}
                    purchasePremiumOption={purchasePremiumOption}
                    purchasePrice={
                        <>
                            <Number number={getPurchasePrice()} /> CoflCoins
                        </>
                    }
                    purchasePremiumType={purchasePremiumType}
                    onHide={onPremiumBuyCancel}
                    onConfirm={onPremiumBuy}
                    activePremiumProduct={props.activePremiumProduct}
                />
            </>
        )
    }

    return (
        <>
            <Card className={styles.purchaseCard}>
                <Card.Header>
                    <Card.Title>Buy premium for a certain duration with your CoflCoins. Your premium time starts shortly after your purchase.</Card.Title>
                </Card.Header>
                <div style={{ padding: '15px' }}>
                    {!purchaseSuccessfulOption ? (
                        <div>
                            <div style={{ marginBottom: '15px' }}>
                                <label className={styles.label}>Premium type:</label>
                                <ToggleButtonGroup
                                    className={styles.premiumTypeGroup}
                                    type="radio"
                                    name="options"
                                    value={purchasePremiumType.productId}
                                    onChange={onPremiumTypeChange}
                                >
                                    {PREMIUM_TYPES.map(premiumType => (
                                        <ToggleButton
                                            id={premiumType.productId}
                                            key={premiumType.productId}
                                            value={premiumType.productId}
                                            className={styles.priceRangeButton}
                                            size="lg"
                                            variant="primary"
                                            style={getPremiumToggleButtonStyle(premiumType)}
                                        >
                                            {premiumType.label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                <div className={styles.coinBalance}>
                                    <CoflCoinsDisplay />
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label className={styles.label}>Purchase Duration:</label>
                                <Form.Select
                                    onChange={onDurationChange}
                                    className={styles.dropdown}
                                    key={purchasePremiumType.productId}
                                    defaultValue={purchasePremiumOption.value}
                                >
                                    {purchasePremiumType.options.map(option => {
                                        return (
                                            <option key={option.label} value={JSON.stringify(option)}>
                                                {option.label}
                                            </option>
                                        )
                                    })}
                                </Form.Select>
                                <span style={{ marginLeft: '20px' }}>{getDurationString()}</span>
                            </div>
                            <div>
                                <label className={styles.label}>Price:</label>
                                <span style={{ fontWeight: 'bold' }}>
                                    <Number number={getPurchasePrice()} /> Coins
                                </span>
                            </div>
                            {coflCoins >= getPurchasePrice() ? (
                                <div>
                                    <label className={styles.label}>Remaining after Purchase:</label>
                                    <span>
                                        <Number number={coflCoins - getPurchasePrice()} /> Coins
                                    </span>
                                </div>
                            ) : null}
                            <p style={{ marginTop: '20px' }}>This is a prepaid service. We won't automatically charge you after your premium time runs out!</p>
                            <hr />
                            <Button
                                style={{ marginTop: '10px' }}
                                variant="success"
                                onClick={() => {
                                    setShowPrepaidConfirmationDialog(true)
                                }}
                                disabled={getPurchasePrice() > coflCoins || isPurchasing}
                            >
                                Purchase
                            </Button>
                            {getPurchasePrice() > coflCoins && !isPurchasing ? (
                                <span>
                                    <p>
                                        <span style={{ color: 'red' }}>You don't have enough CoflCoins to buy this.</span>{' '}
                                    </p>
                                </span>
                            ) : (
                                ''
                            )}
                        </div>
                    ) : (
                        <p style={{ color: 'lime' }}>
                            You successfully bought {purchaseSuccessfulOption.label} {getDurationString()} of {purchasePremiumType.label} for{' '}
                            <Number number={getPurchasePrice()} /> CoflCoins!
                        </p>
                    )}
                </div>
            </Card>
            <BuyPremiumConfirmationDialog
                type="prepaid"
                show={showPrepaidConfirmationDialog}
                durationString={getDurationString()}
                purchasePremiumOption={purchasePremiumOption}
                purchasePrice={
                    <>
                        <Number number={getPurchasePrice()} /> CoflCoins
                    </>
                }
                purchasePremiumType={purchasePremiumType}
                onHide={onPremiumBuyCancel}
                onConfirm={onPremiumBuy}
                activePremiumProduct={props.activePremiumProduct}
            />
        </>
    )
}

export default BuyPremium
