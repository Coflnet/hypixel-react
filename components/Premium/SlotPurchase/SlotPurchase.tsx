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
import { PromotionNote, ProviderButtons, Savings } from '../Checkout/CheckoutParts'
import BuyPremiumConfirmationDialog from '../BuyPremiumConfirmationDialog/BuyPremiumConfirmationDialog'
import styles from './SlotPurchase.module.css'
import { usePremiumVariant } from '../PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../../utils/PremiumTracking'
import { PremiumTier, PurchaseType, getTierDisplayName } from '../PremiumPurchaseWizard/types'
import {
    PaymentProvider,
    getCheckoutLink,
    getCheckoutParams,
    getFirstPeriodLabel,
    getPeriodPercent,
    isExactCharge,
    getWeeksOfSeconds,
    isFirstPaymentOnly
} from '../../../utils/SubscriptionCheckout'

const isSubscription = (product: PurchaseableProduct) => product.slug?.startsWith('l_') === true
const duration = (product: PurchaseableProduct) => (product.ownershipSeconds === 2419200 ? '4 weeks' : `${(product.ownershipSeconds || 0) / 86400} days`)
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
}

/** slot subscriptions renew every 4 weeks, so codes are checked for that billing period (yearly-only codes do not apply) */
const SLOT_BILLING_WEEKS = 4

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

/** the providers and promotion of the reviewed product, or of the whole country while none is reviewed */
function useSlotCheckoutOffer(countryCode: string | undefined, purchaseType: PurchaseType, selected?: PurchaseableProduct): CheckoutOffer {
    const recurring = purchaseType === PurchaseType.SUBSCRIPTION
    const reviewed = selected && isSubscription(selected) ? selected.slug! : undefined
    return useCheckoutOffer(recurring ? countryCode : undefined, reviewed)
}

export default function SlotPurchase({ catalog, tier, purchaseType, slotCount, initialDiscountCode, countryCode, busy, onBusyChange: setBusy, onCountryChange }: Props) {
    const variant = usePremiumVariant()
    const { products, loading, catalogError, pricingError, canUsePrices, price, priceWithCode, retry, taxLabel } = catalog
    const [selected, setSelected] = useState<PurchaseableProduct>()
    const [purchased, setPurchased] = useState<PurchaseableProduct>()
    const [busyProvider, setBusyProvider] = useState<PaymentProvider | null>(null)
    const [error, setError] = useState('')
    const coflCoins = useCoflCoins()
    const offer = useSlotCheckoutOffer(countryCode, purchaseType, selected)
    /** billed by us directly (Stripe/PayPal) in a country whose tax is known: the displayed price is exactly the charge */
    const direct = isExactCharge(offer.providers, countryCode)
    const discount = useDiscountCode(initialDiscountCode, {
        weeks: SLOT_BILLING_WEEKS,
        validateInitial: true,
        autoCode: offer.promotion?.code,
        isSubscription: purchaseType === PurchaseType.SUBSCRIPTION,
        provider: offer.codeProvider
    })

    /** the discount code's percent for a product's billing period */
    function codePercent(product: PurchaseableProduct) {
        return getPeriodPercent(discount.validated, getWeeksOfSeconds(product.ownershipSeconds))
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
        const response = await postApiPremiumSubscriptionSubscriptionSlug(product.slug!, params, {
            headers: { GoogleToken: sessionStorage.getItem('googleId') || '' }
        })
        const link = response.status === 200 ? getCheckoutLink(response.data) : null
        if (!link) throw new Error('Checkout could not be opened. Please try again.')
        window.open(link, '_self')
    }

    async function checkout(token?: string, declaration?: ServicePurchaseDeclaration, provider: PaymentProvider = 'lemonsqueezy') {
        if (!selected || busy) return
        const product = selected
        const recurring = isSubscription(product)
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
                await api.purchaseWithCoflcoins(product.slug!, token!, 1, declaration)
                document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: coflCoins - product.cost! } }))
                setPurchased(product)
            }
        } catch {
            setError('The purchase could not be completed. Check your account before trying again.')
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
        if (offer.providers.length === 0 || offer.loading)
            return (
                <Button variant="success" disabled={busy || !canUsePrices || offer.loading} onClick={() => void checkout()}>
                    {busy ? 'Opening checkout…' : offer.loading ? 'Loading payment options…' : 'Continue to checkout'}
                </Button>
            )
        return (
            <div className={styles.providers}>
                <ProviderButtons
                    tier={tier}
                    providers={offer.providers}
                    busyProvider={busyProvider}
                    disabled={busy || !canUsePrices}
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

    const offers = products.filter(
        product => product.slotCount === slotCount && product.slotTier === tier && isSubscription(product) === (purchaseType === PurchaseType.SUBSCRIPTION)
    )
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
                {showPromotion ? <PromotionNote promotion={offer.promotion!} weeks={SLOT_BILLING_WEEKS} /> : null}
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
                                                  : 'Loading price…'
                                            : `${product.cost?.toLocaleString()} CoflCoins`}
                                    </div>
                                    <p className={styles.period}>
                                        {recurring
                                            ? `${describeBilling(product, priceReady ? money(amount!, currency) : '', percent > 0 && firstPaymentOnly)} for ${slotCount === 1 ? 'this slot' : `all ${slotCount} slots`}`
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
                        {selected && selectedQuote && firstPaymentOnly && codePercent(selected) > 0
                            ? `for the ${getFirstPeriodLabel(getWeeksOfSeconds(selected.ownershipSeconds))}, then ${money(selectedQuote.renewal, selectedQuote.currency)} every ${duration(selected)}`
                            : `every ${selected ? duration(selected) : ''}`}{' '}
                        for {selected?.slotCount === 1 ? 'this slot' : 'the whole bundle'}.
                    </p>
                    {selectedQuote?.saved ? (
                        <Savings>
                            You save {money(selectedQuote.saved, selectedQuote.currency)} (~{selectedQuote.savedPercent}% off)
                        </Savings>
                    ) : null}
                    {showPromotion ? <PromotionNote promotion={offer.promotion!} weeks={SLOT_BILLING_WEEKS} /> : null}
                    {selected ? <SlotCodes catalog={catalog} discount={discount} creatorPercent={catalog.creatorPercent(selected)} weeks={SLOT_BILLING_WEEKS} /> : null}
                    <p>
                        This starts a new subscription for these slots. It renews automatically until canceled; cancellation keeps access through the paid
                        period.
                    </p>
                    <p>{taxLabel}. Checkout confirms the final price.</p>
                    <p>After payment, you’ll return to your account to assign the slots to your friends.</p>
                    <p>Cancel from Account → Purchased slots using <strong>{selected?.slotCount === 1 ? 'Cancel slot subscription' : `Cancel ${selected?.slotCount}-slot subscription`}</strong>. {selected?.slotCount === 1 ? 'Only this slot subscription will stop renewing.' : 'All slots in this subscription stop renewing together.'}</p>
                </Modal.Body>
                {renderFooter()}
            </Modal>
        </div>
    )
}
