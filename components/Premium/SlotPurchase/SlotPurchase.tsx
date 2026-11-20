'use client'
import { useState } from 'react'
import { Alert, Badge, Button, Card, Modal } from 'react-bootstrap'
import { Check } from '@mui/icons-material'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { postApiPremiumSubscriptionSubscriptionSlug } from '../../../api/_generated/skyApi'
import type { PurchaseableProduct } from '../../../api/_generated/skyApi.schemas'
import { useCoflCoins } from '../../../utils/Hooks'
import useDiscountCode from '../../../hooks/useDiscountCode'
import type { SlotCatalog } from '../../../hooks/useSlotCatalog'
import { CheckoutOffer, useCheckoutOffer } from '../../../hooks/useCheckoutOffer'
import Tooltip from '../../Tooltip/Tooltip'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import { Country } from '../../../utils/CountryUtils'
import CountrySelect from '../../CountrySelect/CountrySelect'
import SlotCodes from './SlotCodes'
import SlotUpsell from './SlotUpsell'
import { LinkCodeReplacedNote, PromotionNote, ProviderButtons, Savings } from '../Checkout/CheckoutParts'
import BuyPremiumConfirmationDialog from '../BuyPremiumConfirmationDialog/BuyPremiumConfirmationDialog'
import styles from './SlotPurchase.module.css'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import { PremiumTier, PurchaseType, getTierDisplayName } from '../PremiumPurchaseWizard/types'
import {
    PaymentProvider,
    getCheckoutErrorMessage,
    getCheckoutLink,
    getCheckoutParams,
    CANCEL_ANYTIME,
    describeRenewal,
    findFourWeekSlotProduct,
    getDeclarationErrorSlug,
    getFirstPeriodLabel,
    hasRenewalTerm,
    getSubscriptionDeclaration,
    getTaxLabel,
    getPeriodPercent,
    isExactCharge,
    isFourWeekContinuation,
    isNetCharge,
    getWeeksOfSeconds,
    isFirstPaymentOnly
} from '../../../utils/SubscriptionCheckout'
import { usePurchaseDeclaration } from '../../../hooks/usePurchaseDeclaration'
import { useCheckoutRequestId } from '../../../hooks/useCheckoutRequestId'
import PurchaseDeclaration from '../PurchaseDeclaration/PurchaseDeclaration'

const isSubscription = (product: PurchaseableProduct) => product.slug?.startsWith('l_') === true
const WEEK_SECONDS = 7 * 24 * 3600
const duration = (product: PurchaseableProduct) => {
    const seconds = product.ownershipSeconds || 0
    return seconds % WEEK_SECONDS === 0 ? `${seconds / WEEK_SECONDS} weeks` : `${seconds / 86400} days`
}
const money = (amount: number, currency = 'EUR') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
const tierName = (product: PurchaseableProduct) => (product.slotTier === 'premium_plus' ? 'Premium+' : 'Premium')

interface Props {
    catalog: SlotCatalog
    tier: PremiumTier
    purchaseType: PurchaseType
    slotCount: number
    /** discount code to check and apply right away, e.g. from the page URL */
    initialDiscountCode?: string | null
    /** the buyer's country (the country select), for the payment providers and the promotion */
    countryCode?: string
    busy: boolean
    onBusyChange(busy: boolean): void
    onCountryChange(country: Country): void
    /** the upsell switches to a bigger bundle or a higher slot tier */
    onChooseSlotCount(count: number): void
    onChooseTier(tier: PremiumTier): void
}

/** the billing period of a bundle whose period is not known yet (no product of the package): the 4 weeks slot subscriptions have */
const DEFAULT_BILLING_WEEKS = 4

interface RecurringPriceProps {
    amount: number
    /** the price after the code */
    discounted: number
    currency: string
    /** the discount code's percent for this product's billing period */
    percent: number
}

/** a subscription price, struck through beside the discounted one while a code applies */
function RecurringPrice({ amount, discounted, currency, percent }: RecurringPriceProps) {
    if (!percent) return <>{money(amount, currency)}</>
    return (
        <>
            <s className={styles.original}>{money(amount, currency)}</s> {money(discounted, currency)}
        </>
    )
}

/** how often a subscription bills, e.g. "First 4 weeks, then €29.69 every 4 weeks" for a first payment discount */
function describeBilling(product: PurchaseableProduct, renewal: string, firstPaymentOnly: boolean): string {
    if (!firstPaymentOnly) return `Every ${duration(product)}`
    return `First ${duration(product)}, then ${renewal} every ${duration(product)}`
}

/** a failed subscription checkout; `declarationRefused` when the server refused the early start declaration */
class CheckoutFailure extends Error {
    constructor(
        message: string,
        readonly declarationRefused: boolean
    ) {
        super(message)
    }
}

function toCheckoutFailure(data: unknown): CheckoutFailure {
    return new CheckoutFailure(getCheckoutErrorMessage(data), !!getDeclarationErrorSlug(data))
}

/** the providers and promotion of the reviewed product, or of the whole country while none is reviewed */
function useSlotCheckoutOffer(countryCode: string | undefined, purchaseType: PurchaseType, selected?: PurchaseableProduct): CheckoutOffer {
    const recurring = purchaseType === PurchaseType.SUBSCRIPTION
    const reviewed = selected && isSubscription(selected) ? selected.slug! : undefined
    return useCheckoutOffer(recurring ? countryCode : undefined, reviewed)
}

export default function SlotPurchase({ catalog, tier, purchaseType, slotCount, initialDiscountCode, countryCode, busy, onBusyChange: setBusy, onCountryChange, onChooseSlotCount, onChooseTier }: Props) {
    const variant = usePremiumVariant()
    const { products, loading, catalogError, pricingError, canUsePrices, price, priceWithCode, retry } = catalog
    const [selected, setSelected] = useState<PurchaseableProduct>()
    const [purchased, setPurchased] = useState<PurchaseableProduct>()
    const [busyProvider, setBusyProvider] = useState<PaymentProvider | null>(null)
    const [error, setError] = useState('')
    const coflCoins = useCoflCoins()
    const offer = useSlotCheckoutOffer(countryCode, purchaseType, selected)
    const reviewsSubscription = !!selected && isSubscription(selected)
    // every opened review is a new order: the declaration starts unticked
    const declaration = usePurchaseDeclaration(reviewsSubscription, reviewsSubscription ? selected!.slug! : '')
    const checkoutRequest = useCheckoutRequestId()
    /** billed by us directly (Stripe/PayPal) in a country whose tax is known: the displayed price is exactly the charge */
    const exact = isExactCharge(offer.providers, countryCode, offer.mode)
    /** Stripe Managed Payments: net prices, Stripe adds the tax */
    const net = isNetCharge(offer.providers, offer.mode)
    /** how the catalog taxes a price: exactly like the direct checkout, net, or as an estimate */
    const direct: boolean | 'net' = net ? 'net' : exact
    const taxLabel = getTaxLabel(countryCode, exact, net)
    // codes are checked for the billing period of the reviewed bundle, the first one of the package before one is reviewed
    const offered = products.filter(product => product.slotCount === slotCount && product.slotTier === tier && isSubscription(product) === (purchaseType === PurchaseType.SUBSCRIPTION))
    const billingWeeks = getWeeksOfSeconds((selected ?? offered[0])?.ownershipSeconds || DEFAULT_BILLING_WEEKS * WEEK_SECONDS)
    const discount = useDiscountCode(initialDiscountCode, {
        weeks: billingWeeks,
        validateInitial: true,
        autoCode: offer.promotion?.code,
        weighing: { promotion: offer.promotion, planPrice: catalog.planPrice(selected ?? offered[0]), providers: offer.providers },
        isSubscription: purchaseType === PurchaseType.SUBSCRIPTION,
        provider: offer.codeProvider
    })

    /** the discount code's percent for a product's billing period */
    function codePercent(product: PurchaseableProduct) {
        return getPeriodPercent(discount.validated, getWeeksOfSeconds(product.ownershipSeconds))
    }

    /** a 13/52 week bundle paid with card or PayPal continues every 4 weeks after its first term */
    function continuesEvery4Weeks(product: PurchaseableProduct) {
        return isFourWeekContinuation(offer) && hasRenewalTerm(getWeeksOfSeconds(product.ownershipSeconds))
    }

    /** the renewal price of a long bundle, taken from its 4-week sibling; null without one (left out, not guessed) */
    function renewalLabel(product: PurchaseableProduct): string | null {
        const fourWeek = findFourWeekSlotProduct(products, product)
        if (!fourWeek || offer.loading) return null
        const renewal = catalog.renewalPrice(fourWeek, discount.validated, net)
        return renewal === undefined ? null : money(renewal, price(fourWeek, direct)?.currencyCode || 'EUR')
    }

    /** how long the shown price covers: the first term of a long bundle, the period of a 4-week one (then its renewal after a code) */
    function describeReviewTerm(product: PurchaseableProduct, quote: ReturnType<typeof quoteWithCodes>): string {
        if (continuesEvery4Weeks(product)) return `for the first ${duration(product)}`
        if (quote && firstPaymentOnly && codePercent(product) > 0) {
            return `for the ${getFirstPeriodLabel(getWeeksOfSeconds(product.ownershipSeconds))}, then ${money(quote.renewal, quote.currency)} every ${duration(product)}`
        }
        return `every ${duration(product)}`
    }

    /** e.g. "Then €9.69 every 4 weeks after the first 52 weeks, until cancelled", "Then €9.69 every 4 weeks" after a first-payment code */
    function describeContinuation(product: PurchaseableProduct): string {
        const coveredByCode = firstPaymentOnly && codePercent(product) > 0
        const text = describeRenewal(getWeeksOfSeconds(product.ownershipSeconds), renewalLabel(product), coveredByCode)
        return text.charAt(0).toUpperCase() + text.slice(1)
    }

    async function openSubscriptionCheckout(product: PurchaseableProduct, provider: PaymentProvider) {
        const params = getCheckoutParams({
            provider,
            country: countryCode,
            assignSlots: true,
            creatorCode: catalog.creatorCode,
            discountCode: discount.validated?.code,
            promotion: offer.promotion
        })
        const body = getSubscriptionDeclaration(declaration.declaration, declaration.confirmed, checkoutRequest.requestIdFor(product.slug!, provider))
        const response = await postApiPremiumSubscriptionSubscriptionSlug(product.slug!, body, params, {
            headers: { GoogleToken: sessionStorage.getItem('googleId') || '' }
        })
        const link = response.status === 200 ? getCheckoutLink(response.data) : null
        if (!link) throw toCheckoutFailure(response.data)
        window.open(link, '_self')
    }

    /** the declaration was refused: it is loaded again, unticked, and the next attempt gets a new request id */
    function onCheckoutFailed(failure: unknown) {
        if (!(failure instanceof CheckoutFailure) || !failure.declarationRefused) {
            setError('The purchase could not be completed. Check your account before trying again.')
            return
        }
        checkoutRequest.renew()
        setError(failure.message)
        void declaration.reload()
    }

    /** how an offer bills; a 13/52 week bundle says what it continues with after its first term */
    function describeOfferBilling(product: PurchaseableProduct, renewal: string, firstOnly: boolean): string {
        if (!continuesEvery4Weeks(product)) return describeBilling(product, renewal, firstOnly)
        return `First ${duration(product)}, ${describeRenewal(getWeeksOfSeconds(product.ownershipSeconds), renewalLabel(product), true)}${firstOnly ? '' : ' until cancelled'}`
    }

    async function checkout(token?: string, prepaidDeclaration?: ServicePurchaseDeclaration, provider: PaymentProvider = 'lemonsqueezy') {
        if (!selected || busy) return
        const product = selected
        const recurring = isSubscription(product)
        if (recurring && !declaration.confirmed) return
        setBusy(true)
        setBusyProvider(recurring ? provider : null)
        setError('')
        trackPremiumFunnelEvent('checkout started', variant, {
            product: product.slug,
            provider: recurring ? 'subscription' : 'coflcoins',
            paymentProvider: recurring ? provider : undefined
        })
        try {
            if (recurring) {
                await openSubscriptionCheckout(product, provider)
            } else {
                setSelected(undefined)
                await api.purchaseWithCoflcoins(product.slug!, token!, 1, prepaidDeclaration)
                document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: coflCoins - product.cost! } }))
                setPurchased(product)
            }
        } catch (failure) {
            onCheckoutFailed(failure)
        } finally {
            setBusy(false)
            setBusyProvider(null)
        }
    }

    function quoteWithCodes(product: PurchaseableProduct, discountPercent: number) {
        const provider = price(product, direct)
        const final = priceWithCode(product, discountPercent, direct)
        if (!provider || final === undefined) return undefined
        // the provider's discounted price already includes the creator code
        const current = provider.discountedPrice ?? provider.originalPrice
        const saved = Math.max(0, Math.round((provider.originalPrice - final) * 100) / 100)
        const savedPercent = saved ? Math.round((saved / provider.originalPrice) * 100) : 0
        return { final, original: provider.originalPrice, renewal: current, saved, savedPercent, currency: provider.currencyCode || 'EUR' }
    }

    /** card and PayPal while the direct providers are on, otherwise the single Lemon Squeezy button */
    function renderPaymentButtons() {
        // a discount code still being checked would be left out of the checkout
        const blocked = busy || !canUsePrices || !declaration.confirmed || discount.validating
        if (offer.providers.length === 0 || offer.loading)
            return (
                <Button variant="success" disabled={blocked || offer.loading} onClick={() => void checkout()}>
                    {busy ? 'Opening checkout…' : offer.loading ? 'Loading payment options…' : 'Continue to checkout'}
                </Button>
            )
        return (
            <div className={styles.providers}>
                <ProviderButtons
                    tier={tier}
                    providers={offer.providers}
                    busyProvider={busyProvider}
                    disabled={blocked}
                    onPay={provider => void checkout(undefined, undefined, provider)}
                />
            </div>
        )
    }

    /** the single checkout button beside Back; the provider buttons stacked full width with Back under them, like the wizard */
    function renderFooter() {
        const back = (
            <Button variant="secondary" className={styles.back} disabled={busy} onClick={() => setSelected(undefined)}>
                Back
            </Button>
        )
        const stacked = offer.providers.length > 0 && !offer.loading
        return (
            <Modal.Footer className={stacked ? styles.providerFooter : undefined}>
                {stacked ? null : back}
                {renderPaymentButtons()}
                {stacked ? back : null}
            </Modal.Footer>
        )
    }

    if (purchased)
        return (
            <div className={styles.success} role="status">
                <Check className={styles.successIcon} />
                <h4>Your {purchased.slotCount === 1 ? 'slot is' : `${purchased.slotCount} slots are`} ready</h4>
                <p>
                    Choose who gets {tierName(purchased)} for the next {duration(purchased)}. Assign each slot to a friend from your account.
                </p>
                <Button as="a" href="/account#purchased-slots" variant="success">
                    Assign your {purchased.slotCount === 1 ? 'slot' : 'slots'}
                </Button>
            </div>
        )

    const offers = offered
    const hasSubscriptions = offers.some(isSubscription)
    const selectedQuote = selected ? quoteWithCodes(selected, codePercent(selected)) : undefined
    const firstPaymentOnly = isFirstPaymentOnly(discount.validated)
    const showPromotion = !!offer.promotion && discount.validated?.code === offer.promotion.code
    const selectedPremiumType = selected ? PREMIUM_TYPES.find(type => type.productId === selected.slotTier)! : undefined

    return (
        <div>
            <div className={styles.intro}>
                <p>
                    {slotCount} {getTierDisplayName(tier)} {slotCount === 1 ? 'slot' : 'slots'} · Assign to friends after payment
                </p>
                {showPromotion ? <PromotionNote promotion={offer.promotion!} weeks={billingWeeks} /> : null}
                <LinkCodeReplacedNote replacement={discount.replacedLinkCode} promotion={offer.promotion} weeks={billingWeeks} />
            </div>
            {loading ? <p role="status">Loading slot options…</p> : null}
            {catalogError || (hasSubscriptions && pricingError) ? (
                <Alert variant="warning">
                    Could not load {catalogError ? 'slot options' : 'subscription prices'}.{' '}
                    <Button size="sm" variant="secondary" onClick={retry}>
                        Try again
                    </Button>
                </Alert>
            ) : null}
            {error ? (
                <Alert variant="danger" role="alert">
                    {error}
                </Alert>
            ) : null}
            {!loading && !catalogError && offers.length === 0 ? (
                <Alert variant="warning">
                    This package is currently unavailable with the selected payment method. Go back to change your selection, or{' '}
                    <Button size="sm" variant="secondary" onClick={retry}>
                        Try again
                    </Button>
                    .
                </Alert>
            ) : null}
            {hasSubscriptions ? (
                <div className={styles.country}>
                    <CountrySelect onCountryChange={onCountryChange} />
                </div>
            ) : null}
            {/* the review dialog has its own copy; two would keep separate input state */}
            {hasSubscriptions && !loading && !catalogError && offers.length > 0 && !reviewsSubscription ? (
                <div className={styles.country}>
                    <SlotCodes catalog={catalog} discount={discount} creatorPercent={catalog.creatorPercent(offers[0])} weeks={billingWeeks} />
                </div>
            ) : null}
            {offers.some(product => !isSubscription(product)) ? (
                <p className={styles.balance}>Your balance: {coflCoins < 0 ? 'unavailable' : `${coflCoins.toLocaleString()} CoflCoins`}</p>
            ) : null}
            {!loading && !catalogError ? (
                <div className={styles.grid}>
                    {offers.map(product => {
                        const recurring = isSubscription(product)
                        const provider = price(product, direct)
                        const amount = provider?.discountedPrice ?? provider?.originalPrice
                        const priceReady = canUsePrices && amount !== undefined && Number.isFinite(amount) && amount > 0
                        const enoughCoins = coflCoins >= (product.cost ?? Infinity)
                        const single = products.find(
                            other =>
                                !isSubscription(other) &&
                                other.slotCount === 1 &&
                                other.slotTier === product.slotTier &&
                                other.ownershipSeconds === product.ownershipSeconds
                        )
                        const savings = !recurring && single?.cost && product.cost ? Math.round(100 * (1 - product.cost / (single.cost * slotCount))) : 0
                        const percent = recurring && priceReady ? codePercent(product) : 0
                        const currency = provider?.currencyCode || 'EUR'
                        return (
                            <Card key={product.slug} data-testid="slot-offer">
                                <Card.Body className={styles.offer}>
                                    <div className={styles.offerHeading}>
                                        <h4>{recurring ? 'Subscription' : 'CoflCoins · pay once'}</h4>
                                        {savings > 0 ? <Badge bg="success">Save {savings}%</Badge> : null}
                                        {percent > 0 ? <Badge bg="danger">-{percent}%</Badge> : null}
                                    </div>
                                    <p>{slotCount === 4 ? '4 independently assignable slots' : '1 assignable slot'}</p>
                                    {recurring && slotCount === 1 ? <p>Same price as a normal subscription. Assign to yourself or a friend.</p> : null}
                                    <div className={styles.price}>
                                        {recurring
                                            ? priceReady
                                                ? <RecurringPrice amount={amount!} discounted={priceWithCode(product, percent, direct)!} currency={currency} percent={percent} />
                                                : pricingError || canUsePrices
                                                  ? 'Price unavailable'
                                                  : countryCode
                                                    ? 'Loading price…'
                                                    : 'Choose your country to see the price'
                                            : `${product.cost?.toLocaleString()} CoflCoins`}
                                    </div>
                                    <p className={styles.period}>
                                        {recurring
                                            ? `${describeOfferBilling(product, priceReady ? money(amount!, currency) : '', percent > 0 && firstPaymentOnly)} for ${slotCount === 1 ? 'this slot' : `all ${slotCount} slots`}`
                                            : `One payment · ${duration(product)} of access`}
                                    </p>
                                    {slotCount > 1 && (!recurring || priceReady) ? (
                                        <p className={styles.perSlot}>
                                            {recurring
                                                ? money(priceWithCode(product, percent, direct)! / slotCount, currency)
                                                : `${((product.cost || 0) / slotCount).toLocaleString()} CoflCoins`}{' '}
                                            per slot
                                        </p>
                                    ) : null}
                                    {recurring ? (
                                        <>
                                            <small>{taxLabel}</small>
                                            <Tooltip
                                                type="hover"
                                                content={<p tabIndex={0}>Renews automatically. Cancel anytime.</p>}
                                                tooltipContent={<>Cancel from your account page. Your service continues until the end of the time you have already paid for.</>}
                                            />
                                        </>
                                    ) : <p>One-time payment. Does not renew.</p>}
                                    <Button
                                        variant={product.slotTier === 'premium_plus' ? 'success' : 'primary'}
                                        disabled={busy || (recurring ? !priceReady : coflCoins < 0 || !product.cost)}
                                        onClick={() => {
                                            if (!recurring && !enoughCoins) {
                                                document.getElementById('coflcoins-purchase')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                return
                                            }
                                            setError('')
                                            setSelected(product)
                                        }}
                                    >
                                        {busy
                                            ? 'Please wait…'
                                            : !recurring && !enoughCoins
                                              ? 'Top up CoflCoins'
                                              : recurring
                                                ? 'Continue with subscription'
                                                : 'Buy with CoflCoins'}
                                    </Button>
                                    {!recurring && coflCoins >= 0 && !enoughCoins ? (
                                        <small>Add {((product.cost || 0) - coflCoins).toLocaleString()} CoflCoins to buy this package.</small>
                                    ) : null}
                                </Card.Body>
                            </Card>
                        )
                    })}
                </div>
            ) : null}
            {!loading && !catalogError && offers.length > 0 ? (
                <SlotUpsell
                    catalog={catalog}
                    tier={tier}
                    slotCount={slotCount}
                    recurring={purchaseType === PurchaseType.SUBSCRIPTION}
                    current={offers[0]}
                    discount={discount.validated}
                    offer={offer}
                    direct={direct}
                    money={money}
                    taxLabel={taxLabel}
                    onChooseSlotCount={onChooseSlotCount}
                    onChooseTier={onChooseTier}
                />
            ) : null}
            <p className={styles.afterPurchase}>
                {hasSubscriptions ? 'Checkout confirms the final subscription price and taxes. ' : ''}
                After payment, assign slots to your friends by email or Minecraft name in <a href="/account#purchased-slots">Account → Purchased slots</a>. You
                can reassign them later.
                {hasSubscriptions ? <> To stop renewal, choose <strong>{slotCount === 1 ? 'Cancel slot subscription' : `Cancel ${slotCount}-slot subscription`}</strong> beside your slot. Releasing an assignment keeps billing active.</> : null}
            </p>
            {selected && !isSubscription(selected) ? (
                <BuyPremiumConfirmationDialog
                    type="prepaid"
                    show
                    slotCount={selected.slotCount}
                    purchasePremiumType={{
                        ...selectedPremiumType!,
                        label: `${selected.slotCount} ${tierName(selected)} ${selected.slotCount === 1 ? 'slot' : 'slots'}`
                    }}
                    purchasePremiumOption={{ value: 1, productId: selected.slug!, label: duration(selected), price: selected.cost! }}
                    durationString={<></>}
                    purchasePrice={`${selected.cost?.toLocaleString()} CoflCoins`}
                    onHide={() => setSelected(undefined)}
                    onConfirm={checkout}
                />
            ) : null}
            <Modal
                show={!!selected && isSubscription(selected)}
                onHide={() => {
                    if (!busy) setSelected(undefined)
                }}
                centered
            >
                <Modal.Header closeButton={!busy}>
                    <Modal.Title>Review your slot subscription</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error ? <Alert variant="danger">{error}</Alert> : null}
                    <h5>
                        {selected?.slotCount} {selected && tierName(selected)} {selected?.slotCount === 1 ? 'slot' : 'slots'}
                    </h5>
                    <p>
                        <strong>{selectedQuote ? money(selectedQuote.final, selectedQuote.currency) : '…'}</strong>
                        {selectedQuote?.saved ? (
                            <>
                                {' '}
                                <s>{money(selectedQuote.original, selectedQuote.currency)}</s>
                            </>
                        ) : null}{' '}
                        {selected ? describeReviewTerm(selected, selectedQuote) : ''} for {selected?.slotCount === 1 ? 'this slot' : 'the whole bundle'}.
                        {selected && continuesEvery4Weeks(selected) ? ` ${describeContinuation(selected)}. ${CANCEL_ANYTIME}.` : null}
                    </p>
                    {selectedQuote?.saved ? (
                        <Savings>
                            You save {money(selectedQuote.saved, selectedQuote.currency)} (~{selectedQuote.savedPercent}% off)
                        </Savings>
                    ) : null}
                    {showPromotion ? <PromotionNote promotion={offer.promotion!} weeks={billingWeeks} /> : null}
                    {selected ? <SlotCodes catalog={catalog} discount={discount} creatorPercent={catalog.creatorPercent(selected)} weeks={billingWeeks} /> : null}
                    <p>
                        This starts a new subscription for these slots. It renews automatically until canceled; cancellation keeps access through the paid
                        period.
                    </p>
                    <p>{taxLabel}. Checkout confirms the final price.</p>
                    <p>After payment, you’ll return to your account to assign the slots to your friends.</p>
                    <p>Cancel from Account → Purchased slots using <strong>{selected?.slotCount === 1 ? 'Cancel slot subscription' : `Cancel ${selected?.slotCount}-slot subscription`}</strong>. {selected?.slotCount === 1 ? 'Only this slot subscription will stop renewing.' : 'All slots in this subscription stop renewing together.'}</p>
                    <PurchaseDeclaration state={declaration} id="slot-subscription-early-start-declaration" />
                </Modal.Body>
                {renderFooter()}
            </Modal>
        </div>
    )
}
