import React, { ChangeEvent, useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { numberWithThousandsSeperators } from '../../../utils/Formatter'
import { useCoflCoins } from '../../../utils/Hooks'
import { CoflCoinsDisplay } from '../../CoflCoins/CoflCoinsDisplay'
import styles from './BuyPremium.module.css'

let PREMIUM_PRICE_MONTH = 1800

function BuyPremium() {
    let [purchaseSuccessfulMonths, setPurchaseSuccessfulMonths] = useState<number>()
    let [isPurchasing, setIsPurchasing] = useState(false)
    let [purchasePremiumDuration, setPurchasePremiumDuration] = useState(1)
    let coflCoins = useCoflCoins()

    function onDurationChange(event: ChangeEvent<HTMLSelectElement>) {
        setPurchasePremiumDuration(parseInt(event.target.value) || 1)
    }

    function onPremiumBuy(productId) {
        setIsPurchasing(true)
        api.purchaseWithCoflcoins(productId, purchasePremiumDuration).then(() => {
            document.dispatchEvent(
                new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: coflCoins - PREMIUM_PRICE_MONTH * purchasePremiumDuration } })
            )
            setPurchaseSuccessfulMonths(purchasePremiumDuration)
            setIsPurchasing(false)
            toast.success('Purchase successful')
        })
    }

    return (
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
                        <hr />
                        <Button
                            style={{ marginTop: '10px' }}
                            variant="success"
                            onClick={() => {
                                onPremiumBuy('premium')
                            }}
                            disabled={purchasePremiumDuration * PREMIUM_PRICE_MONTH > coflCoins || isPurchasing}
                        >
                            Confirm purchase
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
                        You successfully bought {purchaseSuccessfulMonths} {purchaseSuccessfulMonths === 1 ? 'Month' : 'Months'} of Premium for{' '}
                        {numberWithThousandsSeperators(purchasePremiumDuration * PREMIUM_PRICE_MONTH)} CoflCoins!
                    </p>
                )}
            </div>
        </Card>
    )
}

export default BuyPremium
