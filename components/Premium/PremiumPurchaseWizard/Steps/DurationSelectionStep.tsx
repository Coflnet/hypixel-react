'use client'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { Duration, PurchaseType, PremiumTier, getDurationOptions } from '../types'
import { VAT_RATES, SUBSCRIPTION_PRICES } from '../../../../utils/PricingUtils'

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

function shouldIncludeVATInPrice(countryCode?: string): boolean {
    if (!countryCode) return false
    const upperCode = countryCode.toUpperCase()
    return upperCode !== 'US' && VAT_RATES[upperCode] !== undefined
}

function roundUpToCent(value: number): number {
    return Math.ceil(value * 100) / 100
}

function euro(value: number): string {
    return `€${roundUpToCent(value).toFixed(2)}`
}

function getTierKey(tier: PremiumTier): string {
    if (tier === PremiumTier.PREMIUM) return 'premium'
    return tier === PremiumTier.STARTER ? 'starter_premium' : 'premium_plus'
}

/** the monthly equivalent of a duration, VAT included for the country */
function getMonthlyPrice(tier: PremiumTier, duration: Duration, countryCode?: string): number {
    const withVat = (price: number) => price * (1 + getVATRate(countryCode))
    const prices = SUBSCRIPTION_PRICES[getTierKey(tier)] || { monthly: 0, quarterly: 0, yearly: 0 }

    if (tier === PremiumTier.STARTER && duration === Duration.QUARTER) return withVat(STARTER_HALF_YEAR_PRICE) / 6
    if (duration === Duration.QUARTER) return withVat(prices.quarterly / 3)
    if (duration === Duration.YEARLY) return withVat(prices.yearly / 12)
    if (duration === Duration.WEEK && prices.weekly) return withVat(prices.weekly * (30 / 7))
    if (duration === Duration.DAY && prices.daily) return withVat(prices.daily * 30)
    return withVat(prices.monthly)
}

function getBadge(option: { badge?: string; value: Duration }): string | undefined {
    if (option.badge) return option.badge
    return option.value === Duration.YEARLY ? 'Best Value' : undefined
}

function getUnit(props: Props, duration: Duration): string {
    const vatSuffix = shouldIncludeVATInPrice(props.countryCode) ? '' : ' (+VAT)'
    const isStarterHalfYear = props.selectedType === PurchaseType.COFLCOINS && props.selectedTier === PremiumTier.STARTER && duration === Duration.QUARTER
    if (!isStarterHalfYear) return 'per month'
    const total = euro(STARTER_HALF_YEAR_PRICE * (1 + getVATRate(props.countryCode)))
    return `per month${vatSuffix} · ${total}${vatSuffix} total for 1,800 CoflCoins`
}

export default function DurationSelectionStep(props: Props) {
    const { selectedType, selectedTier, selectedDuration, onDurationSelect, countryCode } = props
    const options: WizardOption<Duration>[] = getDurationOptions(selectedTier, selectedType).map(option => ({
        value: option.value,
        title: option.label,
        description: option.desc,
        badge: getBadge(option),
        price: `~${euro(getMonthlyPrice(selectedTier, option.value, countryCode))}`,
        unit: getUnit(props, option.value)
    }))

    return <OptionGroup legend="Duration" options={options} selected={selectedDuration} onChoose={onDurationSelect} />
}
