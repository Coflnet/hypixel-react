import { useState } from 'react'
import { Spinner } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import stepStyles from '../PremiumPurchaseWizard/Steps/Steps.module.css'
import { toast } from 'react-toastify'
import { CheckoutCodes, Duration, PremiumTier, getTierDisplayName } from '../PremiumPurchaseWizard/types'
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
import { useRenewalPrice } from '../../../hooks/useRenewalPrice'
import {
    CANCEL_ANYTIME,
    RENEWAL_WEEKS,
    PaymentProvider,
    describeRenewal,
    describeUpgradeCodeSavings,
    getBillingLabel,
    getBillingWeeks,
    getFourWeekProductSlug,
    getRenewalPrice,
    hasRenewalTerm,
    isFourWeekContinuation,
    isNetCharge,
    getCheckoutLink,
    getCheckoutParams,
    getDirectPrice,
    getCheckoutErrorMessage,
    getDeclarationErrorSlug,
    getFirstPeriodLabel,
    getPerPeriodLabel,
    getPeriodPercent,
    getSavingsPercent,
    getSubscriptionDeclaration,
    getTaxLabel,
    getVatNote,
    isExactCharge,
    isFirstPaymentOnly
} from '../../../utils/SubscriptionCheckout'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import checkoutStyles from '../Checkout/Checkout.module.css'
import { useBackForwardRestore } from '../Checkout/useBackForwardRestore'
import CountrySelect from '../../CountrySelect/CountrySelect'
import {
    CheckoutButton,
    CheckoutError,
    CheckoutLayout,
    CreatorCodeMessage,
    DiscountCodeMessage,
    LinkCodeReplacedNote,
    getDiscountCodeAction,
    CodeDisclosure,
    CodeField,
    PaymentActions,
    PromotionNote,
    ProviderButtons,
    Savings,
    SubscriptionUnavailable,
    LemonSqueezyShutdownNote,
    SummaryNote,
    SummaryRow,
    SummaryTotal
} from '../Checkout/CheckoutParts'
import { getNextHigherTier, getTierHighlights, getTierIntro } from '../../PremiumLanding/content/tierHighlights'
import { useSubscriptionPricing } from './useSubscriptionPricing'
import { usePurchaseDeclaration } from '../../../hooks/usePurchaseDeclaration'
import { useCheckoutRequestId } from '../../../hooks/useCheckoutRequestId'
import { usePlaySubscriptionsEnabled } from '../../../hooks/usePlaySubscriptionsEnabled'
import PurchaseDeclaration from '../PurchaseDeclaration/PurchaseDeclaration'

// The subscription checkout, the last step of the purchase wizard.

interface Props {
    selectedTier: PremiumTier
    selectedDuration: Duration | null
    initialDiscountCode?: string | null
    /** the buyer's country; while it is unknown prices are before tax and no checkout can open */
    countryCode?: string
    /** the creator code applied before an upgrade of the tier, applied again to the upgraded checkout */
    initialCreatorCode?: string | null
    /** switches to a higher tier in place; the applied codes go along */
    onUpgradeTier?: (tier: PremiumTier, codes: CheckoutCodes) => void
    /** changes the wizard's billing period, e.g. to the yearly billing a code is limited to */
    onSelectDuration?: (duration: Duration) => void
}

const CHECKOUT_NOTE = 'Renews automatically until you cancel. Cancel any time on this page; Premium stays active until the end of the paid period.'

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
            {getTierIntro(tier) ? <p>{getTierIntro(tier)}:</p> : null}
            <ul>
                {getTierHighlights(tier).map(feature => (
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
    const playSubscriptionsEnabled = usePlaySubscriptionsEnabled()
    const variant = usePremiumVariant()
    const [creatorCode, setCreatorCode] = useState(props.initialCreatorCode ?? '')
    const [busyCheckout, setBusyCheckout] = useState<PaymentProvider | null>(null)
    const [codesOpen, setCodesOpen] = useState<boolean | null>(null)
    // back from the payment provider the cached page would still say "Redirecting…"
    useBackForwardRestore(() => setBusyCheckout(null))
    const tier = props.selectedTier
    const duration = props.selectedDuration || Duration.MONTHLY
    const buyerCountry = props.countryCode
    const billingWeeks = getBillingWeeks(props.selectedDuration)
    const productSlug = getTierApiProductId(tier, duration)
    const pricing = useSubscriptionPricing(productSlug, buyerCountry, props.initialCreatorCode)
    const offer = useCheckoutOffer(buyerCountry, productSlug)
    const discount = useDiscountCode(props.initialDiscountCode, {
        weeks: billingWeeks,
        validateInitial: true,
        autoCode: offer.promotion?.code,
        // the plan price before tax, after the creator code: the sale and a code from the link are weighed on this payment
        weighing: { promotion: offer.promotion, planPrice: getProviderPrice(pricing.pricingData, productSlug, 'lemonsqueezy'), providers: offer.providers },
        isSubscription: true,
        provider: offer.codeProvider
    })
    const { validated: validatedDiscount, pendingYearly: pendingYearlyDiscount, validating: isValidatingDiscount, error: discountError, code: discountCode } = discount
    const discountCodePercent = getPeriodPercent(validatedDiscount, billingWeeks)
    /** billed by us directly (Stripe/PayPal) in a country whose tax is known: the displayed price is exactly the charge, see getDirectPrice */
    const isDirect = isExactCharge(offer.providers, buyerCountry, offer.mode)
    /** Stripe Managed Payments bills it: the price shown is the net price, Stripe adds the tax */
    const isNet = isNetCharge(offer.providers, offer.mode)
    /** the country the price is taxed for: none for Managed Payments, which shows net prices */
    const taxCountry = isNet ? undefined : buyerCountry
    const { pricingData } = pricing
    /** a 13/52 week plan continues every 4 weeks after its first term at the 4-week plan's price, unless Lemon Squeezy alone is left */
    const continuesEvery4Weeks = isFourWeekContinuation(offer) && hasRenewalTerm(billingWeeks)
    // the price is named only once the offer is settled: its mode decides how the tax is added
    const fourWeekPrice = useRenewalPrice(continuesEvery4Weeks && !offer.loading ? getFourWeekProductSlug(tier) : null, buyerCountry, pricing.appliedCreatorCode)
    // every plan is its own order: the declaration starts unticked again for another plan
    const declaration = usePurchaseDeclaration(true, productSlug)
    const checkoutRequest = useCheckoutRequestId()
    // the refusal belongs to the plan it was given for
    const [refusal, setRefusal] = useState<{ productSlug: string; message: string } | null>(null)
    const declarationError = refusal?.productSlug === productSlug ? refusal.message : null

    // the next tier's quote with the same creator code, so its price is what its own checkout would charge
    const nextTier = getNextHigherTier(tier)
    const upgradeSlug = nextTier && !offer.loading ? getTierApiProductId(nextTier, duration) : null
    const upgradePlanPrice = useRenewalPrice(upgradeSlug, buyerCountry, pricing.appliedCreatorCode ?? (pricing.error ? null : (props.initialCreatorCode ?? null)))

    const money = (value: number): string => formatMoney(value, getProviderCurrencyCode(pricingData, productSlug, 'lemonsqueezy'))

    /** the plan price before tax, after the creator code (the quote has it in), the list price until a quote arrives */
    function getSubscriptionPrice(): number {
        return getProviderPrice(pricingData, productSlug, 'lemonsqueezy') ?? getFallbackSubscriptionPrice(getTierProductId(tier), duration)
    }

    /** the charged price after the discount code: exact for a direct checkout, otherwise the tax estimate rounded up */
    function getFinalPrice(basePrice: number, percent = discountCodePercent): number {
        if (isDirect || isNet) return getDirectPrice(basePrice, percent, taxCountry)
        return roundUpToCent(getPriceWithVAT(basePrice * (1 - percent / 100), buyerCountry))
    }

    function getOriginalPrice(): number | null {
        const price = getProviderOriginalPrice(pricingData, productSlug, 'lemonsqueezy')
        if (price === null) return null
        if (isDirect || isNet) return getDirectPrice(price, 0, taxCountry)
        return roundUpToCent(getPriceWithVAT(price, buyerCountry))
    }

    /** what the applied discount code saves on the next tier at this billing period, null when the line stays hidden */
    function getUpgradeSavings(): string | null {
        return describeUpgradeCodeSavings({
            planPrice: upgradePlanPrice,
            code: validatedDiscount?.code,
            discount: validatedDiscount,
            weeks: billingWeeks,
            providers: offer.providers,
            mode: offer.mode,
            countryCode: buyerCountry,
            promotion: offer.promotion,
            money
        })
    }

    /** the discount code the upgraded checkout starts with: the applied one, the one still being checked, '' once cleared, nothing otherwise */
    function getCarriedDiscountCode(): string | undefined {
        if (validatedDiscount?.code) return validatedDiscount.code
        if (isValidatingDiscount && discountCode.trim()) return discountCode.trim()
        if (discount.isTouched() || props.initialDiscountCode === '') return ''
        return undefined
    }

    /** what the next tier costs for this billing period, with the tax wording of the page; null until its quote is known */
    function getUpgradePrice(): string | null {
        if (upgradePlanPrice === null) return null
        // a 13/52 week plan of a direct provider continues every 4 weeks, so its price covers the first term only
        const period = continuesEvery4Weeks ? `for the first ${billingWeeks} weeks, then every ${RENEWAL_WEEKS} weeks` : undefined
        return `${money(getFinalPrice(upgradePlanPrice, 0))} ${getPriceUnit(period)}`
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
    function getPriceUnit(period = getPerPeriodLabel(billingWeeks)): string {
        const vat = getVatNote(buyerCountry, isDirect, isNet)
        if (!vat) return period
        return buyerCountry ? `${vat} ${period}` : `${period}, ${vat}`
    }

    /** the server refused the declaration: it is loaded again, unticked, and the next attempt gets a new request id */
    function onCheckoutFailed(data: unknown) {
        setBusyCheckout(null)
        if (!getDeclarationErrorSlug(data)) {
            toast.error(getCheckoutErrorMessage(data, playSubscriptionsEnabled))
            return
        }
        checkoutRequest.renew()
        setRefusal({ productSlug, message: getCheckoutErrorMessage(data) })
        void declaration.reload()
    }

    async function openCheckout(choice: PaymentProvider, googleToken: string) {
        const params = getCheckoutParams({
            provider: choice,
            country: buyerCountry,
            creatorCode: pricing.appliedCreatorCode,
            discountCode: validatedDiscount?.code,
            promotion: offer.promotion
        })
        try {
            const body = getSubscriptionDeclaration(declaration.declaration, declaration.confirmed, checkoutRequest.requestIdFor(productSlug, choice))
            const response = await postApiPremiumSubscriptionSubscriptionSlug(productSlug, body, params, { headers: { GoogleToken: googleToken } })
            const link = response.status === 200 ? getCheckoutLink(response.data) : null
            if (link) window.open(link, '_self')
            else onCheckoutFailed(response.data)
        } catch {
            onCheckoutFailed(null)
        }
    }

    /** opens an available payment option for the buyer's country */
    function onSubscribeClick(choice: PaymentProvider) {
        if (!buyerCountry || offer.loading || offer.unavailable || !declaration.confirmed) return
        const googleToken = sessionStorage.getItem('googleId')
        if (!googleToken) {
            toast.error('Please login to continue with the purchase')
            return
        }
        trackPremiumFunnelEvent('checkout started', variant, { product: productSlug, provider: 'subscription', paymentProvider: choice })
        setRefusal(null)
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

    /** the renewal's price with its tax note, null while the 4-week plan's price is not known (it is left out, not guessed) */
    function getRenewalLabel(): string | null {
        const renewal = getRenewalPrice(fourWeekPrice, validatedDiscount, taxCountry)
        if (renewal === null) return null
        const note = getVatNote(buyerCountry, isDirect, isNet)
        return note ? `${money(renewal)} ${note}` : money(renewal)
    }

    /** a 13/52 week plan: what the first term costs and that it then continues every 4 weeks until cancelled */
    function renderContinuationNote() {
        const firstOnly = discountCodePercent > 0 && isFirstPaymentOnly(validatedDiscount)
        const text = describeRenewal(billingWeeks, getRenewalLabel(), firstOnly)
        if (firstOnly) {
            return (
                <SummaryNote>
                    {money(getFinalPrice(getSubscriptionPrice()))} for the first {billingWeeks} weeks, {text}. {CANCEL_ANYTIME}.
                </SummaryNote>
            )
        }
        return (
            <SummaryNote>
                {text.charAt(0).toUpperCase() + text.slice(1)}. {CANCEL_ANYTIME}.
            </SummaryNote>
        )
    }

    /** a code for the first payment only: what the subscription renews at afterwards */
    function renderRenewalNote() {
        if (continuesEvery4Weeks) return renderContinuationNote()
        if (!discountCodePercent || !isFirstPaymentOnly(validatedDiscount)) return null
        const renewal = getFinalPrice(getSubscriptionPrice(), 0)
        return (
            <SummaryNote>
                The discount covers the {getFirstPeriodLabel(billingWeeks)}. Then {money(renewal)} {getPriceUnit()}.
            </SummaryNote>
        )
    }

    /** the same tax wording as the price: an exact direct charge includes VAT (or none is added, US), estimates say so */
    function renderTaxNote() {
        if (!buyerCountry) return <SummaryNote>Prices are before VAT until you choose your country. VAT is added where applicable.</SummaryNote>
        return <SummaryNote>{getTaxLabel(buyerCountry, isDirect, isNet)}.</SummaryNote>
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
                <SummaryRow label="Billing">{getBillingLabel(billingWeeks, isFourWeekContinuation(offer))}</SummaryRow>
                {discountInfo.creatorPercent ? <SummaryRow label="Creator code">-{discountInfo.creatorPercent}%</SummaryRow> : null}
                {discountInfo.discountCodePercent ? <SummaryRow label="Discount code">-{discountInfo.discountCodePercent}%</SummaryRow> : null}
                <SummaryTotal label="Price" amount={money(finalPrice)} original={showOriginal ? money(originalPrice!) : null} unit={getPriceUnit()}>
                    {renderSavings(discountInfo)}
                    {renderYearlySavings(hasCodeDiscount)}
                    {renderRenewalNote()}
                </SummaryTotal>
                {offer.promotion && validatedDiscount?.code === offer.promotion.code ? <PromotionNote promotion={offer.promotion} weeks={billingWeeks} /> : null}
                {pricing.error ? <CheckoutError>{pricing.error}</CheckoutError> : null}
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
                    {...getDiscountCodeAction(discount)}
                >
                    {renderDiscountCodeMessage()}
                    <LinkCodeReplacedNote replacement={discount.replacedLinkCode} promotion={offer.promotion} weeks={billingWeeks} />
                </CodeField>
            </CodeDisclosure>
        )
    }

    /** the early start declaration; the payment buttons stay disabled until it is ticked */
    function renderDeclaration() {
        return (
            <>
                {declarationError ? <CheckoutError>{declarationError}</CheckoutError> : null}
                <PurchaseDeclaration state={declaration} id="subscription-early-start-declaration" />
            </>
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
        // a discount code still being checked (e.g. the promotion standing in for the link's code) would be left out of the checkout
        const blocked = !declaration.confirmed || isValidatingDiscount
        if (offer.providers.length > 0)
            return <ProviderButtons tier={tier} providers={offer.providers} busyProvider={busyCheckout} disabled={blocked} onPay={onSubscribeClick} />
        return (
            <>
                <CheckoutButton
                    tier={tier}
                    busy={busyCheckout !== null}
                    busyLabel="Redirecting to payment provider..."
                    disabled={blocked}
                    onClick={() => onSubscribeClick('lemonsqueezy')}
                >
                    Continue to our secure payment processor
                </CheckoutButton>
                <LemonSqueezyShutdownNote />
            </>
        )
    }

    function renderActions() {
        if (offer.unavailable)
            return (
                <PaymentActions>
                    <CountrySelect />
                    <SubscriptionUnavailable countryCode={buyerCountry} />
                </PaymentActions>
            )
        return (
            <>
                {renderCodes()}
                {renderDeclaration()}
                <PaymentActions note={CHECKOUT_NOTE}>{renderPaymentButtons()}</PaymentActions>
            </>
        )
    }

    return (
        <CheckoutLayout summary={renderSummary()} actions={renderActions()}>
            <div className={discountStyles.featuresRow}>
                <TierFeatures tier={tier} />
                <TierUpsellPanel
                    currentTier={tier}
                    price={getUpgradePrice()}
                    codeSavings={getUpgradeSavings()}
                    onUpgrade={nextTier => props.onUpgradeTier?.(nextTier, { discountCode: getCarriedDiscountCode(), creatorCode: pricing.appliedCreatorCode })}
                />
            </div>
        </CheckoutLayout>
    )
}

export default BuySubscription
