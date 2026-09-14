'use client'
import { useState } from 'react'
import { Alert, Badge, Button, Card, Modal } from 'react-bootstrap'
import { Check } from '@mui/icons-material'
import api from '../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { postApiPremiumSubscriptionSubscriptionSlug } from '../../../api/_generated/skyApi'
import type { PurchaseableProduct } from '../../../api/_generated/skyApi.schemas'
import { useCoflCoins } from '../../../utils/Hooks'
import type { SlotCatalog } from '../../../hooks/useSlotCatalog'
import Tooltip from '../../Tooltip/Tooltip'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import { Country } from '../../../utils/CountryUtils'
import CountrySelect from '../../CountrySelect/CountrySelect'
import BuyPremiumConfirmationDialog from '../BuyPremiumConfirmationDialog/BuyPremiumConfirmationDialog'
import styles from './SlotPurchase.module.css'
import { PremiumTier, PurchaseType, getTierDisplayName } from '../PremiumPurchaseWizard/types'

const isSubscription = (product: PurchaseableProduct) => product.slug?.startsWith('l_') === true
const duration = (product: PurchaseableProduct) => (product.ownershipSeconds === 2419200 ? '4 weeks' : `${(product.ownershipSeconds || 0) / 86400} days`)
const money = (amount: number, currency = 'EUR') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
const tierName = (product: PurchaseableProduct) => (product.slotTier === 'premium_plus' ? 'Premium+' : 'Premium')

interface Props {
    catalog: SlotCatalog
    tier: PremiumTier
    purchaseType: PurchaseType
    slotCount: number
    busy: boolean
    onBusyChange(busy: boolean): void
    onCountryChange(country: Country): void
}

export default function SlotPurchase({ catalog, tier, purchaseType, slotCount, busy, onBusyChange: setBusy, onCountryChange }: Props) {
    const { products, loading, catalogError, pricingError, canUsePrices, price, retry, taxLabel } = catalog
    const [selected, setSelected] = useState<PurchaseableProduct>()
    const [purchased, setPurchased] = useState<PurchaseableProduct>()
    const [error, setError] = useState('')
    const coflCoins = useCoflCoins()

    async function checkout(token?: string, declaration?: ServicePurchaseDeclaration) {
        if (!selected || busy) return
        const product = selected
        setBusy(true)
        setError('')
        try {
            if (isSubscription(product)) {
                const response = await postApiPremiumSubscriptionSubscriptionSlug(
                    product.slug!,
                    { assignSlots: true },
                    {
                        headers: { GoogleToken: sessionStorage.getItem('googleId') || '' }
                    }
                )
                if (response.status !== 200 || !response.data.directLink) throw new Error('Checkout could not be opened. Please try again.')
                window.open(response.data.directLink, '_self')
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
        }
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
    const selectedPrice = selected ? price(selected) : undefined
    const selectedPremiumType = selected ? PREMIUM_TYPES.find(type => type.productId === selected.slotTier)! : undefined

    return (
        <div>
            <div className={styles.intro}>
                <p>
                    {slotCount} {getTierDisplayName(tier)} {slotCount === 1 ? 'slot' : 'slots'} · Assign to friends after payment
                </p>
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
                        const provider = price(product)
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
                        return (
                            <Card key={product.slug} data-testid="slot-offer">
                                <Card.Body className={styles.offer}>
                                    <div className={styles.offerHeading}>
                                        <h4>{recurring ? 'Subscription' : 'CoflCoins · pay once'}</h4>
                                        {savings > 0 ? <Badge bg="success">Save {savings}%</Badge> : null}
                                    </div>
                                    <p>{slotCount === 4 ? '4 independently assignable slots' : '1 assignable slot'}</p>
                                    {recurring && slotCount === 1 ? <p>Same price as a normal subscription. Assign to yourself or a friend.</p> : null}
                                    <div className={styles.price}>
                                        {recurring
                                            ? priceReady
                                                ? money(amount!, provider?.currencyCode || 'EUR')
                                                : pricingError || canUsePrices
                                                  ? 'Price unavailable'
                                                  : 'Loading price…'
                                            : `${product.cost?.toLocaleString()} CoflCoins`}
                                    </div>
                                    <p className={styles.period}>
                                        {recurring ? `Every ${duration(product)} for ${slotCount === 1 ? 'this slot' : `all ${slotCount} slots`}` : `One payment · ${duration(product)} of access`}
                                    </p>
                                    {slotCount > 1 && (!recurring || priceReady) ? (
                                        <p className={styles.perSlot}>
                                            {recurring
                                                ? money(amount! / slotCount, provider?.currencyCode || 'EUR')
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
                        <strong>
                            {selectedPrice && money(selectedPrice.discountedPrice ?? selectedPrice.originalPrice, selectedPrice.currencyCode || 'EUR')}
                        </strong>{' '}
                        every {selected && duration(selected)} for {selected?.slotCount === 1 ? 'this slot' : 'the whole bundle'}.
                    </p>
                    <p>
                        This starts a new subscription for these slots. It renews automatically until canceled; cancellation keeps access through the paid
                        period.
                    </p>
                    <p>{taxLabel}. Checkout confirms the final price.</p>
                    <p>After payment, you’ll return to your account to assign the slots to your friends.</p>
                    <p>Cancel from Account → Purchased slots using <strong>{selected?.slotCount === 1 ? 'Cancel slot subscription' : `Cancel ${selected?.slotCount}-slot subscription`}</strong>. {selected?.slotCount === 1 ? 'Only this slot subscription will stop renewing.' : 'All slots in this subscription stop renewing together.'}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" disabled={busy} onClick={() => setSelected(undefined)}>
                        Back
                    </Button>
                    <Button variant="success" disabled={busy || !canUsePrices} onClick={() => void checkout()}>
                        {busy ? 'Opening checkout…' : 'Continue to checkout'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}
