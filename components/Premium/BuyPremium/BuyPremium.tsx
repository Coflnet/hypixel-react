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
import { TierUpsellPanel } from '../../Discounts/DiscountBanners'
import discountStyles from '../../Discounts/Discounts.module.css'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import stepStyles from '../PremiumPurchaseWizard/Steps/Steps.module.css'
import checkoutStyles from '../Checkout/Checkout.module.css'
import { getNextHigherTier, getTierHighlights, getTierIntro } from '../../PremiumLanding/content/tierHighlights'
import { CheckoutButton, CheckoutError, CheckoutLayout, PaymentActions, Savings, SummaryRow, SummaryTotal } from '../Checkout/CheckoutParts'

const getPremiumOptionKey = (option: PremiumTypeOption): string => `${option.productId}:${option.value}:${option.label}`

const getScalablePremiumPlusWeekOptions = (premiumType: PremiumType): PremiumTypeOption[] => {
    if (premiumType.productId !== 'premium_plus') {
        return []
    }

    return premiumType.options.filter(option => option.productId === 'premium_plus' && option.value >= 1 && option.value <= 3)
}

interface Props {
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct()
    selectedTier?: PremiumTier
    selectedDuration?: Duration | null
    initialDiscountCode?: string | null
    onUpgradeTier?: (tier: PremiumTier) => void
}

/** whether a coins option has the length of the wizard's billing period; the label decides, never the raw `value` (3 weeks is not 3 months) */
function isOptionOfDuration(premiumType: PremiumType, option: PremiumTypeOption, wizardDuration: Duration): boolean {
    const label = (typeof option.label === 'string' ? option.label : String(option.label)).toLowerCase()
    switch (wizardDuration) {
        case Duration.HOUR:
            return label.includes('hour')
        case Duration.DAY:
            return label.includes('day') && !label.includes('week')
        case Duration.WEEK:
            return label.includes('week') && !label.includes('month')
        case Duration.MONTHLY:
            return label.includes('month') || label.includes('4 weeks')
        case Duration.QUARTER:
            // Starter's quarter step is its half year; the other tiers' is 3 months (Premium+: 11 weeks)
            if (premiumType.productId === 'starter_premium') return label.includes('6 months')
            return label.includes('3 month') || label.includes('11 weeks')
        case Duration.YEARLY:
            return label.includes('year') || label.includes('12 months')
        default:
            return false
    }
}

/** the option of the wizard's duration, undefined when the type has none */
const findOptionOfDuration = (premiumType: PremiumType, wizardDuration: Duration | null | undefined): PremiumTypeOption | undefined =>
    wizardDuration ? premiumType.options.find(option => isOptionOfDuration(premiumType, option, wizardDuration)) : undefined

// Helper function to find the best matching premium option based on wizard duration
const findMatchingPremiumOption = (premiumType: PremiumType, wizardDuration: Duration | null | undefined): PremiumTypeOption =>
    findOptionOfDuration(premiumType, wizardDuration) || premiumType.options[0]

function BuyPremium(props: Props) {
    const variant = usePremiumVariant()
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
    const [purchasePremiumType, setPurchasePremiumType] = useState<PremiumType>(initialPremiumType)
    const [purchaseSuccessfulOption, setPurchaseSuccessfulDuration] = useState<PremiumTypeOption>()
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [purchasePremiumOption, setPurchasePremiumOption] = useState<PremiumTypeOption>(findMatchingPremiumOption(initialPremiumType, props.selectedDuration))
    const [showPrepaidConfirmationDialog, setShowPrepaidConfirmationDialog] = useState(false)
    const coflCoins = useCoflCoins()

    function scrollToCoflCoinsPurchase() {
        if (typeof window === 'undefined') return
        const el = document.getElementById('coflcoins-purchase')
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }
    }

    function handleAttemptPurchaseClick() {
        if (getPurchasePrice() > coflCoins) {
            // Not enough coins -> scroll to CoflCoins top-up section
            toast.info('You do not have enough CoflCoins. Scrolling to top-up options...')
            scrollToCoflCoinsPurchase()
            return
        }
        setShowPrepaidConfirmationDialog(true)
    }

    // Set initial selection based on wizard choices
    useEffect(() => {
        const premiumType = getInitialPremiumType()
        setPurchasePremiumType(premiumType)

        // Use the helper function to find the best matching option
        const initialOption = findMatchingPremiumOption(premiumType, props.selectedDuration)
        setPurchasePremiumOption(initialOption)
    }, [props.selectedTier, props.selectedDuration])

    function onDurationChange(event: ChangeEvent<HTMLSelectElement>, availableOptions: PremiumTypeOption[] = purchasePremiumType.options) {
        const option = availableOptions.find(option => getPremiumOptionKey(option) === event.target.value)
        if (option) {
            setPurchasePremiumOption(option)
        }
    }

    function onPremiumTypeChange(productId) {
        const selectedType = PREMIUM_TYPES.find(type => type.productId === productId)
        if (selectedType) {
            setPurchasePremiumType(selectedType)
            setPurchasePremiumOption(selectedType.options[0])
        }
    }

    function onPremiumBuy(googleToken: string, declaration?: ServicePurchaseDeclaration) {
        setShowPrepaidConfirmationDialog(false)
        setIsPurchasing(true)
        trackPremiumFunnelEvent('checkout started', variant, { product: purchasePremiumOption.productId, provider: 'coflcoins' })

        api.purchaseWithCoflcoins(purchasePremiumOption.productId, googleToken, purchasePremiumOption.value, declaration).then(() => {
            document.dispatchEvent(
                new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, {
                    detail: { coflCoins: coflCoins - getPurchasePrice() }
                })
            )
            setPurchaseSuccessfulDuration(purchasePremiumOption)
            setIsPurchasing(false)
            toast.success('Purchase successful')
            props.onNewActivePremiumProduct()
        }).catch(err => {
            console.error('Error purchasing premium:', err)
            setIsPurchasing(false)
            toast.error('Purchase failed. Please try again later.')
        })
    }

    function onPremiumBuyCancel() {
        setShowPrepaidConfirmationDialog(false)
    }

    function getPurchasePrice() {
        return purchasePremiumOption.value * purchasePremiumOption.price
    }

    /** what the next tier costs for the same duration in CoflCoins, e.g. "21,600 CoflCoins for 11 weeks, paid once"; null when it has no such option */
    function getUpgradePrice(): string | null {
        const next = props.selectedTier ? getNextHigherTier(props.selectedTier) : null
        const type = PREMIUM_TYPES.find(premiumType => premiumType.productId === next)
        // Starter's quarter is a half year, no other tier sells that length
        if (!type || (props.selectedTier === PremiumTier.STARTER && props.selectedDuration === Duration.QUARTER)) return null
        const option = findOptionOfDuration(type, props.selectedDuration)
        if (!option) return null
        const length = String(option.label).replace(/\s*\(.*\)/, '')
        return `${(option.value * option.price).toLocaleString()} CoflCoins for ${length}, paid once`
    }

    function getDurationString(): string {
        let durationString = purchasePremiumType.durationString
        const duration = +purchasePremiumOption.value
        if (durationString && duration > 1) {
            durationString += 's'
        }
        return durationString
    }

    const getDisplayTierName = () => {
        return props.selectedTier ? getTierDisplayName(props.selectedTier) : purchasePremiumType.label
    }

    const scalablePremiumPlusWeekOptions = getScalablePremiumPlusWeekOptions(purchasePremiumType)
    const showScalableWeekSelector =
        props.selectedTier === PremiumTier.PREMIUM_PLUS && props.selectedDuration === Duration.WEEK && scalablePremiumPlusWeekOptions.length > 0

    function renderDurationRow() {
        if (!showScalableWeekSelector) return <SummaryRow label="Duration">{purchasePremiumOption.label}</SummaryRow>
        return (
            <SummaryRow label="Duration">
                <select
                    aria-label="Select Premium Plus duration in weeks"
                    className={`form-select ${checkoutStyles.select}`}
                    value={getPremiumOptionKey(purchasePremiumOption)}
                    onChange={event => onDurationChange(event, scalablePremiumPlusWeekOptions)}
                >
                    {scalablePremiumPlusWeekOptions.map(option => (
                        <option key={getPremiumOptionKey(option)} value={getPremiumOptionKey(option)}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </SummaryRow>
        )
    }

    function renderBalance() {
        if (coflCoins < 0) return <SummaryRow label="Your balance">Loading…</SummaryRow>
        return (
            <SummaryRow label="Your balance">
                <Number number={coflCoins} /> CoflCoins
            </SummaryRow>
        )
    }

    function renderRemaining() {
        if (coflCoins < 0) return null
        if (coflCoins >= getPurchasePrice()) {
            return (
                <Savings>
                    Remaining after purchase: <Number number={coflCoins - getPurchasePrice()} /> CoflCoins
                </Savings>
            )
        }
        return <CheckoutError>You don't have enough CoflCoins for this purchase, scroll down to buy more!</CheckoutError>
    }

    function renderSummary() {
        const tierClass = props.selectedTier === PremiumTier.PREMIUM_PLUS ? stepStyles.tierPremiumPlus : props.selectedTier === PremiumTier.PREMIUM ? stepStyles.tierPremium : ''
        return (
            <>
                <SummaryRow label="Plan">
                    <span className={tierClass}>{getDisplayTierName()}</span>
                </SummaryRow>
                <SummaryRow label="Payment">CoflCoins</SummaryRow>
                {renderDurationRow()}
                {renderBalance()}
                <SummaryTotal label="Price" amount={<Number number={getPurchasePrice()} />} unit="CoflCoins, paid once">
                    {renderRemaining()}
                </SummaryTotal>
            </>
        )
    }

    function renderFeatures() {
        return (
            <div className={discountStyles.featuresRow}>
                <div className={checkoutStyles.features}>
                    <h6>What you'll get:</h6>
                    {props.selectedTier && getTierIntro(props.selectedTier) ? <p>{getTierIntro(props.selectedTier)}:</p> : null}
                    <ul>
                        {(props.selectedTier ? getTierHighlights(props.selectedTier) : []).map(feature => (
                            <li key={feature}>{feature}</li>
                        ))}
                    </ul>
                </div>
                {props.selectedTier && (
                    <TierUpsellPanel
                        currentTier={props.selectedTier}
                        price={getUpgradePrice()}
                        onUpgrade={tier => props.onUpgradeTier?.(tier)}
                    />
                )}
            </div>
        )
    }

    // If coming from wizard, show only the selected option with summary
    if (props.selectedTier && props.selectedDuration !== undefined) {
        return (
            <>
                <CheckoutLayout
                    summary={renderSummary()}
                    actions={
                        <PaymentActions note="This is a prepaid service. We won't automatically charge you after your premium time runs out!">
                            <CheckoutButton tier={props.selectedTier} busy={isPurchasing} busyLabel="Purchasing…" onClick={handleAttemptPurchaseClick}>
                                Purchase for <Number number={getPurchasePrice()} /> CoflCoins
                            </CheckoutButton>
                        </PaymentActions>
                    }
                >
                    {renderFeatures()}
                </CheckoutLayout>
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
                                            variant="outline-primary"
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
                                    value={getPremiumOptionKey(purchasePremiumOption)}
                                >
                                    {purchasePremiumType.options.map(option => {
                                        return (
                                            <option key={getPremiumOptionKey(option)} value={getPremiumOptionKey(option)}>
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
                                onClick={handleAttemptPurchaseClick}
                                disabled={isPurchasing}
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
