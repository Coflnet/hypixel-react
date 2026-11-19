'use client'
import { Button } from 'react-bootstrap'
import type { PurchaseableProduct, ValidatedDiscount } from '../../../api/_generated/skyApi.schemas'
import type { SlotCatalog } from '../../../hooks/useSlotCatalog'
import type { CheckoutOffer } from '../../../hooks/useCheckoutOffer'
import { SlotUpsell as Upsell, getSlotUpsells } from '../../../utils/SlotUpsell'
import { formatUpgradeSavings, getDiscountCodeFor, getEveryPeriodLabel, getWeeksOfSeconds, getPeriodPercent, hasRenewalTerm, isFirstPaymentOnly } from '../../../utils/SubscriptionCheckout'
import { getUpgradeHighlights } from '../../PremiumLanding/content/tierHighlights'
import { PremiumTier } from '../PremiumPurchaseWizard/types'
import { PLAN_CARDS } from '../../PremiumLanding/content/plans'
import discountStyles from '../../Discounts/Discounts.module.css'

interface Props {
    catalog: SlotCatalog
    tier: PremiumTier
    slotCount: number
    recurring: boolean
    /** the package offered now; the suggestions are for its billing period */
    current: PurchaseableProduct
    discount: ValidatedDiscount | null
    offer: CheckoutOffer
    /** how the catalog taxes a price, see SlotPurchase */
    direct: boolean | 'net'
    /** the tax wording of the offer cards, e.g. "Includes VAT" */
    taxLabel: string
    money(amount: number, currency?: string): string
    onChooseSlotCount(count: number): void
    onChooseTier(tier: PremiumTier): void
}

/** the tier's name on the /premium plan cards, e.g. "Premium+" */
const getTierName = (tier: PremiumTier) => PLAN_CARDS.find(card => card.tier === tier)?.title ?? tier

const slotsLabel = (count: number) => `${count} ${count === 1 ? 'slot' : 'slots'}`

/** whether the code's saving can be named for every provider the buyer may pay with: direct checkouts only, a code for all products */
function honoursCode(discount: ValidatedDiscount | null, offer: CheckoutOffer, direct: boolean | 'net'): discount is ValidatedDiscount {
    if (!discount?.code || discount.isLimitedToProducts || !direct || offer.providers.length === 0) return false
    return offer.providers.every(provider => getDiscountCodeFor(discount.code, offer.promotion, provider))
}

function SlotUpsellEntry({ upsell, ...props }: Props & { upsell: Upsell }) {
    const { catalog, tier, discount, offer, direct, money } = props
    const product = upsell.product
    const weeks = getWeeksOfSeconds(product.ownershipSeconds)
    const percent = props.recurring ? getPeriodPercent(discount, weeks) : 0
    const list = props.recurring ? catalog.priceWithCode(product, 0, direct) : undefined
    const final = props.recurring ? catalog.priceWithCode(product, percent, direct) : undefined
    const currency = catalog.price(product, direct)?.currencyCode || 'EUR'
    const count = product.slotCount || 1
    const target = upsell.kind === 'bundle' ? slotsLabel(count) : getTierName(product.slotTier as PremiumTier)
    // the plain prices (after a creator code): a code's saving is its own line, it may cover the first payment only
    const currentCost = props.recurring ? catalog.priceWithCode(props.current, 0, direct) : props.current.cost

    function describePrice(): string | null {
        if (!props.recurring) return product.cost ? `${product.cost.toLocaleString()} CoflCoins, one payment` : null
        if (list === undefined) return null
        const target = count === 1 ? 'this slot' : `all ${count} slots`
        const tax = direct === 'net' ? ' (+tax)' : ''
        // a 13/52 week bundle on a direct checkout continues every 4 weeks after its first term
        const term = direct && hasRenewalTerm(weeks) ? `for the first ${weeks} weeks` : getEveryPeriodLabel(weeks)
        return `${money(list, currency)}${tax} ${term} for ${target}`
    }

    function describeComparison(): string | null {
        if (upsell.kind !== 'bundle' || !currentCost) return null
        const cost = props.recurring ? list : product.cost
        if (!cost) return null
        const unit = (amount: number) => (props.recurring ? money(amount, currency) : amount.toLocaleString())
        return `${unit(cost / count)} per slot instead of ${unit(currentCost / props.slotCount)}`
    }

    function describeSavings(): string | null {
        if (!honoursCode(discount, offer, direct) || percent <= 0 || list === undefined || final === undefined || final >= list) return null
        return formatUpgradeSavings({ code: discount.code!, discounted: final, original: list, weeks, net: direct === 'net', firstOnly: isFirstPaymentOnly(discount), money: amount => money(amount, currency) })
    }

    const price = describePrice()
    const comparison = describeComparison()
    const savings = describeSavings()
    const bullets = upsell.kind === 'tier' ? getUpgradeHighlights(tier) : []
    return (
        <div data-testid="slot-upsell">
            <p className={discountStyles.upsellTier}>
                Step up to <strong>{target}</strong>
            </p>
            {/* with a code the savings line states the price; only the per-slot comparison stays */}
            {price && !savings ? <p>{comparison ? `${price} (${comparison})` : price}</p> : null}
            {price && savings && comparison ? <p>{direct === 'net' ? `${comparison} (+tax)` : comparison}</p> : null}
            {/* gross prices keep their VAT note, also when only the savings line states the price */}
            {price && props.recurring && direct !== 'net' ? <small>{props.taxLabel}</small> : null}
            {savings ? (
                <p className={discountStyles.upsellSavings} data-testid="slot-upsell-savings">
                    {savings}
                </p>
            ) : null}
            {bullets.length > 0 ? (
                <ul className={discountStyles.upsellFeatures}>
                    {bullets.map(feature => (
                        <li key={feature}>{feature}</li>
                    ))}
                </ul>
            ) : null}
            <Button variant="warning" size="sm" className={discountStyles.upsellButton} onClick={() => (upsell.kind === 'bundle' ? props.onChooseSlotCount(count) : props.onChooseTier(product.slotTier as PremiumTier))}>
                Upgrade to {target}
            </Button>
        </div>
    )
}

/** "What you could get" for the slot checkout: the bigger bundle and the higher slot tier the catalog sells, with their prices and the applied code's saving */
export default function SlotUpsell(props: Props) {
    const upsells = getSlotUpsells(props.catalog.products, props.tier, props.slotCount, props.recurring, props.current.ownershipSeconds)
    if (upsells.length === 0) return null
    return (
        <div className={discountStyles.upsellPanel} data-testid="slot-upsell-panel">
            <h6 className={discountStyles.upsellHeading}>⬆️ What you could get</h6>
            {upsells.map(upsell => (
                <SlotUpsellEntry key={upsell.product.slug} upsell={upsell} {...props} />
            ))}
        </div>
    )
}
