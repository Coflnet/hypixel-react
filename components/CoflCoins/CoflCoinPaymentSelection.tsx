'use client'
import { useState, useEffect } from 'react'
import { Card, Button, Alert, Form, InputGroup, Spinner } from 'react-bootstrap'
import Number from '../Number/Number'
import PurchaseElement from './PurchaseElement'
import styles from './CoflCoinsPurchase.module.css'
import { postApiTopupRates } from '../../api/_generated/skyApi'
import type { BatchProductPricingResponse, ProviderPricingOption } from '../../api/_generated/skyApi.schemas'

interface CoflCoinOption {
    amount: number
    paypalPrice: number
    stripePrice: number
    lemonsqueezyPrice: number
    googlePlayPrice: number
    paypalProductId: string
    stripeProductId: string
    lemonsqueezyProductId: string
    googlePlayProductId: string
}

interface Props {
    selectedOption: CoflCoinOption
    onBack: () => void
    countryCode?: string
    coflCoins: number
    onPayPalPay: (productId: string, coflCoins?: number) => void
    onStripePay: (productId: string, coflCoins?: number) => void
    onLemonSqueezyPay: (productId: string, coflCoins?: number) => void
    onGooglePlayPay: (productId: string, coflCoins?: number) => void
    loadingProductId: string
    isGooglePlayAvailable?: boolean
    isAndroidApp?: boolean
}

function CoflCoinPaymentSelection({ selectedOption, onBack, countryCode, coflCoins, onPayPalPay, onStripePay, onLemonSqueezyPay, onGooglePlayPay, loadingProductId, isGooglePlayAvailable, isAndroidApp }: Props) {
    const [creatorCode, setCreatorCode] = useState('')
    const [isLoadingPrices, setIsLoadingPrices] = useState(false)
    const [pricingData, setPricingData] = useState<BatchProductPricingResponse | null>(null)
    const [pricingError, setPricingError] = useState<string | null>(null)
    const [appliedCreatorCode, setAppliedCreatorCode] = useState<string | null>(null)

    // Fetch pricing on mount and when dependencies change
    useEffect(() => {
        fetchPricing(creatorCode)
    }, [selectedOption.paypalProductId, selectedOption.stripeProductId, selectedOption.lemonsqueezyProductId, selectedOption.googlePlayProductId, countryCode])

    const fetchPricing = async (code: string) => {
        if (!countryCode) return

        setIsLoadingPrices(true)
        setPricingError(null)

        try {
            const googleToken = sessionStorage.getItem('googleId')
            const headers: Record<string, string> = {}
            if (googleToken) {
                headers.GoogleToken = googleToken
            }

            // Fetch pricing for all payment providers
            const response = await postApiTopupRates({
                productSlugs: [
                    selectedOption.paypalProductId,
                    selectedOption.stripeProductId,
                    selectedOption.lemonsqueezyProductId,
                    selectedOption.googlePlayProductId
                ],
                countryCode: countryCode,
                creatorCode: code || null
            }, {
                headers: headers
            })

            if (response.status === 200 && response.data) {
                setPricingData(response.data)
                setAppliedCreatorCode(code || null)
            } else {
                setPricingError('Failed to fetch pricing information')
            }
        } catch (error) {
            console.error('Error fetching pricing:', error)
            setPricingError('Unable to load pricing. Please try again.')
        } finally {
            setIsLoadingPrices(false)
        }
    }

    const handleApplyCreatorCode = () => {
        fetchPricing(creatorCode)
    }

    const handleClearCreatorCode = () => {
        setCreatorCode('')
        fetchPricing('')
    }

    // Extract pricing data for display  
    const getProviderPrice = (providerSlug: string, productSlug: string): number | null => {
        if (!pricingData?.products) return null
        const product = pricingData.products.find(p => p.productSlug === productSlug)
        if (!product?.providers) return null
        const provider = product.providers.find(p => p.providerSlug === providerSlug)
        // discountedPrice is already in the main currency unit (EUR, USD, etc.), not cents
        return provider ? provider.discountedPrice : null
    }

    const getProviderOriginalPrice = (providerSlug: string, productSlug: string): number | null => {
        if (!pricingData?.products) return null
        const product = pricingData.products.find(p => p.productSlug === productSlug)
        if (!product?.providers) return null
        const provider = product.providers.find(p => p.providerSlug === providerSlug)
        // originalPrice is already in the main currency unit (EUR, USD, etc.), not cents
        return provider ? provider.originalPrice : null
    }

    const getGooglePlayProductId = (): string => {
        if (!pricingData?.products) return selectedOption.googlePlayProductId
        const product = pricingData.products.find(p => p.productSlug === selectedOption.googlePlayProductId)
        if (!product?.providers) return selectedOption.googlePlayProductId
        const googleProvider = product.providers.find(p => p.providerSlug === 'googlepay')
        return googleProvider?.googlePlayProductId || selectedOption.googlePlayProductId
    }

    const getCurrencyCode = (): string => {
        if (!pricingData?.products?.[0]?.providers) return 'EUR'
        return pricingData.products[0].providers[0]?.currencyCode || 'EUR'
    }

    const getDiscountMultiplier = (providerSlug: string, productSlug: string): number | undefined => {
        const originalPrice = getProviderOriginalPrice(providerSlug, productSlug)
        const discountedPrice = getProviderPrice(providerSlug, productSlug)
        
        if (originalPrice && discountedPrice && originalPrice > discountedPrice) {
            return discountedPrice / originalPrice
        }
        return undefined
    }

    const discountPercent = pricingData?.discountPercent || 0
    const hasDiscount = discountPercent > 0

    // Use dynamic prices if available, otherwise fall back to defaults
    // Always use originalPrice for display - the discount multiplier will show the discounted price
    const dynamicPayPalPrice = getProviderOriginalPrice('paypal', selectedOption.paypalProductId) ?? selectedOption.paypalPrice
    const dynamicStripePrice = getProviderOriginalPrice('stripe', selectedOption.stripeProductId) ?? selectedOption.stripePrice
    const dynamicLemonSqueezyPrice = getProviderOriginalPrice('lemonsqueezy', selectedOption.lemonsqueezyProductId) ?? selectedOption.lemonsqueezyPrice
    const dynamicGooglePlayPrice = getProviderOriginalPrice('googlepay', selectedOption.googlePlayProductId) ?? selectedOption.googlePlayPrice
    const dynamicGooglePlayProductId = getGooglePlayProductId()
    const currencyCode = getCurrencyCode()
    
    // Calculate discount multipliers for each provider
    const paypalDiscountMultiplier = getDiscountMultiplier('paypal', selectedOption.paypalProductId)
    const stripeDiscountMultiplier = getDiscountMultiplier('stripe', selectedOption.stripeProductId)
    const lemonSqueezyDiscountMultiplier = getDiscountMultiplier('lemonsqueezy', selectedOption.lemonsqueezyProductId)
    const googlePlayDiscountMultiplier = getDiscountMultiplier('googlepay', selectedOption.googlePlayProductId)

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

            {isAndroidApp && (
                <Alert variant="info" style={{ marginBottom: '20px' }}>
                    <Alert.Heading style={{ fontSize: '0.95rem', marginBottom: '8px' }}>💡 Limited to Google Play</Alert.Heading>
                    <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                        The Android app only supports Google Play Billing. For other payment methods like PayPal or Stripe, visit the <a 
                            href="https://coflnet.com/premium" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontWeight: '600' }}
                        >
                            website
                        </a>.
                    </p>
                </Alert>
            )}

            <div style={{ marginBottom: '20px' }}>
                <h5>Choose Payment Method</h5>
                <p style={{ color: '#adb5bd', fontSize: '0.9rem', margin: 0 }}>
                    Select your preferred payment provider below. Prices may vary slightly between providers.
                </p>
            </div>

            {/* Responsive Grid Layout: Payment Options + Creator Code */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            }}>
                {/* Payment Provider Options */}
                <PurchaseElement
                    coflCoinsToBuy={selectedOption.amount}
                    paypalPrice={dynamicPayPalPrice}
                    stripePrice={dynamicStripePrice}
                    lemonsqueezyPrice={dynamicLemonSqueezyPrice}
                    googlePlayPrice={dynamicGooglePlayPrice}
                    paypalProductId={selectedOption.paypalProductId}
                    stripeProductId={selectedOption.stripeProductId}
                    lemonsqueezyProductId={selectedOption.lemonsqueezyProductId}
                    googlePlayProductId={dynamicGooglePlayProductId}
                    countryCode={countryCode}
                    onPayPalPay={onPayPalPay}
                    onStripePay={onStripePay}
                    onLemonSqeezyPay={onLemonSqueezyPay}
                    onGooglePlayPay={onGooglePlayPay}
                    loadingProductId={loadingProductId}
                    disabledTooltip={undefined}
                    isDisabled={false}
                    isGooglePlayAvailable={isGooglePlayAvailable}
                    isAndroidApp={isAndroidApp}
                    paypalDiscount={paypalDiscountMultiplier}
                    stripeDiscount={stripeDiscountMultiplier}
                    lemonSqueezyDiscount={lemonSqueezyDiscountMultiplier}
                    googlePlayDiscount={googlePlayDiscountMultiplier}
                    currencyCode={currencyCode}
                />

                {/* Creator Code Input Card */}
                <Card style={{ backgroundColor: '#2a3644', border: '1px solid #495057', height: 'fit-content' }}>
                    <Card.Header>
                        <Card.Title style={{ fontSize: '1rem', margin: 0 }}>Creator Code</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Form.Group>
                            <Form.Label style={{ color: '#adb5bd', fontSize: '0.9rem', marginBottom: '10px' }}>
                                Support a creator (Optional)
                            </Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter creator code"
                                    value={creatorCode}
                                    onChange={(e) => setCreatorCode(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleApplyCreatorCode()
                                        }
                                    }}
                                    disabled={isLoadingPrices}
                                    style={{
                                        backgroundColor: '#1a2332',
                                        borderColor: '#495057',
                                        color: '#f8f9fa'
                                    }}
                                />
                                {appliedCreatorCode ? (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearCreatorCode}
                                        disabled={isLoadingPrices}
                                    >
                                        Clear
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={handleApplyCreatorCode}
                                        disabled={isLoadingPrices || !creatorCode.trim()}
                                    >
                                        {isLoadingPrices ? <Spinner size="sm" animation="border" /> : 'Apply'}
                                    </Button>
                                )}
                            </InputGroup>
                            {hasDiscount && appliedCreatorCode && (
                                <Form.Text style={{ color: '#20c997', fontWeight: '600', display: 'block', marginTop: '10px' }}>
                                    ✓ {discountPercent}% discount applied with code "{appliedCreatorCode}"
                                </Form.Text>
                            )}
                            {pricingError && (
                                <Form.Text style={{ color: '#dc3545', display: 'block', marginTop: '10px' }}>
                                    {pricingError}
                                </Form.Text>
                            )}
                            {!hasDiscount && !pricingError && appliedCreatorCode && (
                                <Form.Text style={{ color: '#adb5bd', display: 'block', marginTop: '10px' }}>
                                    Creator code applied
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Card.Body>
                </Card>
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
