import { PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { formatToPriceToShorten } from '../../utils/Formatter'

// The sell-speed classification, its ratio constants and the duration/hour formatters live in
// sellSpeedUtils.ts (kept free of any JSX-containing import so the cypress spec can import
// `getSellSpeedCategory` directly for pure-function tests - see that file's top comment) and are
// re-exported here so every other consumer keeps importing everything from this one module.
export { getSellSpeedCategory, getSellSpeedThresholds, formatSellTime, utcHourToLocalHour, FAST_SPEED_RATIO, SLOW_SPEED_RATIO } from './sellSpeedUtils'
export type { SellSpeedCategory } from './sellSpeedUtils'

/**
 * Short axis/label-friendly price, e.g. 1234567890 -> "1.2B". Values below 1000 render as a plain
 * whole number ("470", not "470.0") since a single decimal never carries any information for them
 * (formatToPriceToShorten always applies its `decimals` argument, even to the un-shortened range).
 */
export function formatShortPrice(value: number): string {
    if (Number.isFinite(value) && Math.abs(value) < 1000) {
        return Math.round(value).toString()
    }
    return formatToPriceToShorten(value, 1)
}

/** "1 auction" vs "2 auctions" - `plural` defaults to `${singular}s`. */
export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`
}

export interface MarketAnalysisDayOption {
    days: number
    label: string
    requiredRank?: PREMIUM_RANK
}

export const MARKET_ANALYSIS_DAY_OPTIONS: MarketAnalysisDayOption[] = [
    { days: 1, label: '1 day' },
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days', requiredRank: PREMIUM_RANK.STARTER },
    { days: 365, label: '1 year', requiredRank: PREMIUM_RANK.PREMIUM }
]

export const DEFAULT_MARKET_ANALYSIS_DAYS = 7

function premiumRankLabel(rank: PREMIUM_RANK): string {
    switch (rank) {
        case PREMIUM_RANK.STARTER:
            return 'Starter Premium'
        case PREMIUM_RANK.PREMIUM:
            return 'Premium'
        case PREMIUM_RANK.PREMIUM_PLUS:
            return 'Premium+'
        default:
            return 'Premium'
    }
}

export function getRequiredPremiumLabel(days: number): string {
    const option = MARKET_ANALYSIS_DAY_OPTIONS.find(o => o.days === days)
    return option?.requiredRank ? premiumRankLabel(option.requiredRank) : ''
}
