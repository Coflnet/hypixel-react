'use client'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { Duration, PurchaseType, PremiumTier, getDurationOptions } from '../types'
import { VAT_RATES, SUBSCRIPTION_PRICES } from '../../../../utils/PricingUtils'
import type { AutoDiscount } from '../../../../api/_generated/skyApi.schemas'
import { CheckoutOffer, useCheckoutOffer } from '../../../../hooks/useCheckoutOffer'
import {
    getBillingWeeks,
    describeRenewal,
    getDirectPrice,
    getEveryPeriodLabel,
    getFirstPeriodLabel,
    getRenewalPrice,
    getPerFourWeeks,
    getPerPeriodLabel,
    getPeriodPercent,
    getVatNote,
    hasRenewalTerm,
    isExactCharge,
    isFourWeekContinuation,
    isNetCharge,
    isFirstPaymentOnly,
    showsVatSuffix
} from '../../../../utils/SubscriptionCheckout'
import { PromotionNote } from '../../Checkout/CheckoutParts'
import styles from './Steps.module.css'

interface Props {
    selectedType: PurchaseType
    selectedTier: PremiumTier
    selectedDuration: Duration | null
    onDurationSelect: (duration: Duration, advance: boolean) => void
    countryCode?: string
}

/** CoflCoins price of the half-year Starter package, before VAT */
const STARTER_HALF_YEAR_PRICE = 9.69

function getVATRate(countryCode?: string): number {
    if (!countryCode) return 0
    return VAT_RATES[countryCode.toUpperCase()] ?? 0
}

/** direct checkouts show the exact charge; the Lemon Squeezy estimate is rounded up like before */
function euro(value: number, direct: boolean): string {
    return `€${(direct ? value : Math.ceil(value * 100) / 100).toFixed(2)}`
}

function getTierKey(tier: PremiumTier): string {
    if (tier === PremiumTier.PREMIUM) return 'premium'
    return tier === PremiumTier.STARTER ? 'starter_premium' : 'premium_plus'
}

function isSubscription(props: Props): boolean {
    return props.selectedType === PurchaseType.SUBSCRIPTION
}

function getPlanPrice(tier: PremiumTier, duration: Duration): number {
    const prices = SUBSCRIPTION_PRICES[getTierKey(tier)] || { monthly: 0, quarterly: 0, yearly: 0 }
    if (tier === PremiumTier.STARTER && duration === Duration.QUARTER) return STARTER_HALF_YEAR_PRICE
    if (duration === Duration.QUARTER) return prices.quarterly
    if (duration === Duration.YEARLY) return prices.yearly
    if (duration === Duration.WEEK && prices.weekly) return prices.weekly
    if (duration === Duration.DAY && prices.daily) return prices.daily
    return prices.monthly
}

/** CoflCoins durations are shown per month, as before */
function getCoflCoinsMonths(tier: PremiumTier, duration: Duration): number {
    const prices = SUBSCRIPTION_PRICES[getTierKey(tier)]
    if (tier === PremiumTier.STARTER && duration === Duration.QUARTER) return 6
    if (duration === Duration.QUARTER) return 3
    if (duration === Duration.YEARLY) return 12
    if (duration === Duration.WEEK && prices?.weekly) return 7 / 30
    if (duration === Duration.DAY && prices?.daily) return 1 / 30
    return 1
}

/** what a billing period costs for the country after `percent`: exactly the charge of a direct checkout, otherwise a VAT estimate */
function getPeriodTotal(price: number, percent: number, props: Props, direct: boolean): number {
    if (direct) return getDirectPrice(price, percent, props.countryCode)
    return price * (1 - percent / 100) * (1 + getVATRate(props.countryCode))
}

/** a subscription bills every 4, 13 or 52 weeks and is shown per 4 weeks, never per calendar month; CoflCoins per month */
function getUnitPrice(props: Props, duration: Duration, percent: number, direct: boolean): number {
    const total = getPeriodTotal(getPlanPrice(props.selectedTier, duration), percent, props, direct)
    if (isSubscription(props)) return getPerFourWeeks(total, getBillingWeeks(duration))
    return total / getCoflCoinsMonths(props.selectedTier, duration)
}

function getBadge(option: { badge?: string; value: Duration }): string | undefined {
    if (option.badge) return option.badge
    return option.value === Duration.YEARLY ? 'Best Value' : undefined
}

/** " (+VAT)" where checkout adds it, ", plus VAT where applicable" while the country is unknown */
function getVatText(props: Props, direct: boolean, net: boolean): string {
    const note = getVatNote(props.countryCode, direct, net)
    if (!note) return ''
    if (net) return ` ${note}`
    return props.countryCode ? ` ${note}` : `, ${note}`
}

interface PeriodPrice {
    /** the promotion's percent for this billing period, 0 without one */
    percent: number
    /** the promotion covers only the first payment */
    firstOnly: boolean
    /** the promotion, for the renewal it applies to */
    promotion?: AutoDiscount | null
    /** a 13/52 week plan continues every 4 weeks after its first term (Stripe/PayPal, and until the offer settles) */
    continues?: boolean
    /** Managed Payments: the amounts are net, Stripe adds the tax */
    net?: boolean
    /** the offer settled, so the renewal price may be named (its tax depends on the provider's mode) */
    settled?: boolean
}

/** the 4-week price of the tier after the promotion's renewal percent, "" while the offer is not settled (left out, not guessed) */
function getRenewalText(props: Props, { promotion, settled }: PeriodPrice): string {
    if (!settled) return ''
    const renewal = getRenewalPrice(getPlanPrice(props.selectedTier, Duration.MONTHLY), promotion, props.countryCode)
    return renewal === null ? '' : euro(renewal, true)
}

/**
 * e.g. "per 4 weeks · €96.69 every 52 weeks": the amount is per 4 weeks, the period total says what is billed;
 * a first-payment promotion says what it covers ("· €48.34 for the first year", "per 4 weeks, first 4 weeks")
 */
function getSubscriptionUnit(props: Props, duration: Duration, direct: boolean, periodPrice: PeriodPrice): string {
    const { percent, firstOnly } = periodPrice
    const weeks = getBillingWeeks(duration)
    const unit = `${getPerPeriodLabel(4)}${getVatText(props, direct, !!periodPrice.net)}`
    if (weeks === 4) return firstOnly ? `${unit}, ${getFirstPeriodLabel(weeks)}` : unit
    const total = euro(getPeriodTotal(getPlanPrice(props.selectedTier, duration), percent, props, direct), direct)
    if (periodPrice.continues && hasRenewalTerm(weeks)) {
        return `${unit} · ${total} for the ${getFirstPeriodLabel(weeks)}, ${describeRenewal(weeks, getRenewalText(props, periodPrice) || null, true)}`
    }
    return `${unit} · ${total} ${firstOnly ? `for the ${getFirstPeriodLabel(weeks)}` : getEveryPeriodLabel(weeks)}`
}

function getCoflCoinsUnit(props: Props, duration: Duration, direct: boolean): string {
    const vatSuffix = showsVatSuffix(props.countryCode, direct) ? ' (+VAT)' : ''
    const isStarterHalfYear = props.selectedTier === PremiumTier.STARTER && duration === Duration.QUARTER
    if (!isStarterHalfYear) return 'per month'
    const total = euro(getPeriodTotal(STARTER_HALF_YEAR_PRICE, 0, props, direct), direct)
    return `per month${vatSuffix} · ${total}${vatSuffix} total for 1,800 CoflCoins`
}

function getUnit(props: Props, duration: Duration, direct: boolean, periodPrice: PeriodPrice): string {
    if (isSubscription(props)) return getSubscriptionUnit(props, duration, direct, periodPrice)
    return getCoflCoinsUnit(props, duration, direct)
}

type OptionPrices = Pick<WizardOption<Duration>, 'price' | 'originalPrice' | 'discountBadge' | 'unit'>

/** the price per 4 weeks (CoflCoins: per month), struck through and discounted while a promotion covers the billing period */
function getOptionPrices(props: Props, duration: Duration, offer: CheckoutOffer): OptionPrices {
    const net = isNetCharge(offer.providers, offer.mode)
    // exact or net: the page shows the charge as the backend computes it; Managed Payments shows net prices, so no VAT is added
    const direct = isExactCharge(offer.providers, props.countryCode, offer.mode) || net
    const taxProps = net ? { ...props, countryCode: undefined } : props
    const continues = isFourWeekContinuation(offer)
    const state = { continues, net, settled: !offer.loading }
    const promotion = offer.promotion
    const percent = promotion ? getPeriodPercent(promotion, getBillingWeeks(duration)) : 0
    const regular = getUnitPrice(taxProps, duration, 0, direct)
    if (!promotion || !percent) return { price: `~${euro(regular, direct)}`, unit: getUnit(taxProps, duration, direct, { percent: 0, firstOnly: false, promotion, ...state }) }
    return {
        price: `~${euro(getUnitPrice(taxProps, duration, percent, direct), direct)}`,
        originalPrice: `~${euro(regular, direct)}`,
        discountBadge: `-${percent}%`,
        unit: getUnit(taxProps, duration, direct, { percent, firstOnly: isFirstPaymentOnly(promotion), promotion, ...state })
    }
}

/** the running promotion only applies to subscriptions paid with a provider that honours it */
function useDurationOffer(props: Props): CheckoutOffer {
    const isSubscription = props.selectedType === PurchaseType.SUBSCRIPTION
    return useCheckoutOffer(isSubscription ? props.countryCode : undefined)
}

export default function DurationSelectionStep(props: Props) {
    const { selectedType, selectedTier, selectedDuration, onDurationSelect } = props
    const offer = useDurationOffer(props)
    const promotion = offer.promotion
    const options: WizardOption<Duration>[] = getDurationOptions(selectedTier, selectedType, isFourWeekContinuation(offer)).map(option => ({
        value: option.value,
        title: option.label,
        description: option.desc,
        badge: getBadge(option),
        ...getOptionPrices(props, option.value, offer)
    }))

    return (
        <div className={styles.stepContent}>
            {promotion ? <PromotionNote promotion={promotion} /> : null}
            <OptionGroup legend="Duration" options={options} selected={selectedDuration} onChoose={onDurationSelect} />
        </div>
    )
}
