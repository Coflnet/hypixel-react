'use client'
import { ChangeEvent, useState } from 'react'
import { Button, Card, Form, Modal, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { useCoflCoins } from '../../../utils/Hooks'
import { getPremiumType, PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import { CoflCoinsDisplay } from '../../CoflCoins/CoflCoinsDisplay'
import Number from '../../Number/Number'
import styles from './BuyPremium.module.css'
import BuyPremiumConfirmationDialog from './BuyPremiumConfirmationDialog'

interface Props {
    activePremiumProduct: PremiumProduct
    onNewActivePremiumProduct()
}

function BuyPremium(props: Props) {
    let [purchasePremiumType, setPurchasePremiumType] = useState<PremiumType>(PREMIUM_TYPES[0])
    let [purchaseSuccessfulOption, setPurchaseSuccessfulDuration] = useState<PremiumTypeOption>()
    let [isPurchasing, setIsPurchasing] = useState(false)
    let [purchasePremiumOption, setPurchasePremiumOption] = useState<PremiumTypeOption>(PREMIUM_TYPES[0].options[0])
    let [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
    let coflCoins = useCoflCoins()

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
        setShowConfirmationDialog(false)
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
        setShowConfirmationDialog(false)
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
                return { color: '#32de84' }
            case 'premium_plus':
                return { color: '#ffaa00' }
            default:
                return {}
        }
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
                                    style={{ width: '250px', display: 'inline' }}
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
                                    setShowConfirmationDialog(true)
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
                show={showConfirmationDialog}
                durationString={getDurationString()}
                purchasePremiumOption={purchasePremiumOption}
                purchasePrice={getPurchasePrice()}
                purchasePremiumType={purchasePremiumType}
                onHide={onPremiumBuyCancel}
                onConfirm={onPremiumBuy}
                activePremiumProduct={props.activePremiumProduct}
            />
        </>
    )
}

export default BuyPremium
