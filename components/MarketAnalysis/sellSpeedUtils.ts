/**
 * Sold-analysis "sell speed" / live-analysis "time on market" buckets are classified relative to the
 * item's own reference average (the response's overall `avgSellTimeSeconds` for the sold block,
 * `avgTimeOnMarketSeconds` for the live block) rather than fixed absolute cutoffs. A fixed 1h/6h
 * cutoff made every bucket of a slow-moving, expensive item look "slow" (all red) and every bucket of
 * a fast bazaar-like item look "fast" (all green) regardless of how that bucket actually compares to
 * the item's own typical speed - these ratios fix the coloring to the item itself instead.
 *
 * Deliberately kept free of any import that (transitively) contains JSX (e.g. utils/Formatter.tsx):
 * cypress/e2e/market-analysis.cy.ts imports `getSellSpeedCategory` directly for pure-function
 * regression tests, and Cypress's default TS preprocessor cannot parse a `.tsx` file that still
 * contains real JSX once pulled into the spec bundle (tsconfig's `jsx: "preserve"` needs a further
 * JSX-aware transform Cypress's bundler doesn't apply here) - see marketAnalysisUtils.ts, which
 * re-exports everything here alongside the Formatter-dependent helpers the components use.
 */
export type SellSpeedCategory = 'fast' | 'medium' | 'slow'

/** A bucket faster than this fraction of the reference average counts as "fast". */
export const FAST_SPEED_RATIO = 0.75
/** A bucket slower than this multiple of the reference average counts as "slow" (in between is "medium"). */
export const SLOW_SPEED_RATIO = 1.5

/**
 * Classifies an average sell/time-on-market duration relative to `referenceSeconds` (the item's own
 * overall average). If the reference is missing, zero or not finite - nothing meaningful to compare
 * against - every bucket is classified "medium" rather than guessing.
 */
export function getSellSpeedCategory(avgSeconds: number, referenceSeconds: number): SellSpeedCategory {
    if (!Number.isFinite(referenceSeconds) || referenceSeconds <= 0) {
        return 'medium'
    }
    if (!Number.isFinite(avgSeconds) || avgSeconds < 0) {
        return 'medium'
    }
    if (avgSeconds < referenceSeconds * FAST_SPEED_RATIO) {
        return 'fast'
    }
    if (avgSeconds <= referenceSeconds * SLOW_SPEED_RATIO) {
        return 'medium'
    }
    return 'slow'
}

/**
 * The fast/slow boundary durations (in seconds) for `referenceSeconds`, for display in the legend -
 * e.g. "Fast (< 12h)" for a 16h reference. Undefined when the reference isn't usable (see
 * `getSellSpeedCategory`), since every bucket is "medium" and there's no meaningful boundary to show.
 */
export function getSellSpeedThresholds(referenceSeconds: number): { fastBoundSeconds: number; slowBoundSeconds: number } | undefined {
    if (!Number.isFinite(referenceSeconds) || referenceSeconds <= 0) {
        return undefined
    }
    return {
        fastBoundSeconds: referenceSeconds * FAST_SPEED_RATIO,
        slowBoundSeconds: referenceSeconds * SLOW_SPEED_RATIO
    }
}

/**
 * Humanizes a duration in seconds the way the Market analysis spec asks for: "12m", "8h 12m", "2d".
 * Always carries the unit in the text itself (never color-only), so it stands on its own in a tile.
 */
export function formatSellTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '—'
    }
    const totalMinutes = Math.round(seconds / 60)
    const days = Math.floor(totalMinutes / (60 * 24))
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
    const minutes = totalMinutes % 60

    if (days > 0) {
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`
    }
    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
    return `${minutes}m`
}

/**
 * Converts an hourly-breakdown UTC hour (0-23, as the backend sends it) to the viewer's local hour,
 * anchored to today's date so DST offsets resolve the same way a real "today at that UTC hour" would.
 */
export function utcHourToLocalHour(utcHour: number): number {
    const now = new Date()
    const asUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0))
    return asUtc.getHours()
}
