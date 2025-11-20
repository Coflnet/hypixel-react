import { useState, useEffect } from 'react'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import api from '../../../api/ApiHelper'
import { Button, Card, Col, Row, Form } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import NumberElement from '../../Number/Number'
import { toast } from 'react-toastify'
import { Duration, PremiumTier, getTierDisplayName } from '../PremiumPurchaseWizard/types'
import { postApiTopupRates } from '../../../api/_generated/skyApi'
import { BatchProductPricingResponse } from '../../../api/_generated/skyApi.schemas'
import {
    getCurrencySymbol,
    getProviderPrice,
    getProviderOriginalPrice,
    getProviderCurrencyCode,
    getDiscountPercent,
    getTierApiProductId,
    getTierProductId,
    getFallbackSubscriptionPrice
} from '../../../utils/pricingUtils'

interface Props {
    activePremiumProduct: PremiumProduct
    selectedTier?: PremiumTier
    selectedDuration?: Duration | null
    creatorCode?: string
}

function BuySubscription(props: Props) {
    const [selectedPremiumType, setSelectedPremiumType] = useState<PremiumType>()
    const [isYearOption, setIsYearOption] = useState<boolean>()
    const [creatorCode, setCreatorCode] = useState(props.creatorCode || '')
    const [isLoadingPrices, setIsLoadingPrices] = useState(false)
    const [pricingData, setPricingData] = useState<BatchProductPricingResponse | null>(null)
    const [pricingError, setPricingError] = useState<string | null>(null)
    const [appliedCreatorCode, setAppliedCreatorCode] = useState<string | null>(null)

    // Get country code from localStorage
    const countryCode = typeof window !== 'undefined' ? localStorage.getItem('countryCode') || 'US' : 'US'

    useEffect(() => {
        fetchPricing(creatorCode)
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
                    'l_premium-year',
                    'l_prem_plus',
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

    const getProductIdForTier = (tier: PremiumTier, isYearly: boolean): string => {
        return getTierApiProductId(tier, isYearly)
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

    const getDisplayCurrency = (): string => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return 'Euro'
        const productId = getProductIdForTier(props.selectedTier, wizardIsYearOption)
        const currencyCode = getCurrencyCodeValue(productId, 'lemonsqueezy')
        const symbol = getCurrencySymbol(currencyCode)
        return symbol === currencyCode ? currencyCode : symbol
    }

    const getOriginalPrice = (): number | null => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return null
        const productId = getProductIdForTier(props.selectedTier, wizardIsYearOption)
        return getProviderOriginalPriceValue(productId, 'lemonsqueezy')
    }

    const hasActiveDiscount = (): boolean => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return false
        const productId = getProductIdForTier(props.selectedTier, wizardIsYearOption)
        const discountPercent = getDiscountPercentValue(productId)
        return discountPercent !== null && discountPercent > 0
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

    const getDisplayTierName = () => {
        return props.selectedTier ? getTierDisplayName(props.selectedTier) : 'Premium'
    }

    function getSubscriptionPrice() {
        const targetType = selectedPremiumType || wizardSelectedType
        if (!targetType) {
            return -1
        }
        const yearOption = isYearOption !== undefined ? isYearOption : wizardIsYearOption

        if (pricingData && pricingData.products) {
            const productId = getProductIdForTier(
                props.selectedTier || PremiumTier.PREMIUM,
                yearOption
            )
            const price = getProviderPriceValue(productId, 'lemonsqueezy')
            if (price !== null) {
                return price
            }
        }

        if (targetType.productId === 'premium') {
            return yearOption ? 96.69 : 8.69
        }
        if (targetType.productId === 'premium_plus') {
            return yearOption ? 354.2 : 35.69
        }
        if (targetType.productId === 'starter_premium') {
            return 16.99 // only yearly option
        }
        return -1
    }

    function startSubscriptionPurchase(targetType: PremiumType, yearOption: boolean) {
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
        if (yearOption) {
            productId += '-year'
        }

        const productIdWithCode = appliedCreatorCode ? `${productId}?creatorCode=${encodeURIComponent(appliedCreatorCode)}` : productId

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
        const yearOption = wizardIsYearOption
        const price = getSubscriptionPrice()

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
                        <strong>Billing:</strong> {yearOption ? 'Yearly (52 weeks)' : 'Monthly (4 weeks)'}
                    </p>
                    <p>
                        {yearOption ? (
                            <>
                                <strong>Price:</strong> <NumberElement number={price} /> {getDisplayCurrency()} (+VAT) per year&nbsp;
                                {hasActiveDiscount() && getOriginalPrice() && (
                                    <>
                                        {' '}
                                        <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                                            <NumberElement number={getOriginalPrice()!} /> {getDisplayCurrency()}
                                        </span>
                                        {' '}
                                        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                                            {getDiscountPercentValue(getProductIdForTier(props.selectedTier!, wizardIsYearOption))}% OFF
                                        </span>
                                    </>
                                )}
                                <br />
                                (<NumberElement number={parseFloat((price / 13).toFixed(2))} /> {getDisplayCurrency()} (+VAT) per 4 weeks)
                            </>
                        ) : (
                            <>
                                <strong>Price:</strong> <NumberElement number={price} /> {getDisplayCurrency()} (+VAT) per 4 weeks
                                {hasActiveDiscount() && getOriginalPrice() && (
                                    <>
                                        {' '}
                                        <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                                            <NumberElement number={getOriginalPrice()!} /> {getDisplayCurrency()}
                                        </span>
                                        {' '}
                                        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                                            {getDiscountPercentValue(getProductIdForTier(props.selectedTier!, wizardIsYearOption))}% OFF
                                        </span>
                                    </>
                                )}
                            </>
                        )}
                    </p>
                    {yearOption && (
                        <>
                            {targetType.productId !== 'starter_premium' && (
                                <p className={styles.discount}>
                                    <strong>Savings:</strong> {targetType.productId === 'premium_plus' ? '23%' : '14%'} off compared to monthly billing
                                </p>
                            )}
                            <p>
                                You qualify for using code <code>M2OTC1OQ</code> at checkout, to get an extra <strong>20% discount</strong> on the yearly option
                            </p>
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

                <Card style={{ marginBottom: '20px' }}>
                    <Card.Header>
                        <Card.Title>Creator Code</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Form.Group>
                            <Form.Control
                                type="text"
                                placeholder="Enter creator code (optional)"
                                value={creatorCode}
                                onChange={e => setCreatorCode(e.target.value)}
                                disabled={isLoadingPrices}
                            />
                            <Button
                                variant="primary"
                                onClick={applyCreatorCode}
                                disabled={isLoadingPrices}
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                {isLoadingPrices ? 'Loading...' : 'Apply Code'}
                            </Button>
                        </Form.Group>
                        {pricingError && (
                            <div style={{ color: 'red', marginTop: '10px' }}>
                                {pricingError}
                            </div>
                        )}
                        {appliedCreatorCode && !pricingError && (
                            <div style={{ marginTop: '10px', color: getDiscountPercentValue(getProductIdForTier(props.selectedTier!, yearOption)) ? 'green' : 'blue' }}>
                                {getDiscountPercentValue(getProductIdForTier(props.selectedTier!, yearOption)) 
                                    ? `Creator code applied! You get ${getDiscountPercentValue(getProductIdForTier(props.selectedTier!, yearOption))}% off` 
                                    : 'Creator code applied'}
                            </div>
                        )}
                    </Card.Body>
                </Card>

                <div className={styles.purchaseButtonContainer}>
                    <Button
                        variant="success"
                        size="lg"
                        className={styles.purchaseButton}
                        onClick={() => {
                            setSelectedPremiumType(targetType)
                            setIsYearOption(yearOption)
                            startSubscriptionPurchase(
                                selectedPremiumType || wizardSelectedType!,
                                isYearOption !== undefined ? isYearOption : wizardIsYearOption
                            )
                            const activeEl = document.activeElement as HTMLElement | null
                            if (activeEl && activeEl.tagName === 'BUTTON') {
                                activeEl.innerText = 'Redirecting to payment provider...'
                                ;(activeEl as HTMLButtonElement).disabled = true
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
                                        if (type) startSubscriptionPurchase(type, false)
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
                                                if (type) startSubscriptionPurchase(type, true)
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
                                        if (type) startSubscriptionPurchase(type, false)
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
                                        if (type) startSubscriptionPurchase(type, true)
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
