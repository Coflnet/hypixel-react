'use client'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { Duration, PurchaseType, PremiumTier, getDurationOptions } from '../types'
import { VAT_RATES, SUBSCRIPTION_PRICES } from '../../../../utils/PricingUtils'
import { CheckoutOffer, useCheckoutOffer } from '../../../../hooks/useCheckoutOffer'
import { getBillingWeeks, getDirectPrice, getFirstPeriodLabel, getPeriodPercent, isExactCharge, isFirstPaymentOnly, showsVatSuffix } from '../../../../utils/SubscriptionCheckout'
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

interface BillingPeriod {
    /** the plan price of the period, before VAT */
    price: number
    months: number
}

function getBillingPeriod(tier: PremiumTier, duration: Duration): BillingPeriod {
    const prices = SUBSCRIPTION_PRICES[getTierKey(tier)] || { monthly: 0, quarterly: 0, yearly: 0 }
    if (tier === PremiumTier.STARTER && duration === Duration.QUARTER) return { price: STARTER_HALF_YEAR_PRICE, months: 6 }
    if (duration === Duration.QUARTER) return { price: prices.quarterly, months: 3 }
    if (duration === Duration.YEARLY) return { price: prices.yearly, months: 12 }
    if (duration === Duration.WEEK && prices.weekly) return { price: prices.weekly, months: 7 / 30 }
    if (duration === Duration.DAY && prices.daily) return { price: prices.daily, months: 1 / 30 }
    return { price: prices.monthly, months: 1 }
}

/** what a billing period costs for the country after `percent`: exactly the charge of a direct checkout, otherwise a VAT estimate */
function getPeriodTotal(price: number, percent: number, props: Props, direct: boolean): number {
    if (direct) return getDirectPrice(price, percent, props.countryCode)
    return price * (1 - percent / 100) * (1 + getVATRate(props.countryCode))
}

/** the monthly equivalent of a duration, VAT included for the country */
function getMonthlyPrice(props: Props, duration: Duration, percent: number, direct: boolean): number {
    const period = getBillingPeriod(props.selectedTier, duration)
    return getPeriodTotal(period.price, percent, props, direct) / period.months
}

function getBadge(option: { badge?: string; value: Duration }): string | undefined {
    if (option.badge) return option.badge
    return option.value === Duration.YEARLY ? 'Best Value' : undefined
}

function getUnit(props: Props, duration: Duration, direct: boolean): string {
    const vatSuffix = showsVatSuffix(props.countryCode, direct) ? ' (+VAT)' : ''
    const isStarterHalfYear = props.selectedType === PurchaseType.COFLCOINS && props.selectedTier === PremiumTier.STARTER && duration === Duration.QUARTER
    if (!isStarterHalfYear) return 'per month'
    const total = euro(getPeriodTotal(STARTER_HALF_YEAR_PRICE, 0, props, direct), direct)
    return `per month${vatSuffix} · ${total}${vatSuffix} total for 1,800 CoflCoins`
}

type OptionPrices = Pick<WizardOption<Duration>, 'price' | 'originalPrice' | 'discountBadge' | 'unit'>

/** the monthly equivalent, struck through and discounted while a promotion covers the billing period */
function getOptionPrices(props: Props, duration: Duration, offer: CheckoutOffer): OptionPrices {
    const direct = isExactCharge(offer.providers, props.countryCode)
    const promotion = offer.promotion
    const unit = getUnit(props, duration, direct)
    const weeks = getBillingWeeks(duration)
    const percent = getPeriodPercent(promotion, weeks)
    const monthly = getMonthlyPrice(props, duration, 0, direct)
    if (!promotion || !percent) return { price: `~${euro(monthly, direct)}`, unit }
    return {
        price: `~${euro(getMonthlyPrice(props, duration, percent, direct), direct)}`,
        originalPrice: `~${euro(monthly, direct)}`,
        discountBadge: `-${percent}%`,
        unit: isFirstPaymentOnly(promotion) ? `${unit}, ${getFirstPeriodLabel(weeks)}` : unit
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
    const options: WizardOption<Duration>[] = getDurationOptions(selectedTier, selectedType).map(option => ({
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
