import { useState } from 'react'
import { Spinner } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import stepStyles from '../PremiumPurchaseWizard/Steps/Steps.module.css'
import { toast } from 'react-toastify'
import { Duration, PremiumTier, PurchaseType, getTierDisplayName } from '../PremiumPurchaseWizard/types'
import { TierUpsellPanel } from '../../Discounts/DiscountBanners'
import discountStyles from '../../Discounts/Discounts.module.css'
import { postApiPremiumSubscriptionSubscriptionSlug } from '../../../api/_generated/skyApi'
import {
    getProviderPrice,
    getProviderOriginalPrice,
    getProviderCurrencyCode,
    getDiscountPercent,
    getTierApiProductId,
    getTierProductId,
    getPriceWithVAT,
    formatMoney,
    getFallbackSubscriptionPrice,
    SUBSCRIPTION_PRICES
} from '../../../utils/PricingUtils'
import useDiscountCode from '../../../hooks/useDiscountCode'
import { useCheckoutOffer } from '../../../hooks/useCheckoutOffer'
import {
    PaymentProvider,
    getBillingWeeks,
    getCheckoutLink,
    getCheckoutParams,
    getDirectPrice,
    getEveryPeriodLabel,
    getFirstPeriodLabel,
    getPerPeriodLabel,
    getPeriodPercent,
    getSavingsPercent,
    getTaxLabel,
    getVatNote,
    isExactCharge,
    isFirstPaymentOnly
} from '../../../utils/SubscriptionCheckout'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import { formatDiscountEndDate, getActiveSubscriptionDiscount } from '../../../utils/DiscountUtils'
import checkoutStyles from '../Checkout/Checkout.module.css'
import { useBackForwardRestore } from '../Checkout/useBackForwardRestore'
import CountrySelect from '../../CountrySelect/CountrySelect'
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
import { useSubscriptionPricing } from './useSubscriptionPricing'

// The subscription checkout, the last step of the purchase wizard.

interface Props {
    selectedTier: PremiumTier
    selectedDuration: Duration | null
    initialDiscountCode?: string | null
    /** the buyer's country; while it is unknown prices are before tax and no checkout can open */
    countryCode?: string
    onUpgradeTier?: (tier: PremiumTier) => void
    /** changes the wizard's billing period, e.g. to the yearly billing a code is limited to */
    onSelectDuration?: (duration: Duration) => void
}

const CHECKOUT_NOTE = 'Renews automatically until you cancel. Cancel any time on this page; Premium stays active until the end of the paid period.'

const TIER_FEATURES: Record<PremiumTier, string[]> = {
    [PremiumTier.PREMIUM_PLUS]: ['Top flip receive time', 'All tools for analysis', 'Full auction archive', 'Data export & API access'],
    [PremiumTier.STARTER]: ['Ad-free experience', 'Extended limits across features', 'Starter tools & access'],
    [PremiumTier.PREMIUM]: ['Up to 1s slower than Premium+', 'A lot of tools', 'Extended history & filter access']
}

const TIER_CLASS: Partial<Record<PremiumTier, string>> = {
    [PremiumTier.PREMIUM]: stepStyles.tierPremium,
    [PremiumTier.PREMIUM_PLUS]: stepStyles.tierPremiumPlus
}

/** a price rounded up to the next cent, as the Lemon Squeezy estimate always was */
function roundUpToCent(value: number): number {
    return Math.ceil(value * 100) / 100
}

/** what a yearly subscription saves against paying every 4 weeks for 52 weeks, from the list prices (VAT cancels out) */
function getYearlySavingsPercent(tier: PremiumTier): number {
    const prices = SUBSCRIPTION_PRICES[getTierProductId(tier)]
    return prices ? getSavingsPercent(prices.monthly, prices.yearly, 52) : 0
}

function TierFeatures({ tier }: { tier: PremiumTier }) {
    return (
        <div className={checkoutStyles.features}>
            <h6>What you'll get:</h6>
            <ul>
                {TIER_FEATURES[tier].map(feature => (
                    <li key={feature}>{feature}</li>
                ))}
            </ul>
        </div>
    )
}

/** an unknown country: the buyer picks it before any payment button works, it decides the tax and the providers */
function CountryRequired() {
    return (
        <div data-testid="checkout-country-required">
            <CountrySelect />
            <SummaryNote>Choose your country to see the final price and the payment options.</SummaryNote>
        </div>
    )
}

function BuySubscription(props: Props) {
    const variant = usePremiumVariant()
    const [creatorCode, setCreatorCode] = useState('')
    const [busyCheckout, setBusyCheckout] = useState<PaymentProvider | null>(null)
    const [codesOpen, setCodesOpen] = useState<boolean | null>(null)
    // back from the payment provider the cached page would still say "Redirecting…"
    useBackForwardRestore(() => setBusyCheckout(null))
    const tier = props.selectedTier
    const duration = props.selectedDuration || Duration.MONTHLY
    const buyerCountry = props.countryCode
    const billingWeeks = getBillingWeeks(props.selectedDuration)
    const productSlug = getTierApiProductId(tier, duration)
    const summerDiscount = getActiveSubscriptionDiscount()
    const pricing = useSubscriptionPricing(productSlug, buyerCountry)
    const offer = useCheckoutOffer(buyerCountry, productSlug)
    const discount = useDiscountCode(props.initialDiscountCode, {
        weeks: billingWeeks,
        validateInitial: true,
        autoCode: offer.promotion?.code,
        isSubscription: true,
        provider: offer.codeProvider
    })
    const { validated: validatedDiscount, pendingYearly: pendingYearlyDiscount, validating: isValidatingDiscount, error: discountError, code: discountCode } = discount
    const discountCodePercent = getPeriodPercent(validatedDiscount, billingWeeks)
    /** billed by us directly (Stripe/PayPal) in a country whose tax is known: the displayed price is exactly the charge, see getDirectPrice */
    const isDirect = isExactCharge(offer.providers, buyerCountry)
    const { pricingData } = pricing

    const money = (value: number): string => formatMoney(value, getProviderCurrencyCode(pricingData, productSlug, 'lemonsqueezy'))

    /** the plan price before tax, after the creator code (the quote has it in), the list price until a quote arrives */
    function getSubscriptionPrice(): number {
        return getProviderPrice(pricingData, productSlug, 'lemonsqueezy') ?? getFallbackSubscriptionPrice(getTierProductId(tier), duration)
    }

    /** the charged price after the discount code: exact for a direct checkout, otherwise the tax estimate rounded up */
    function getFinalPrice(basePrice: number, percent = discountCodePercent): number {
        if (isDirect) return getDirectPrice(basePrice, percent, buyerCountry)
        return roundUpToCent(getPriceWithVAT(basePrice * (1 - percent / 100), buyerCountry))
    }

    function getOriginalPrice(): number | null {
        const price = getProviderOriginalPrice(pricingData, productSlug, 'lemonsqueezy')
        if (price === null) return null
        if (isDirect) return getDirectPrice(price, 0, buyerCountry)
        return roundUpToCent(getPriceWithVAT(price, buyerCountry))
    }

    function getCreatorCodePercent(): number | null {
        return getDiscountPercent(pricingData, productSlug)
    }

    function getTotalDiscountInfo() {
        const creatorPercent = getCreatorCodePercent()
        const originalPrice = getOriginalPrice()
        const finalPrice = getFinalPrice(getSubscriptionPrice())
        const codePercent = discountCodePercent || null
        if (!originalPrice || finalPrice >= originalPrice) return { creatorPercent, discountCodePercent: codePercent, totalSavings: null, absoluteSavings: null }
        const totalSavings = Math.round((1 - finalPrice / originalPrice) * 100)
        const absoluteSavings = Math.round((originalPrice - finalPrice) * 100) / 100
        return { creatorPercent, discountCodePercent: codePercent, totalSavings, absoluteSavings }
    }

    /** "per 4 weeks (+VAT)", "per 52 weeks" or, while the country is unknown, "per 4 weeks, plus VAT where applicable" */
    function getPriceUnit(): string {
        const vat = getVatNote(buyerCountry, isDirect)
        const period = getPerPeriodLabel(billingWeeks)
        if (!vat) return period
        return buyerCountry ? `${vat} ${period}` : `${period}, ${vat}`
    }

    async function openCheckout(choice: PaymentProvider, googleToken: string) {
        try {
            const params = getCheckoutParams({
                provider: choice,
                country: buyerCountry,
                creatorCode: pricing.appliedCreatorCode,
                discountCode: validatedDiscount?.code,
                promotion: offer.promotion
            })
            const response = await postApiPremiumSubscriptionSubscriptionSlug(productSlug, params, { headers: { GoogleToken: googleToken } })
            const link = response.status === 200 ? getCheckoutLink(response.data) : null
            if (!link) throw new Error('Checkout could not be opened')
            window.open(link, '_self')
        } catch {
            setBusyCheckout(null)
            toast.error('Failed to redirect to payment provider. Please try again.')
        }
    }

    /** opens the payment provider; nothing happens without a login or a country */
    function onSubscribeClick(choice: PaymentProvider) {
        if (!buyerCountry) return
        const googleToken = sessionStorage.getItem('googleId')
        if (!googleToken) {
            toast.error('Please login to continue with the purchase')
            return
        }
        trackPremiumFunnelEvent('checkout started', variant, { product: productSlug, provider: 'subscription', paymentProvider: choice })
        setBusyCheckout(choice)
        void openCheckout(choice, googleToken)
    }

    // the wizard bills yearly from now on, so the price, the product and the code all match
    function applyPendingYearlyDiscount() {
        props.onSelectDuration?.(Duration.YEARLY)
        discount.applyPendingYearly()
    }

    // open while a code is prefilled or in use, until the visitor toggles it
    const isCodesOpen = codesOpen ?? (!!props.initialDiscountCode || !!pricing.appliedCreatorCode || !!validatedDiscount || !!discountError)

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

    function renderYearlySavings(hasCodeDiscount: boolean) {
        const percent = getYearlySavingsPercent(tier)
        if (duration !== Duration.YEARLY || tier === PremiumTier.STARTER || hasCodeDiscount || !percent) return null
        return <Savings>{percent}% off compared to paying every 4 weeks</Savings>
    }

    /** a code for the first payment only: what the subscription renews at afterwards */
    function renderRenewalNote() {
        if (!discountCodePercent || !isFirstPaymentOnly(validatedDiscount)) return null
        const renewal = getFinalPrice(getSubscriptionPrice(), 0)
        return (
            <SummaryNote>
                The discount covers the {getFirstPeriodLabel(billingWeeks)}. Then {money(renewal)} {getPriceUnit()}.
            </SummaryNote>
        )
    }

    function renderSummerDiscount() {
        if (!summerDiscount || validatedDiscount) return null
        return (
            <SummaryNote>
                <strong>{summerDiscount.label}:</strong> use code <code>{summerDiscount.code}</code> at checkout for <strong>{summerDiscount.percentage}% off</strong>{' '}
                until {formatDiscountEndDate(summerDiscount.endsAt)}.
            </SummaryNote>
        )
    }

    /** the same tax wording as the price: an exact direct charge includes VAT (or none is added, US), estimates say so */
    function renderTaxNote() {
        if (!buyerCountry) return <SummaryNote>Prices are before VAT until you choose your country. VAT is added where applicable.</SummaryNote>
        return <SummaryNote>{getTaxLabel(buyerCountry, isDirect)}.</SummaryNote>
    }

    function renderSummary() {
        const finalPrice = getFinalPrice(getSubscriptionPrice())
        const discountInfo = getTotalDiscountInfo()
        const originalPrice = getOriginalPrice()
        const hasActiveDiscount = (getCreatorCodePercent() ?? 0) > 0
        const showOriginal = (hasActiveDiscount || !!validatedDiscount) && !!originalPrice
        const hasCodeDiscount = !!discountInfo.creatorPercent || !!discountInfo.discountCodePercent
        return (
            <>
                <SummaryRow label="Plan">
                    <span className={TIER_CLASS[tier] ?? ''}>{getTierDisplayName(tier)}</span>
                </SummaryRow>
                <SummaryRow label="Payment">Subscription</SummaryRow>
                <SummaryRow label="Billing">Renews {getEveryPeriodLabel(billingWeeks)}</SummaryRow>
                {discountInfo.creatorPercent ? <SummaryRow label="Creator code">-{discountInfo.creatorPercent}%</SummaryRow> : null}
                {discountInfo.discountCodePercent ? <SummaryRow label="Discount code">-{discountInfo.discountCodePercent}%</SummaryRow> : null}
                <SummaryTotal label="Price" amount={money(finalPrice)} original={showOriginal ? money(originalPrice!) : null} unit={getPriceUnit()}>
                    {renderSavings(discountInfo)}
                    {renderYearlySavings(hasCodeDiscount)}
                    {renderRenewalNote()}
                </SummaryTotal>
                {offer.promotion && validatedDiscount?.code === offer.promotion.code ? <PromotionNote promotion={offer.promotion} weeks={billingWeeks} /> : null}
                {pricing.error ? <CheckoutError>{pricing.error}</CheckoutError> : null}
                {renderSummerDiscount()}
                {renderTaxNote()}
            </>
        )
    }

    function renderDiscountCodeMessage() {
        const canSwitchToYearly = pendingYearlyDiscount && duration !== Duration.YEARLY && props.onSelectDuration
        const switchToYearly = canSwitchToYearly ? (
            <div className={styles.messageAction}>
                <button type="button" className={styles.linkButton} onClick={applyPendingYearlyDiscount}>
                    Switch to yearly and apply discount
                </button>
            </div>
        ) : null
        return <DiscountCodeMessage error={discountError} discount={validatedDiscount} weeks={billingWeeks} errorAction={switchToYearly} />
    }

    function renderCreatorCodeField() {
        return (
            <CodeField
                label="Creator code (optional, supports a creator)"
                placeholder="Enter creator code"
                value={creatorCode}
                onChange={setCreatorCode}
                disabled={pricing.isLoading}
                actionLabel={pricing.isLoading ? <Spinner size="sm" animation="border" /> : 'Apply'}
                onAction={() => pricing.applyCreatorCode(creatorCode)}
                // the code is checked with the country's quote
                actionDisabled={pricing.isLoading || !creatorCode.trim() || !buyerCountry}
            >
                {pricing.appliedCreatorCode && !pricing.error ? <CreatorCodeMessage percent={getCreatorCodePercent()} /> : null}
            </CodeField>
        )
    }

    function renderCodes() {
        return (
            <CodeDisclosure open={isCodesOpen} onToggle={() => setCodesOpen(!isCodesOpen)}>
                {renderCreatorCodeField()}
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

    /** card and PayPal while the direct providers are on, otherwise the single Lemon Squeezy button; none without a country */
    function renderPaymentButtons() {
        if (!buyerCountry) return <CountryRequired />
        if (offer.loading)
            return (
                <CheckoutButton tier={tier} busy busyLabel="Loading payment options..." onClick={() => undefined}>
                    Loading payment options...
                </CheckoutButton>
            )
        if (offer.providers.length > 0) return <ProviderButtons tier={tier} providers={offer.providers} busyProvider={busyCheckout} onPay={onSubscribeClick} />
        return (
            <CheckoutButton tier={tier} busy={busyCheckout !== null} busyLabel="Redirecting to payment provider..." onClick={() => onSubscribeClick('lemonsqueezy')}>
                Continue to our secure payment processor
            </CheckoutButton>
        )
    }

    return (
        <CheckoutLayout
            summary={renderSummary()}
            actions={
                <>
                    {renderCodes()}
                    <PaymentActions note={CHECKOUT_NOTE}>{renderPaymentButtons()}</PaymentActions>
                </>
            }
        >
            <div className={discountStyles.featuresRow}>
                <TierFeatures tier={tier} />
                <TierUpsellPanel
                    currentTier={tier}
                    purchaseType={PurchaseType.SUBSCRIPTION}
                    duration={duration}
                    countryCode={buyerCountry}
                    onUpgrade={nextTier => props.onUpgradeTier?.(nextTier)}
                />
            </div>
        </CheckoutLayout>
    )
}

export default BuySubscription
