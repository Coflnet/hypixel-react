import { useState, useEffect } from 'react'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import api from '../../../api/ApiHelper'
import { Button, Card, Col, Row, Form, Spinner, InputGroup } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import stepStyles from '../PremiumPurchaseWizard/Steps/Steps.module.css'
import NumberElement from '../../Number/Number'
import { toast } from 'react-toastify'
import { Duration, PremiumTier, getTierDisplayName } from '../PremiumPurchaseWizard/types'
import { postApiTopupRates, getApiDiscountCode } from '../../../api/_generated/skyApi'
import { BatchProductPricingResponse, ValidatedDiscount } from '../../../api/_generated/skyApi.schemas'
import {
    getCurrencySymbol,
    getProviderPrice,
    getProviderOriginalPrice,
    getProviderCurrencyCode,
    getDiscountPercent,
    getTierApiProductId,
    VAT_RATES
} from '../../../utils/PricingUtils'

interface Props {
    activePremiumProduct: PremiumProduct
    selectedTier?: PremiumTier
    selectedDuration?: Duration | null
    initialDiscountCode?: string | null
    countryCode?: string
}

function BuySubscription(props: Props) {
    const [selectedPremiumType, setSelectedPremiumType] = useState<PremiumType>()
    const [isYearOption, setIsYearOption] = useState<boolean>()
    const [creatorCode, setCreatorCode] = useState('')
    const [discountCode, setDiscountCode] = useState(props.initialDiscountCode || '')
    const [isLoadingPrices, setIsLoadingPrices] = useState(false)
    const [pricingData, setPricingData] = useState<BatchProductPricingResponse | null>(null)
    const [pricingError, setPricingError] = useState<string | null>(null)
    const [appliedCreatorCode, setAppliedCreatorCode] = useState<string | null>(null)
    const [validatedDiscount, setValidatedDiscount] = useState<ValidatedDiscount | null>(null)
    const [pendingYearlyDiscount, setPendingYearlyDiscount] = useState<ValidatedDiscount | null>(null)
    const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)
    const [discountError, setDiscountError] = useState<string | null>(null)
    const [showStarterDiscountHint] = useState(() => Math.random() < 0.2)

    // Get country code from prop or localStorage
    const countryCode = (props.countryCode && props.countryCode.length > 0)
        ? props.countryCode
        : (typeof window !== 'undefined' ? localStorage.getItem('countryCode') || 'US' : 'US')

    useEffect(() => {
        fetchPricing(creatorCode)
        // Auto-validate discount code if provided from URL
        if (props.initialDiscountCode) {
            setTimeout(() => {
                validateDiscountCodeValue(props.initialDiscountCode!)
            }, 100)
        }
    }, [])

    const fetchPricing = async (code: string) => {
        setIsLoadingPrices(true)
        setPricingError(null)

        try {
            let productSlugs: string[] = []
            if (props.selectedTier && props.selectedDuration !== undefined) {
                const productId = getProductIdForTier(props.selectedTier, props.selectedDuration === Duration.YEARLY)
                productSlugs = [productId]
            } else {
                productSlugs = [
                    'l_premium',
                    'l_premium-quarter',
                    'l_premium-year',
                    'l_prem_plus',
                    'l_prem_plus-quarter',
                    'l_prem_plus-year',
                    'l_starter_premium'
                ]
            }

            const googleToken = sessionStorage.getItem('googleId')
            const headers: Record<string, string> = {}
            if (googleToken) {
                headers.GoogleToken = googleToken
            }

            const response = await postApiTopupRates({
                productSlugs: productSlugs,
                countryCode: countryCode,
                creatorCode: code || null
            }, {
                headers: headers
            })

            if (response.status === 200) {
                setPricingData(response.data)
                setAppliedCreatorCode(code || null)
            } else {
                setPricingError('Failed to load pricing information')
            }
        } catch (error) {
            console.error('Error fetching pricing:', error)
            setPricingError('Failed to load pricing information')
        } finally {
            setIsLoadingPrices(false)
        }
    }

    const getProductIdForTier = (tier: PremiumTier, isYearlyOrDuration: boolean | Duration): string => {
        return getTierApiProductId(tier, isYearlyOrDuration)
    }

    const getProviderPriceValue = (productSlug: string, providerSlug: string): number | null => {
        return getProviderPrice(pricingData, productSlug, providerSlug)
    }

    const getProviderOriginalPriceValue = (productSlug: string, providerSlug: string): number | null => {
        return getProviderOriginalPrice(pricingData, productSlug, providerSlug)
    }

    const getCurrencyCodeValue = (productSlug: string, providerSlug: string): string => {
        return getProviderCurrencyCode(pricingData, productSlug, providerSlug)
    }

    const getDiscountPercentValue = (productSlug: string): number | null => {
        return getDiscountPercent(pricingData, productSlug)
    }

    const applyCreatorCode = () => {
        fetchPricing(creatorCode)
    }

    const validateDiscountCodeValue = async (code: string) => {
        if (!code.trim()) {
            setDiscountError('Please enter a discount code')
            return
        }

        setIsValidatingDiscount(true)
        setDiscountError(null)
        setValidatedDiscount(null)

        try {
            const response = await getApiDiscountCode(code.trim())
            if (response.status === 200 && response.data) {
                if (response.data.isValid) {
                    // Determine whether yearly billing is currently selected
                    const currentIsYear = isYearOption !== undefined ? isYearOption : (props.selectedDuration === Duration.YEARLY)

                    // If discount name indicates yearly-only and monthly is selected, show error
                    const name = response.data.name || ''
                    if (name.toLowerCase().includes('yearly') && !currentIsYear) {
                        // Keep the discount data as pending so user can opt-in to switch to yearly
                        setPendingYearlyDiscount(response.data)
                        setDiscountError('This discount code is only valid for yearly billing')
                        setValidatedDiscount(null)
                    } else {
                        setPendingYearlyDiscount(null)
                        setValidatedDiscount(response.data)
                        setDiscountError(null)
                    }
                } else {
                    setDiscountError('This discount code is not valid')
                    setValidatedDiscount(null)
                }
            } else {
                setDiscountError('Could not validate discount code')
                setValidatedDiscount(null)
            }
        } catch (error) {
            console.error('Error validating discount code:', error)
            setDiscountError('Failed to validate discount code. Please try again.')
            setValidatedDiscount(null)
        } finally {
            setIsValidatingDiscount(false)
        }
    }

    const validateDiscountCode = () => {
        validateDiscountCodeValue(discountCode)
    }

    const clearDiscountCode = () => {
        setDiscountCode('')
        setValidatedDiscount(null)
        setDiscountError(null)
    }

    const getDisplayCurrency = (): string => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return 'Euro'
        const productId = getProductIdForTier(props.selectedTier, getCurrentDuration())
        const currencyCode = getCurrencyCodeValue(productId, 'lemonsqueezy')
        const symbol = getCurrencySymbol(currencyCode)
        return symbol === currencyCode ? currencyCode : symbol
    }

    const getOriginalPrice = (): number | null => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return null
        const productId = getProductIdForTier(props.selectedTier, getCurrentDuration())
        const price = getProviderOriginalPriceValue(productId, 'lemonsqueezy')
        if (price === null) return null
        const priceWithVat = getPriceWithVAT(price)
        return Math.ceil(priceWithVat * 100) / 100
    }

    const hasActiveDiscount = (): boolean => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return false
        const productId = getProductIdForTier(props.selectedTier, getCurrentDuration())
        const discountPercent = getDiscountPercentValue(productId)
        return discountPercent !== null && discountPercent > 0
    }

    // Get the discount code multiplier (e.g., 20% off = 0.8)
    const getDiscountCodeMultiplier = (): number => {
        if (!validatedDiscount || !validatedDiscount.amount || validatedDiscount.amountType !== 'percent') return 1
        return 1 - (validatedDiscount.amount / 100)
    }

    // Get VAT rate for current country
    const getVATRate = (): number => {
        if (!countryCode) return 0
        const upperCode = countryCode.toUpperCase()
        return VAT_RATES[upperCode] ?? 0
    }

    // Check if VAT should be included in the price (known country with VAT rate)
    const shouldIncludeVATInPrice = (): boolean => {
        if (!countryCode) return false
        const upperCode = countryCode.toUpperCase()
        return upperCode !== 'US' && VAT_RATES[upperCode] !== undefined
    }

    // Calculate price with VAT included if applicable
    const getPriceWithVAT = (basePrice: number): number => {
        if (!shouldIncludeVATInPrice()) return basePrice
        const vatRate = getVATRate()
        return basePrice * (1 + vatRate)
    }

    // Get VAT display text
    const getVATDisplayText = (): string => {
        if (shouldIncludeVATInPrice()) return ''
        return ' (+VAT)'
    }

    // Calculate final price after both creator code and discount code are applied
    const getFinalPrice = (basePrice: number): number => {
        // Creator code discount is already applied in basePrice from API
        // Apply discount code on top and then VAT (multiplicative)
        const discountedPrice = basePrice * getDiscountCodeMultiplier()
        const priceWithVat = getPriceWithVAT(discountedPrice)
        // round up to next cent for display/charging
        return Math.ceil(priceWithVat * 100) / 100
    }

    // Get the total discount percentage (creator code + discount code)
    const getTotalDiscountInfo = (): { creatorPercent: number | null; discountCodePercent: number | null; totalSavings: number | null } => {
        const creatorPercent = props.selectedTier ? getDiscountPercentValue(getProductIdForTier(props.selectedTier, getCurrentDuration())) : null
        const discountCodePercent = validatedDiscount?.amountType === 'percent' ? validatedDiscount.amount : null

        const originalPrice = getOriginalPrice()
        const basePrice = getSubscriptionPrice()
        const finalPrice = getFinalPrice(basePrice)

        if (originalPrice && finalPrice < originalPrice) {
            const totalSavings = Math.round((1 - finalPrice / originalPrice) * 100)
            return { creatorPercent, discountCodePercent: discountCodePercent ?? null, totalSavings }
        }

        return { creatorPercent, discountCodePercent: discountCodePercent ?? null, totalSavings: null }
    }

    // If we have wizard selections, use them to determine the selected type and duration
    const wizardSelectedType = props.selectedTier
        ? PREMIUM_TYPES.find(type => {
            switch (props.selectedTier) {
                case PremiumTier.PREMIUM:
                    return type.productId === 'premium'
                case PremiumTier.PREMIUM_PLUS:
                    return type.productId === 'premium_plus'
                case PremiumTier.STARTER:
                    return type.productId === 'starter_premium'
                default:
                    return type.productId === 'premium'
            }
        })
        : undefined

    const wizardIsYearOption = props.selectedDuration === Duration.YEARLY
    const wizardIsQuarterOption = props.selectedDuration === Duration.QUARTER

    // Helper to get the current duration for product ID
    const getCurrentDuration = (): Duration => {
        return props.selectedDuration || Duration.MONTHLY
    }

    const getDisplayTierName = () => {
        return props.selectedTier ? getTierDisplayName(props.selectedTier) : 'Premium'
    }

    function getSubscriptionPrice() {
        const targetType = selectedPremiumType || wizardSelectedType
        if (!targetType) {
            return -1
        }
        const currentDuration = props.selectedDuration || Duration.MONTHLY

        if (pricingData && pricingData.products) {
            const productId = getProductIdForTier(
                props.selectedTier || PremiumTier.PREMIUM,
                currentDuration
            )
            const price = getProviderPriceValue(productId, 'lemonsqueezy')
            if (price !== null) {
                return price
            }
        }

        if (targetType.productId === 'premium') {
            if (currentDuration === Duration.YEARLY) return 96.69
            if (currentDuration === Duration.QUARTER) return 27.69
            return 9.69
        }
        if (targetType.productId === 'premium_plus') {
            if (currentDuration === Duration.YEARLY) return 354.2
            if (currentDuration === Duration.QUARTER) return 99.69
            return 35.69
        }
        if (targetType.productId === 'starter_premium') {
            return 16.99 // only yearly option
        }
        return -1
    }

    function startSubscriptionPurchase(targetType: PremiumType, duration: Duration = Duration.MONTHLY) {
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
        if (duration === Duration.QUARTER) {
            productId += '-quarter'
        } else if (duration === Duration.YEARLY) {
            productId += '-year'
        }

        // Build query parameters for creator code and discount code
        const queryParams: string[] = []
        if (appliedCreatorCode) {
            queryParams.push(`creatorCode=${encodeURIComponent(appliedCreatorCode)}`)
        }
        if (validatedDiscount?.code) {
            queryParams.push(`discountCode=${encodeURIComponent(validatedDiscount.code)}`)
        }
        const productIdWithCode = queryParams.length > 0 ? `${productId}?${queryParams.join('&')}` : productId

        api.purchasePremiumSubscription(productIdWithCode, googleToken)
            .then(data => {
                window.open(data.directLink, '_self')
            })
            .catch(() => {
                toast.error('Failed to redirect to payment provider. Please try again.')
            })
    }

    if (props.selectedTier && props.selectedDuration !== undefined) {
        const targetType = wizardSelectedType!
        const currentDuration = getCurrentDuration()
        const basePrice = getSubscriptionPrice()
        const finalPrice = getFinalPrice(basePrice)
        const discountInfo = getTotalDiscountInfo()
        const hasAnyDiscount = hasActiveDiscount() || validatedDiscount

        // Helper to get billing display text
        const getBillingDisplayText = (): string => {
            switch (currentDuration) {
                case Duration.YEARLY:
                    return 'Yearly (52 weeks)'
                case Duration.QUARTER:
                    return 'Quarterly (13 weeks)'
                default:
                    return 'Monthly (4 weeks)'
            }
        }

        const getPricePerPeriodText = (): string => {
            switch (currentDuration) {
                case Duration.YEARLY:
                    return 'per year'
                case Duration.QUARTER:
                    return 'per quarter'
                default:
                    return 'per month'
            }
        }

        return (
            <>
                <div className={styles.summarySection}>
                    <h6>Your Selection:</h6>
                    <p>
                        <strong>Tier:</strong>{' '}
                        <span
                            className={`${styles.summaryValue} ${props.selectedTier === PremiumTier.PREMIUM ? stepStyles.tierPremium : ''} ${props.selectedTier === PremiumTier.PREMIUM_PLUS ? stepStyles.tierPremiumPlus : ''
                                }`}
                        >
                            {getDisplayTierName()}
                        </span>
                    </p>
                    <p>
                        <strong>Billing:</strong> {getBillingDisplayText()}
                    </p>
                    <p>
                        <>
                            <strong>Price:</strong> <NumberElement number={finalPrice} /> {getDisplayCurrency()}{getVATDisplayText()} {getPricePerPeriodText()}&nbsp;
                            {hasAnyDiscount && getOriginalPrice() && (
                                <>
                                    {' '}
                                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                                        <NumberElement number={getOriginalPrice()!} /> {getDisplayCurrency()}
                                    </span>
                                </>
                            )}
                        </>
                    </p>
                    {/* Show applied discounts */}
                    {(discountInfo.creatorPercent || discountInfo.discountCodePercent) && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                            <strong style={{ color: '#4caf50' }}>💰 Applied Discounts:</strong>
                            <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', listStyle: 'none' }}>
                                {discountInfo.creatorPercent && (
                                    <li style={{ color: '#4caf50' }}>✓ Creator code: {discountInfo.creatorPercent}% off</li>
                                )}
                                {discountInfo.discountCodePercent && (
                                    <li style={{ color: '#4caf50' }}>✓ Discount code: {discountInfo.discountCodePercent}% off</li>
                                )}
                            </ul>
                            {discountInfo.totalSavings && (
                                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: '#4caf50' }}>
                                    Total savings: ~{discountInfo.totalSavings}% off original price
                                </p>
                            )}
                        </div>
                    )}
                    {currentDuration === Duration.YEARLY && (
                        <>
                            {targetType.productId !== 'starter_premium' && !discountInfo.creatorPercent && !discountInfo.discountCodePercent && (
                                <p className={styles.discount}>
                                    <strong>Savings:</strong> {targetType.productId === 'premium_plus' ? '23%' : '14%'} off compared to monthly billing
                                </p>
                            )}
                            {!validatedDiscount && (targetType.productId !== 'starter_premium' || showStarterDiscountHint) && (
                                <p>
                                    You qualify for using code <code>M2OTC1OQ</code> at checkout, to get an extra <strong>20% discount</strong> on the yearly option
                                </p>
                            )}
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

                <Row style={{ marginBottom: '20px' }}>
                    <Col md={6}>
                        <Card style={{ height: '100%' }}>
                            <Card.Header>
                                <Card.Title style={{ fontSize: '1rem', margin: 0 }}>Creator Code</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Label style={{ color: '#adb5bd', fontSize: '0.9rem' }}>
                                        Support a creator (Optional)
                                    </Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter creator code"
                                            value={creatorCode}
                                            onChange={e => setCreatorCode(e.target.value)}
                                            disabled={isLoadingPrices}
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={applyCreatorCode}
                                            disabled={isLoadingPrices || !creatorCode.trim()}
                                        >
                                            {isLoadingPrices ? <Spinner size="sm" animation="border" /> : 'Apply'}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>
                                {pricingError && (
                                    <div style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem' }}>
                                        {pricingError}
                                    </div>
                                )}
                                {appliedCreatorCode && !pricingError && (
                                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: getDiscountPercentValue(getProductIdForTier(props.selectedTier!, getCurrentDuration())) ? '#20c997' : '#6c757d' }}>
                                        {getDiscountPercentValue(getProductIdForTier(props.selectedTier!, getCurrentDuration()))
                                            ? `✓ Creator code applied! You get ${getDiscountPercentValue(getProductIdForTier(props.selectedTier!, getCurrentDuration()))}% off`
                                            : '✓ Creator code applied'}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card style={{ height: '100%' }}>
                            <Card.Header>
                                <Card.Title style={{ fontSize: '1rem', margin: 0 }}>Discount Code</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Label style={{ color: '#adb5bd', fontSize: '0.9rem' }}>
                                        Have a discount code? (Optional)
                                    </Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter discount code"
                                            value={discountCode}
                                            onChange={e => {
                                                setDiscountCode(e.target.value)
                                                if (validatedDiscount) {
                                                    setValidatedDiscount(null)
                                                }
                                                if (discountError) {
                                                    setDiscountError(null)
                                                }
                                            }}
                                            disabled={isValidatingDiscount}
                                        />
                                        {validatedDiscount ? (
                                            <Button
                                                variant="outline-secondary"
                                                onClick={clearDiscountCode}
                                                disabled={isValidatingDiscount}
                                            >
                                                Clear
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                onClick={validateDiscountCode}
                                                disabled={isValidatingDiscount || !discountCode.trim()}
                                            >
                                                {isValidatingDiscount ? <Spinner size="sm" animation="border" /> : 'Validate'}
                                            </Button>
                                        )}
                                    </InputGroup>
                                </Form.Group>
                                {discountError && (
                                    <div style={{ color: '#dc3545', marginTop: '10px', fontSize: '0.9rem' }}>
                                        {discountError}
                                        {pendingYearlyDiscount && !(isYearOption !== undefined ? isYearOption : (props.selectedDuration === Duration.YEARLY)) && (
                                            <div style={{ marginTop: '8px' }}>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsYearOption(true)
                                                        setValidatedDiscount(pendingYearlyDiscount)
                                                        setPendingYearlyDiscount(null)
                                                        setDiscountError(null)
                                                    }}
                                                >
                                                    Switch to yearly and apply discount
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {validatedDiscount && validatedDiscount.isValid && (
                                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#20c997' }}>
                                        <strong>✓ Discount code valid!</strong>
                                        <br />
                                        {validatedDiscount.name && <span>{validatedDiscount.name}: </span>}
                                        <span>
                                            {validatedDiscount.amountType === 'percent' || validatedDiscount.amountType === 'percentage'
                                                ? `${validatedDiscount.amount}% off`
                                                : `${validatedDiscount.amount} off`}
                                        </span>
                                        {validatedDiscount.durationInMonths > 0 && (
                                            <span> for {validatedDiscount.durationInMonths} payment{validatedDiscount.durationInMonths > 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className={styles.purchaseButtonContainer}>
                    <Button
                        variant="success"
                        size="lg"
                        className={styles.purchaseButton}
                        onClick={() => {
                            setSelectedPremiumType(targetType)
                            startSubscriptionPurchase(
                                selectedPremiumType || wizardSelectedType!,
                                currentDuration
                            )
                            const activeEl = document.activeElement as HTMLElement | null
                            if (activeEl && activeEl.tagName === 'BUTTON') {
                                activeEl.innerText = 'Redirecting to payment provider...'
                                    ; (activeEl as HTMLButtonElement).disabled = true
                            }
                        }}
                    >
                        Continue to our secure payment processor
                    </Button>
                </div>
            </>
        )
    }

    return (
        <>
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title>
                                <b>Premium+</b>
                            </Card.Title>
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
                                        const type = PREMIUM_TYPES.find(type => type.productId === 'premium_plus')
                                        setIsYearOption(false)
                                        setSelectedPremiumType(type)
                                        if (type) startSubscriptionPurchase(type, Duration.MONTHLY)
                                    }}
                                >
                                    <NumberElement number={35.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3 ? (
                                    <>
                                        <p>
                                            Use code <code>M2OTC1OQ</code> at checkout, to get a <b>20% discount</b> on the yearly options
                                        </p>
                                        <Button
                                            variant="success"
                                            className={styles.purchaseButton}
                                            onClick={() => {
                                                const type = PREMIUM_TYPES.find(type => type.productId === 'premium_plus')
                                                setIsYearOption(true)
                                                setSelectedPremiumType(type)
                                                if (type) startSubscriptionPurchase(type, Duration.YEARLY)
                                            }}
                                        >
                                            <NumberElement number={354.2} /> Euro (+VAT) / 52 weeks (23% off)
                                        </Button>
                                    </>
                                ) : null}
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
                                        const type = PREMIUM_TYPES.find(type => type.productId === 'premium')
                                        setIsYearOption(false)
                                        setSelectedPremiumType(type)
                                        if (type) startSubscriptionPurchase(type, Duration.MONTHLY)
                                    }}
                                >
                                    <NumberElement number={8.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3 ? (
                                    <p>
                                        Use code <code>M2OTC1OQ</code> at checkout, to get an extra <b>20% discount</b> on the yearly options
                                    </p>
                                ) : null}
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        const type = PREMIUM_TYPES.find(type => type.productId === 'premium')
                                        setIsYearOption(true)
                                        setSelectedPremiumType(type)
                                        if (type) startSubscriptionPurchase(type, Duration.YEARLY)
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
