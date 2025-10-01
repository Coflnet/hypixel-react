'use client'
import { Card } from 'react-bootstrap'
import styles from './Steps.module.css'
import { PurchaseType } from '../types'

interface Props {
    selectedType: PurchaseType | null
    onTypeSelect: (type: PurchaseType) => void
}

export default function PaymentMethodStep({ selectedType, onTypeSelect }: Props) {
    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>How would you like to pay?</h4>
            <p className={styles.stepDescription}>Choose your preferred payment method. Both options provide the same premium features.</p>

            <div className={styles.optionsGrid}>
                <Card
                    className={`${styles.optionCard} ${selectedType === PurchaseType.SUBSCRIPTION ? styles.selected : ''}`}
                    onClick={() => onTypeSelect(PurchaseType.SUBSCRIPTION)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>💳</div>
                        <h5 className={styles.paymentTitle}>Subscription</h5>
                        <p className={styles.paymentDescription}>
                            Cancel any time (on this page)
                            <br />
                            Supports discount codes
                        </p>
                        <small className={styles.recommendation}>Most Popular</small>
                    </Card.Body>
                </Card>

                <Card
                    className={`${styles.optionCard} ${selectedType === PurchaseType.COFLCOINS ? styles.selected : ''}`}
                    onClick={() => onTypeSelect(PurchaseType.COFLCOINS)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🪙</div>
                        <h5 className={styles.paymentTitle}>CoflCoins</h5>
                        <p className={styles.paymentDescription}>That you bought/earned/got gifted</p>
                    </Card.Body>
                </Card>
            </div>
        </div>
    )
}
