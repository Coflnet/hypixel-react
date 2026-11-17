import { useState, useEffect } from 'react'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import stepStyles from '../PremiumPurchaseWizard/Steps/Steps.module.css'
import NumberElement from '../../Number/Number'
import { toast } from 'react-toastify'
import { Duration, PremiumTier, PurchaseType, getTierDisplayName } from '../PremiumPurchaseWizard/types'
import { TierUpsellPanel } from '../../Discounts/DiscountBanners'
import discountStyles from '../../Discounts/Discounts.module.css'
import { postApiPremiumSubscriptionSubscriptionSlug, postApiTopupRates } from '../../../api/_generated/skyApi'
import { BatchProductPricingResponse } from '../../../api/_generated/skyApi.schemas'
import {
    getProviderPrice,
    getProviderOriginalPrice,
    getProviderCurrencyCode,
    getDiscountPercent,
    getTierApiProductId,
    VAT_RATES,
    formatMoney
} from '../../../utils/PricingUtils'
import useDiscountCode from '../../../hooks/useDiscountCode'
import { useCheckoutOffer } from '../../../hooks/useCheckoutOffer'
import {
    PaymentProvider,
    getBillingWeeks,
    getCheckoutLink,
    getCheckoutParams,
    getDirectPrice,
    getFirstPeriodLabel,
    getPeriodPercent,
    isExactCharge,
    isFirstPaymentOnly,
    showsVatSuffix
} from '../../../utils/SubscriptionCheckout'
import { useCountryDetection } from '../../../hooks/useCountryDetection'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import { formatDiscountEndDate, getActiveSubscriptionDiscount } from '../../../utils/DiscountUtils'
import checkoutStyles from '../Checkout/Checkout.module.css'
import { useBackForwardRestore } from '../Checkout/useBackForwardRestore'
import {
    CheckoutButton,
    CheckoutError,
    CheckoutLayout,
    CreatorCodeMessage,
    DiscountCodeMessage,
    CodeDisclosure,
    CodeField,
    PaymentActions,
    PromotionNote,
    ProviderButtons,
    Savings,
    SummaryNote,
    SummaryRow,
    SummaryTotal
} from '../Checkout/CheckoutParts'

interface Props {
    activePremiumProduct: PremiumProduct
    selectedTier?: PremiumTier
    selectedDuration?: Duration | null
    initialDiscountCode?: string | null
    countryCode?: string
    onUpgradeTier?: (tier: PremiumTier) => void
    /** changes the wizard's billing period, e.g. to the yearly billing a code is limited to */
    onSelectDuration?: (duration: Duration) => void
}

/** the checkout opened by a payment button: the provider, or Lemon Squeezy's single button */
type CheckoutChoice = PaymentProvider

const CHECKOUT_NOTE = 'Renews automatically until you cancel. Cancel any time on this page; Premium stays active until the end of the paid period.'

const TIER_OF_PRODUCT: Record<string, PremiumTier> = {
    premium: PremiumTier.PREMIUM,
    premium_plus: PremiumTier.PREMIUM_PLUS,
    starter_premium: PremiumTier.STARTER
}

function getTierOfType(type: PremiumType): PremiumTier {
    return TIER_OF_PRODUCT[type.productId] ?? PremiumTier.PREMIUM
}

function BuySubscription(props: Props) {
    const variant = usePremiumVariant()
    const [selectedPremiumType, setSelectedPremiumType] = useState<PremiumType>()
    const [creatorCode, setCreatorCode] = useState('')
    const [isLoadingPrices, setIsLoadingPrices] = useState(false)
    const [pricingData, setPricingData] = useState<BatchProductPricingResponse | null>(null)
    const [pricingError, setPricingError] = useState<string | null>(null)
    const [appliedCreatorCode, setAppliedCreatorCode] = useState<string | null>(null)
    const [busyCheckout, setBusyCheckout] = useState<CheckoutChoice | null>(null)
    const [codesOpen, setCodesOpen] = useState<boolean | null>(null)
    // back from the payment provider the cached page would still say "Redirecting…"
    useBackForwardRestore(() => setBusyCheckout(null))
    const { selectedCountry } = useCountryDetection()
    const summerDiscount = getActiveSubscriptionDiscount()
    const isWizardCheckout = !!props.selectedTier && props.selectedDuration !== undefined
    const buyerCountry = props.countryCode || selectedCountry?.value
    const country = buyerCountry || 'US'
    const billingWeeks = getBillingWeeks(props.selectedDuration)
    const offer = useCheckoutOffer(
        isWizardCheckout ? buyerCountry : undefined,
        isWizardCheckout ? getTierApiProductId(props.selectedTier!, props.selectedDuration || Duration.MONTHLY) : undefined
    )
    const discount = useDiscountCode(props.initialDiscountCode, {
        weeks: isWizardCheckout ? billingWeeks : undefined,
        validateInitial: true,
        autoCode: offer.promotion?.code,
        isSubscription: true,
        provider: offer.codeProvider
    })
    const { validated: validatedDiscount, pendingYearly: pendingYearlyDiscount, validating: isValidatingDiscount, error: discountError, code: discountCode } = discount
    const discountCodePercent = getPeriodPercent(validatedDiscount, billingWeeks)

    // the yearly switch and the tier upgrade at the checkout change the product: it has its own price
    useEffect(() => {
        fetchPricing(appliedCreatorCode ?? '')
    }, [props.selectedDuration, props.selectedTier])

    const fetchPricing = async (code: string) => {
        setIsLoadingPrices(true)
        setPricingError(null)

        try {
            let productSlugs: string[] = []
            if (props.selectedTier && props.selectedDuration !== undefined) {
                const productId = getProductIdForTier(props.selectedTier, getCurrentDuration())
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
                countryCode: country,
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

    const getCurrencyCode = (): string => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return 'EUR'
        return getCurrencyCodeValue(getProductIdForTier(props.selectedTier, getCurrentDuration()), 'lemonsqueezy')
    }

    const money = (value: number): string => formatMoney(value, getCurrencyCode())

    /** billed by us directly (Stripe/PayPal) in a country whose tax is known: the displayed price is exactly the charge, see getDirectPrice */
    const isDirect = isExactCharge(offer.providers, buyerCountry)

    const getOriginalPrice = (): number | null => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return null
        const productId = getProductIdForTier(props.selectedTier, getCurrentDuration())
        const price = getProviderOriginalPriceValue(productId, 'lemonsqueezy')
        if (price === null) return null
        if (isDirect) return getDirectPrice(price, 0, country)
        return Math.ceil(getPriceWithVAT(price) * 100) / 100
    }

    const hasActiveDiscount = (): boolean => {
        if (!pricingData || !pricingData.products || !props.selectedTier) return false
        const productId = getProductIdForTier(props.selectedTier, getCurrentDuration())
        const discountPercent = getDiscountPercentValue(productId)
        return discountPercent !== null && discountPercent > 0
    }

    // Get VAT rate for current country
    const getVATRate = (): number => {
        const upperCode = country.toUpperCase()
        return VAT_RATES[upperCode] ?? 0
    }

    // Check if VAT should be included in the price (known country with VAT rate)
    const shouldIncludeVATInPrice = (): boolean => {
        const upperCode = country.toUpperCase()
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
        return showsVatSuffix(buyerCountry, isDirect) ? ' (+VAT)' : ''
    }

    // Calculate final price after both creator code and discount code are applied
    const getFinalPrice = (basePrice: number, percent = discountCodePercent): number => {
        // Creator code discount is already applied in basePrice from API
        if (isDirect) return getDirectPrice(basePrice, percent, country)
        // Lemon Squeezy: discount code on top and then VAT, rounded up to the next cent
        const priceWithVat = getPriceWithVAT(basePrice * (1 - percent / 100))
        return Math.ceil(priceWithVat * 100) / 100
    }

    // Get the total discount percentage (creator code + discount code)
    const getTotalDiscountInfo = (): {
        creatorPercent: number | null
        discountCodePercent: number | null
        totalSavings: number | null
        absoluteSavings: number | null
    } => {
        const creatorPercent = props.selectedTier ? getDiscountPercentValue(getProductIdForTier(props.selectedTier, getCurrentDuration())) : null
        const originalPrice = getOriginalPrice()
        const basePrice = getSubscriptionPrice()
        const finalPrice = getFinalPrice(basePrice)

        if (originalPrice && finalPrice < originalPrice) {
            const totalSavings = Math.round((1 - finalPrice / originalPrice) * 100)
            const absoluteSavings = Math.round((originalPrice - finalPrice) * 100) / 100
            return { creatorPercent, discountCodePercent: discountCodePercent || null, totalSavings, absoluteSavings }
        }

        return { creatorPercent, discountCodePercent: discountCodePercent || null, totalSavings: null, absoluteSavings: null }
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

    async function openCheckout(productId: string, choice: CheckoutChoice, googleToken: string) {
        try {
            const params = getCheckoutParams({
                provider: choice,
                country: buyerCountry,
                creatorCode: appliedCreatorCode,
                discountCode: validatedDiscount?.code,
                promotion: offer.promotion
            })
            const response = await postApiPremiumSubscriptionSubscriptionSlug(productId, params, { headers: { GoogleToken: googleToken } })
            const link = response.status === 200 ? getCheckoutLink(response.data) : null
            if (!link) throw new Error('Checkout could not be opened')
            window.open(link, '_self')
        } catch {
            setBusyCheckout(null)
            toast.error('Failed to redirect to payment provider. Please try again.')
        }
    }

    /** opens the payment provider; false when the purchase could not start (no login) */
    function startSubscriptionPurchase(targetType: PremiumType, duration: Duration = Duration.MONTHLY, choice: CheckoutChoice = 'lemonsqueezy'): boolean {
        if (!targetType) return false
        const googleToken = sessionStorage.getItem('googleId')
        if (!googleToken) {
            toast.error('Please login to continue with the purchase')
            return false
        }
        const productId = getTierApiProductId(getTierOfType(targetType), duration)
        trackPremiumFunnelEvent('checkout started', variant, { product: productId, provider: 'subscription', paymentProvider: choice })
        void openCheckout(productId, choice, googleToken)
        return true
    }

    const isYearlySelected = (): boolean => props.selectedDuration === Duration.YEARLY

    const getCreatorCodePercent = (): number | null =>
        props.selectedTier ? getDiscountPercentValue(getProductIdForTier(props.selectedTier, getCurrentDuration())) : null

    const getBillingDisplayText = (): string => {
        switch (getCurrentDuration()) {
            case Duration.YEARLY:
                return 'Yearly (52 weeks)'
            case Duration.QUARTER:
                return 'Quarterly (13 weeks)'
            default:
                return 'Monthly (4 weeks)'
        }
    }

    const getPricePerPeriodText = (): string => {
        switch (getCurrentDuration()) {
            case Duration.YEARLY:
                return 'per year'
            case Duration.QUARTER:
                return 'per quarter'
            default:
                return 'per month'
        }
    }

    // the wizard bills yearly from now on, so the price, the product and the code all match
    const applyPendingYearlyDiscount = () => {
        props.onSelectDuration?.(Duration.YEARLY)
        discount.applyPendingYearly()
    }

    // open while a code is prefilled or in use, until the visitor toggles it
    const isCodesOpen = codesOpen ?? (!!props.initialDiscountCode || !!appliedCreatorCode || !!validatedDiscount || !!discountError)

    function renderSavings(discountInfo: ReturnType<typeof getTotalDiscountInfo>) {
        if (!discountInfo.creatorPercent && !discountInfo.discountCodePercent) return null
        if (discountInfo.absoluteSavings) {
            return (
                <Savings>
                    You save {money(discountInfo.absoluteSavings)}
                    {discountInfo.totalSavings ? ` (~${discountInfo.totalSavings}% off)` : ''}
                </Savings>
            )
        }
        if (discountInfo.totalSavings) return <Savings>Total savings: ~{discountInfo.totalSavings}% off original price</Savings>
        return null
    }

    function renderSummary(targetType: PremiumType) {
        const finalPrice = getFinalPrice(getSubscriptionPrice())
        const discountInfo = getTotalDiscountInfo()
        const originalPrice = getOriginalPrice()
        const showOriginal = (hasActiveDiscount() || !!validatedDiscount) && !!originalPrice
        const hasCodeDiscount = !!discountInfo.creatorPercent || !!discountInfo.discountCodePercent
        return (
            <>
                <SummaryRow label="Plan">
                    <span className={props.selectedTier === PremiumTier.PREMIUM_PLUS ? stepStyles.tierPremiumPlus : props.selectedTier === PremiumTier.PREMIUM ? stepStyles.tierPremium : ''}>
                        {getDisplayTierName()}
                    </span>
                </SummaryRow>
                <SummaryRow label="Payment">Subscription</SummaryRow>
                <SummaryRow label="Billing">{getBillingDisplayText()}</SummaryRow>
                {discountInfo.creatorPercent ? <SummaryRow label="Creator code">-{discountInfo.creatorPercent}%</SummaryRow> : null}
                {discountInfo.discountCodePercent ? <SummaryRow label="Discount code">-{discountInfo.discountCodePercent}%</SummaryRow> : null}
                <SummaryTotal
                    label="Price"
                    amount={money(finalPrice)}
                    original={showOriginal ? money(originalPrice!) : null}
                    unit={`${getVATDisplayText().trim()} ${getPricePerPeriodText()}`.trim()}
                >
                    {renderSavings(discountInfo)}
                    {getCurrentDuration() === Duration.YEARLY && targetType.productId !== 'starter_premium' && !hasCodeDiscount ? (
                        <Savings>{targetType.productId === 'premium_plus' ? '23%' : '14%'} off compared to monthly billing</Savings>
                    ) : null}
                    {renderRenewalNote()}
                </SummaryTotal>
                {offer.promotion && validatedDiscount?.code === offer.promotion.code ? <PromotionNote promotion={offer.promotion} weeks={billingWeeks} /> : null}
                {pricingError ? <CheckoutError>{pricingError}</CheckoutError> : null}
                {summerDiscount && !validatedDiscount ? (
                    <SummaryNote>
                        <strong>{summerDiscount.label}:</strong> use code <code>{summerDiscount.code}</code> at checkout for <strong>{summerDiscount.percentage}% off</strong>{' '}
                        until {formatDiscountEndDate(summerDiscount.endsAt)}.
                    </SummaryNote>
                ) : null}
                <SummaryNote>Prices include VAT for your country where available. In the US and some other countries it is added at checkout.</SummaryNote>
            </>
        )
    }

    /** a code for the first payment only: what the subscription renews at afterwards */
    function renderRenewalNote() {
        if (!discountCodePercent || !isFirstPaymentOnly(validatedDiscount)) return null
        const renewal = getFinalPrice(getSubscriptionPrice(), 0)
        return (
            <SummaryNote>
                The discount covers the {getFirstPeriodLabel(billingWeeks)}. Then {money(renewal)}
                {getVATDisplayText()} {getPricePerPeriodText()}.
            </SummaryNote>
        )
    }

    function renderCreatorCodeMessage() {
        if (!appliedCreatorCode || pricingError) return null
        return <CreatorCodeMessage percent={getCreatorCodePercent()} />
    }

    function renderDiscountCodeMessage() {
        const switchToYearly =
            pendingYearlyDiscount && !isYearlySelected() && props.onSelectDuration ? (
                <div className={styles.messageAction}>
                    <button type="button" className={styles.linkButton} onClick={applyPendingYearlyDiscount}>
                        Switch to yearly and apply discount
                    </button>
                </div>
            ) : null
        return <DiscountCodeMessage error={discountError} discount={validatedDiscount} weeks={billingWeeks} errorAction={switchToYearly} />
    }

    function renderCodes() {
        return (
            <CodeDisclosure open={isCodesOpen} onToggle={() => setCodesOpen(!isCodesOpen)}>
                <CodeField
                    label="Creator code (optional, supports a creator)"
                    placeholder="Enter creator code"
                    value={creatorCode}
                    onChange={setCreatorCode}
                    disabled={isLoadingPrices}
                    actionLabel={isLoadingPrices ? <Spinner size="sm" animation="border" /> : 'Apply'}
                    onAction={applyCreatorCode}
                    actionDisabled={isLoadingPrices || !creatorCode.trim()}
                >
                    {renderCreatorCodeMessage()}
                </CodeField>
                <CodeField
                    label="Discount code"
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={discount.changeCode}
                    disabled={isValidatingDiscount}
                    actionLabel={validatedDiscount ? 'Clear' : isValidatingDiscount ? <Spinner size="sm" animation="border" /> : 'Apply'}
                    onAction={validatedDiscount ? discount.clear : () => discount.validate()}
                    actionDisabled={isValidatingDiscount || (!validatedDiscount && !discountCode.trim())}
                >
                    {renderDiscountCodeMessage()}
                </CodeField>
            </CodeDisclosure>
        )
    }

    function renderFeatures(targetType: PremiumType) {
        return (
            <div className={discountStyles.featuresRow}>
                <div className={checkoutStyles.features}>
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
                {props.selectedTier && (
                    <TierUpsellPanel
                        currentTier={props.selectedTier}
                        purchaseType={PurchaseType.SUBSCRIPTION}
                        duration={getCurrentDuration()}
                        countryCode={country}
                        onUpgrade={tier => props.onUpgradeTier?.(tier)}
                    />
                )}
            </div>
        )
    }

    function onSubscribeClick(targetType: PremiumType, choice: CheckoutChoice) {
        setSelectedPremiumType(targetType)
        if (startSubscriptionPurchase(selectedPremiumType || wizardSelectedType!, getCurrentDuration(), choice)) setBusyCheckout(choice)
    }

    /** card and PayPal while the direct providers are on, otherwise the single Lemon Squeezy button */
    function renderPaymentButtons(tier: PremiumTier, targetType: PremiumType) {
        if (offer.loading)
            return (
                <CheckoutButton tier={tier} busy busyLabel="Loading payment options..." onClick={() => undefined}>
                    Loading payment options...
                </CheckoutButton>
            )
        if (offer.providers.length > 0)
            return <ProviderButtons tier={tier} providers={offer.providers} busyProvider={busyCheckout} onPay={choice => onSubscribeClick(targetType, choice)} />
        return (
            <CheckoutButton
                tier={tier}
                busy={busyCheckout !== null}
                busyLabel="Redirecting to payment provider..."
                onClick={() => onSubscribeClick(targetType, 'lemonsqueezy')}
            >
                Continue to our secure payment processor
            </CheckoutButton>
        )
    }

    if (isWizardCheckout) {
        const targetType = wizardSelectedType!
        return (
            <CheckoutLayout
                summary={renderSummary(targetType)}
                actions={
                    <>
                        {renderCodes()}
                        <PaymentActions note={CHECKOUT_NOTE}>{renderPaymentButtons(props.selectedTier!, targetType)}</PaymentActions>
                    </>
                }
            >
                {renderFeatures(targetType)}
            </CheckoutLayout>
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
                                        setSelectedPremiumType(type)
                                        if (type) startSubscriptionPurchase(type, Duration.MONTHLY)
                                    }}
                                >
                                    <NumberElement number={35.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3 ? (
                                    <>
                                        {summerDiscount && (
                                            <p>
                                                ☀️ <b>{summerDiscount.label}:</b> use code <code>{summerDiscount.code}</code> at checkout for a{' '}
                                                <b>{summerDiscount.percentage}% discount</b> until {formatDiscountEndDate(summerDiscount.endsAt)}
                                            </p>
                                        )}
                                        <Button
                                            variant="success"
                                            className={styles.purchaseButton}
                                            onClick={() => {
                                                const type = PREMIUM_TYPES.find(type => type.productId === 'premium_plus')
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
                                        setSelectedPremiumType(type)
                                        if (type) startSubscriptionPurchase(type, Duration.MONTHLY)
                                    }}
                                >
                                    <NumberElement number={8.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {summerDiscount && (!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3) ? (
                                    <p>
                                        ☀️ <b>{summerDiscount.label}:</b> use code <code>{summerDiscount.code}</code> at checkout for a{' '}
                                        <b>{summerDiscount.percentage}% discount</b> until {formatDiscountEndDate(summerDiscount.endsAt)}
                                    </p>
                                ) : null}
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        const type = PREMIUM_TYPES.find(type => type.productId === 'premium')
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
