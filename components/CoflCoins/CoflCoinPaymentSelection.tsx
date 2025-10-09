'use client'
import { useState } from 'react'
import { Card, Button, Alert } from 'react-bootstrap'
import Number from '../Number/Number'
import PurchaseElement from './PurchaseElement'
import styles from './CoflCoinsPurchase.module.css'

interface CoflCoinOption {
    amount: number
    paypalPrice: number
    stripePrice: number
    lemonsqueezyPrice: number
    paypalProductId: string
    stripeProductId: string
    lemonsqueezyProductId: string
}

interface Props {
    selectedOption: CoflCoinOption
    onBack: () => void
    countryCode?: string
    coflCoins: number
    onPayPalPay: (productId: string, coflCoins?: number) => void
    onStripePay: (productId: string, coflCoins?: number) => void
    onLemonSqueezyPay: (productId: string, coflCoins?: number) => void
    loadingProductId: string
}

function CoflCoinPaymentSelection({ selectedOption, onBack, countryCode, coflCoins, onPayPalPay, onStripePay, onLemonSqueezyPay, loadingProductId }: Props) {
    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '30px',
                    gap: '15px'
                }}
            >
                <Button
                    variant="outline-secondary"
                    onClick={onBack}
                    style={{
                        padding: '8px 16px',
                        fontSize: '0.9rem'
                    }}
                >
                    ← Back
                </Button>
                <h4 style={{ margin: 0 }}>
                    Purchase <Number number={selectedOption.amount} /> CoflCoins
                </h4>
            </div>

            <Card style={{ marginBottom: '30px', backgroundColor: '#2a3644', border: '1px solid #495057' }}>
                <Card.Body>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px'
                        }}
                    >
                        <div>
                            <h5 style={{ margin: 0, fontWeight: '600', color: '#f8f9fa' }}>
                                <Number number={selectedOption.amount} /> CoflCoins
                            </h5>
                            <p style={{ margin: 0, color: '#adb5bd', fontSize: '0.9rem' }}>
                                Current balance: <Number number={coflCoins} /> coins
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#20c997' }}>From €{selectedOption.stripePrice.toFixed(2)}</div>
                            <div style={{ fontSize: '0.85rem', color: '#adb5bd' }}>
                                €{(selectedOption.stripePrice / selectedOption.amount).toFixed(4)} per coin
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: '10px 0',
                            borderTop: '1px solid #495057',
                            color: '#e9ecef',
                            fontSize: '0.9rem'
                        }}
                    >
                        <strong>After purchase:</strong> <Number number={coflCoins + selectedOption.amount} /> CoflCoins total
                    </div>
                </Card.Body>
            </Card>

            <div style={{ marginBottom: '20px' }}>
                <h5>Choose Payment Method</h5>
                <p style={{ color: '#adb5bd', fontSize: '0.9rem', margin: 0 }}>
                    Select your preferred payment provider below. Prices may vary slightly between providers.
                </p>
            </div>

            <div className={styles.productGrid} style={{ gridTemplateColumns: '1fr' }}>
                <PurchaseElement
                    coflCoinsToBuy={selectedOption.amount}
                    paypalPrice={selectedOption.paypalPrice}
                    stripePrice={selectedOption.stripePrice}
                    lemonsqueezyPrice={selectedOption.lemonsqueezyPrice}
                    paypalProductId={selectedOption.paypalProductId}
                    stripeProductId={selectedOption.stripeProductId}
                    lemonsqueezyProductId={selectedOption.lemonsqueezyProductId}
                    countryCode={countryCode}
                    onPayPalPay={onPayPalPay}
                    onStripePay={onStripePay}
                    onLemonSqeezyPay={onLemonSqueezyPay}
                    loadingProductId={loadingProductId}
                    disabledTooltip={undefined}
                    isDisabled={false}
                />
            </div>

            <Alert variant="info" style={{ marginTop: '30px' }}>
                <Alert.Heading style={{ fontSize: '1rem', marginBottom: '10px' }}>💡 Payment Information</Alert.Heading>
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>CoflCoins are added to your account immediately after successful payment</li>
                    <li>You can use CoflCoins to purchase premium subscriptions and other services</li>
                    <li>Payments are processed securely through our trusted payment partners</li>
                    <li>Need help? Contact our support team through Discord</li>
                </ul>
            </Alert>
        </div>
    )
}

export default CoflCoinPaymentSelection
