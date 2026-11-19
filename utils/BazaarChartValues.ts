export const CHART_GAP = '-'

// 0 means "no orders / unknown", which ECharts renders as a gap when given '-'
export function toChartValue(value: number | undefined): string {
    return value && value > 0 ? value.toFixed(2) : CHART_GAP
}

export function isChartGap(value: unknown): boolean {
    return value === CHART_GAP || value === '' || value === undefined || value === null || !Number.isFinite(+(value as number))
}

// Wraps a tooltip formatter so gaps show as '-' instead of "0 Coins"
export function gapSafe(formatter: (value: unknown) => string): (value: unknown) => string {
    return value => (isChartGap(value) ? CHART_GAP : formatter(value))
}

function isPositive(value: number | undefined): value is number {
    return value !== undefined && value > 0
}

/**
 * Builds an [open, close, low, high] candle. ECharts skips the whole candle if any value is NaN,
 * so a missing low/high falls back to the candle body and a missing close to the open.
 * Only a missing open yields no candle.
 */
export function toCandle(open: number, close: number | undefined, min: number | undefined, max: number | undefined): string[] {
    if (!isPositive(open)) {
        return [CHART_GAP, CHART_GAP, CHART_GAP, CHART_GAP]
    }
    const end = isPositive(close) ? close : open
    const low = isPositive(min) ? min : Math.min(open, end)
    const high = isPositive(max) ? max : Math.max(open, end)
    return [open, end, low, high].map(toChartValue)
}
