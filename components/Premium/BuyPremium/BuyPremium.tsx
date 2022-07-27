import React, { ChangeEvent, useState } from 'react'
import { Button, Card, Form, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { numberWithThousandsSeperators } from '../../../utils/Formatter'
import { useCoflCoins } from '../../../utils/Hooks'
import { CoflCoinsDisplay } from '../../CoflCoins/CoflCoinsDisplay'
import styles from './BuyPremium.module.css'

const PREMIUM_PRICE_MONTH = 1800
const PRODUCT_ID = 'premium'

function BuyPremium() {
    let [purchaseSuccessfulMonths, setPurchaseSuccessfulMonths] = useState<number>()
    let [isPurchasing, setIsPurchasing] = useState(false)
    let [purchasePremiumDuration, setPurchasePremiumDuration] = useState(1)
    let [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
    let coflCoins = useCoflCoins()

    function onDurationChange(event: ChangeEvent<HTMLSelectElement>) {
        setPurchasePremiumDuration(parseInt(event.target.value) || 1)
    }

    function onPremiumBuy() {
        setShowConfirmationDialog(false)
        setIsPurchasing(true)
        api.purchaseWithCoflcoins(PRODUCT_ID, purchasePremiumDuration).then(() => {
            document.dispatchEvent(
                new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: coflCoins - PREMIUM_PRICE_MONTH * purchasePremiumDuration } })
            )
            setPurchaseSuccessfulMonths(purchasePremiumDuration)
            setIsPurchasing(false)
            toast.success('Purchase successful')
        })
    }

    function onPremiumBuyCancel() {
        setShowConfirmationDialog(false)
    }

    let confirmationDialog = (
        <Modal
            show={showConfirmationDialog}
            onHide={() => {
                setShowConfirmationDialog(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    You are purchasing {purchasePremiumDuration} {purchasePremiumDuration === 1 ? 'month' : 'months'} of premium for{' '}
                    {numberWithThousandsSeperators(purchasePremiumDuration * PREMIUM_PRICE_MONTH)} CoflCoins.
                </p>
                <p>The time will be added to account. After you confirmed the purchase, it can't be canceled/moved to another account</p>
                <hr />
                <Button variant="danger" onClick={onPremiumBuyCancel}>
                    Cancel
                </Button>
                <Button variant="success" style={{ float: 'right' }} onClick={onPremiumBuy}>
                    Confirm
                </Button>
            </Modal.Body>
        </Modal>
    )

    return (
        <>
            <Card className="purchase-card">
                <Card.Header>
                    <Card.Title>Buy premium for a certain duration with your CoflCoins. Your premium time starts shortly after your purchase.</Card.Title>
                </Card.Header>
                <div style={{ padding: '15px' }}>
                    {!purchaseSuccessfulMonths ? (
                        <div>
                            <div style={{ marginBottom: '15px' }}>
                                <label className={styles.label}>Purchase Duration:</label>
                                <Form.Control as="select" onChange={onDurationChange} style={{ width: '50px', display: 'inline' }}>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
                                    <option value={6}>6</option>
                                    <option value={7}>7</option>
                                    <option value={8}>8</option>
                                    <option value={9}>9</option>
                                    <option value={10}>10</option>
                                    <option value={11}>11</option>
                                    <option value={12}>12</option>
                                </Form.Control>
                                <span style={{ marginLeft: '20px' }}>Month(s)</span>
                                <div className={styles.coinBalance}>
                                    <CoflCoinsDisplay />
                                </div>
                            </div>
                            <div>
                                <label className={styles.label}>Price:</label>
                                <span style={{ fontWeight: 'bold' }}>{numberWithThousandsSeperators(purchasePremiumDuration * PREMIUM_PRICE_MONTH)} Coins</span>
                            </div>
                            {coflCoins > purchasePremiumDuration * PREMIUM_PRICE_MONTH ? (
                                <div>
                                    <label className={styles.label}>Remaining after Purchase:</label>
                                    <span>{numberWithThousandsSeperators(coflCoins - purchasePremiumDuration * PREMIUM_PRICE_MONTH)} Coins</span>
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
                                disabled={purchasePremiumDuration * PREMIUM_PRICE_MONTH > coflCoins || isPurchasing}
                            >
                                Purchase
                            </Button>
                            {purchasePremiumDuration * PREMIUM_PRICE_MONTH > coflCoins && !isPurchasing ? (
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
                            You successfully bought {purchaseSuccessfulMonths} {purchaseSuccessfulMonths === 1 ? 'month' : 'months'} of Premium for{' '}
                            {numberWithThousandsSeperators(purchasePremiumDuration * PREMIUM_PRICE_MONTH)} CoflCoins!
                        </p>
                    )}
                </div>
            </Card>
            {confirmationDialog}
        </>
    )
}

export default BuyPremium
