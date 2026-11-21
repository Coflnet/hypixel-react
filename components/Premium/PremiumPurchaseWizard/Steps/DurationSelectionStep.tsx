'use client'
import OptionGroup, { StruckOriginal, WizardOption } from '../OptionGroup'
import { Duration, PurchaseType, PremiumTier, getDurationOptions } from '../types'
import { VAT_RATES, SUBSCRIPTION_PRICES } from '../../../../utils/PricingUtils'
import type { AutoDiscount } from '../../../../api/_generated/skyApi.schemas'
import { CheckoutOffer, useCheckoutOffer } from '../../../../hooks/useCheckoutOffer'
import {
    getBillingWeeks,
    describeRenewal,
    getDirectPrice,
    getEveryPeriodLabel,
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

/** CoflCoins durations are shown per month */
function getCoflCoinsMonthPrice(props: Props, duration: Duration, direct: boolean): number {
    return getPeriodTotal(getPlanPrice(props.selectedTier, duration), 0, props, direct) / getCoflCoinsMonths(props.selectedTier, duration)
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

/** how the subscription prices of the duration options are charged and which promotion they get */
interface SubscriptionBilling {
    /** exact (direct checkout) or net (Managed Payments): the amounts are the charge as the backend computes it */
    direct: boolean
    /** Managed Payments: the amounts are net, Stripe adds the tax */
    net: boolean
    /** a 13/52 week plan continues every 4 weeks after its first term (Stripe/PayPal, and until the offer settles) */
    continues: boolean
    /** the offer settled, so the renewal price may be named (its tax depends on the provider's mode) */
    settled: boolean
    promotion: AutoDiscount | null
}

/** an exact charge as it is; an estimate with "~" */
function formatCharge(value: number, direct: boolean): string {
    return direct ? euro(value, true) : `~${euro(value, false)}`
}

/** the 4-week price of the tier after the promotion's renewal percent, null while the offer is not settled (left out, not guessed) */
function getRenewalText(props: Props, { promotion, settled }: SubscriptionBilling): string | null {
    if (!settled) return null
    const renewal = getRenewalPrice(getPlanPrice(props.selectedTier, Duration.MONTHLY), promotion, props.countryCode)
    return renewal === null ? null : euro(renewal, true)
}

/** what the charge covers: Lemon Squeezy renews the same term, a card/PayPal plan its first term (a 4-week one simply repeats) */
function isFirstTerm(weeks: number, firstOnly: boolean, billing: SubscriptionBilling): boolean {
    return billing.continues && (hasRenewalTerm(weeks) || firstOnly)
}

/** e.g. "for the first 52 weeks, then €11.53 every 4 weeks" or "every 4 weeks (+VAT)" */
function getSubscriptionTerm(props: Props, weeks: number, firstOnly: boolean, billing: SubscriptionBilling): string {
    const vat = getVatText(props, billing.direct, billing.net)
    if (!isFirstTerm(weeks, firstOnly, billing)) return `${getEveryPeriodLabel(weeks)}${vat}`
    return `for the first ${weeks} weeks${vat}, ${describeRenewal(weeks, getRenewalText(props, billing), true)}`
}

/** the comparison price covers each term with Lemon Squeezy and the first term with 4-week continuation */
function getFourWeekShareUnit(weeks: number, continues: boolean): string {
    const unit = getPerPeriodLabel(4)
    if (!continues) return unit
    return `${unit} ${weeks === 52 ? 'in year 1' : `in the first ${weeks} weeks`}`
}

/** longer terms lead with the average per 4 weeks and show the charged total below */
function getSubscriptionPrices(props: Props, duration: Duration, billing: SubscriptionBilling): OptionPrices {
    const weeks = getBillingWeeks(duration)
    const plan = getPlanPrice(props.selectedTier, duration)
    const percent = getPeriodPercent(billing.promotion, weeks)
    const regular = getPeriodTotal(plan, 0, props, billing.direct)
    const total = getPeriodTotal(plan, percent, props, billing.direct)
    const discounted = percent > 0 && total < regular
    const firstOnly = discounted && isFirstPaymentOnly(billing.promotion)
    const price = formatCharge(total, billing.direct)
    const originalPrice = discounted ? formatCharge(regular, billing.direct) : undefined
    const discountBadge = discounted ? `-${percent}%` : undefined
    const term = getSubscriptionTerm(props, weeks, firstOnly, billing)
    if (!hasRenewalTerm(weeks)) return { price, originalPrice, discountBadge, unit: term }

    return {
        price: <span data-testid="four-week-share">≈ {euro(getPerFourWeeks(total, weeks), billing.direct)}</span>,
        originalPrice: discounted ? euro(getPerFourWeeks(regular, weeks), billing.direct) : undefined,
        discountBadge,
        unit: (
            <>
                {getFourWeekShareUnit(weeks, billing.continues)}
                <span className="visually-hidden">, charged </span>
                <span className={styles.subscriptionTotal} data-testid="subscription-total">
                    <strong>{price}</strong>
                    <StruckOriginal original={originalPrice} />
                </span>{' '}
                {term}
            </>
        )
    }
}

function getCoflCoinsUnit(props: Props, duration: Duration, direct: boolean): string {
    const vatSuffix = showsVatSuffix(props.countryCode, direct) ? ' (+VAT)' : ''
    const isStarterHalfYear = props.selectedTier === PremiumTier.STARTER && duration === Duration.QUARTER
    if (!isStarterHalfYear) return 'per month'
    const total = euro(getPeriodTotal(STARTER_HALF_YEAR_PRICE, 0, props, direct), direct)
    return `per month${vatSuffix} · ${total}${vatSuffix} total for 1,800 CoflCoins`
}

type OptionPrices = Pick<WizardOption<Duration>, 'price' | 'originalPrice' | 'discountBadge' | 'unit'>

/** subscriptions compare prices per 4 weeks, CoflCoins per month */
function getOptionPrices(props: Props, duration: Duration, offer: CheckoutOffer): OptionPrices {
    const net = isNetCharge(offer.providers, offer.mode)
    // exact or net: the page shows the charge as the backend computes it; Managed Payments shows net prices, so no VAT is added
    const direct = isExactCharge(offer.providers, props.countryCode, offer.mode) || net
    const taxProps = net ? { ...props, countryCode: undefined } : props
    if (!isSubscription(props)) return { price: `~${euro(getCoflCoinsMonthPrice(taxProps, duration, direct), direct)}`, unit: getCoflCoinsUnit(taxProps, duration, direct) }
    const billing = { direct, net, continues: isFourWeekContinuation(offer), settled: !offer.loading, promotion: offer.promotion }
    return getSubscriptionPrices(taxProps, duration, billing)
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
