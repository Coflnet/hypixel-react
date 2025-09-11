'use client'
import { useState } from 'react'
import { Card, Button, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import Number from '../Number/Number'
import styles from '../CoflCoins/CoflCoinsPurchase.module.css'
import { googlePlayBilling, GOOGLE_PLAY_PRODUCTS, GOOGLE_PLAY_COFLCOIN_AMOUNTS } from '../../utils/GooglePlayBilling'
import api from '../../api/ApiHelper'

interface Props {
    coflCoinAmount: 1800 | 5400
    price: number
    onPurchaseComplete?: () => void
}

function GooglePlayPurchaseElement({ coflCoinAmount, price, onPurchaseComplete }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    
    const productId = coflCoinAmount === 1800 ? GOOGLE_PLAY_PRODUCTS.COFLCOINS_1800 : GOOGLE_PLAY_PRODUCTS.COFLCOINS_5400

    const handlePurchase = async () => {
        setIsLoading(true)
        
        try {
            // Initialize Google Play Billing if not already done
            const isInitialized = await googlePlayBilling.initialize()
            if (!isInitialized) {
                throw new Error('Google Play Billing is not available')
            }

            // Launch the purchase flow
            const purchase = await googlePlayBilling.purchaseProduct(productId)
            
            // Validate the purchase with our backend
            await api.googlePlayPurchase(productId, purchase.purchaseToken, coflCoinAmount)
            
            // Acknowledge the purchase
            await googlePlayBilling.acknowledgePurchase(purchase.purchaseToken)
            
            toast.success(`Successfully purchased ${coflCoinAmount} CoflCoins!`)
            
            if (onPurchaseComplete) {
                onPurchaseComplete()
            }
            
        } catch (error) {
            console.error('Purchase failed:', error)
            let errorMessage = 'Purchase failed. Please try again.'
            
            if (error instanceof Error) {
                if (error.message.includes('USER_CANCELED')) {
                    errorMessage = 'Purchase was cancelled.'
                } else if (error.message.includes('ITEM_ALREADY_OWNED')) {
                    errorMessage = 'You already own this item. Please check your account.'
                } else if (error.message.includes('SERVICE_UNAVAILABLE')) {
                    errorMessage = 'Google Play Store is currently unavailable. Please try again later.'
                } else if (error.message.includes('BILLING_UNAVAILABLE')) {
                    errorMessage = 'In-app purchases are not available on this device.'
                }
            }
            
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className={styles.premiumPlanCard}>
            <Card.Header>
                <Card.Title>
                    <Number number={coflCoinAmount} /> CoflCoins
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                        €{price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>
                        Google Play Store
                    </div>
                </div>
                
                <Button
                    variant="primary"
                    onClick={handlePurchase}
                    disabled={isLoading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {isLoading ? (
                        <>
                            <Spinner 
                                as="span" 
                                animation="border" 
                                size="sm" 
                                role="status" 
                                aria-hidden="true" 
                                style={{ marginRight: '8px' }} 
                            />
                            Processing...
                        </>
                    ) : (
                        <>
                            <i className="fab fa-google-pay" style={{ marginRight: '8px' }}></i>
                            Buy with Google Play
                        </>
                    )}
                </Button>
                
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px', textAlign: 'center' }}>
                    Secure payment through Google Play Store
                </div>
            </Card.Body>
        </Card>
    )
}

export default GooglePlayPurchaseElement
