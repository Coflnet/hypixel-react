const OUTLIER_FACTOR = 8

function getPositivePrices(prices: number[]): number[] {
    return prices.filter(price => price > 0).sort((a, b) => a - b)
}

function getMedian(sortedPrices: number[]): number {
    return sortedPrices.length > 0 ? sortedPrices[Math.floor(sortedPrices.length / 2)] : 0
}

function isOutsideBand(price: number, median: number): boolean {
    if (!(price > 0) || !(median > 0)) {
        return false
    }
    return price > median * OUTLIER_FACTOR || price < median / OUTLIER_FACTOR
}

// min/max of 0 mean "unknown", so they stay 0 (rendered as a gap) instead of being clamped to a bogus value
function clampToBand(value: number, median: number): number {
    if (!(value > 0) || !(median > 0)) {
        return value
    }
    return Math.min(Math.max(value, median / OUTLIER_FACTOR), median * OUTLIER_FACTOR)
}

function clampPriceData(data: BazaarPriceData, median: number): BazaarPriceData {
    return { ...data, min: clampToBand(data.min, median), max: clampToBand(data.max, median) }
}

/**
 * Removes points whose positive buy or sell price is an outlier (further than 8x from the median).
 * A price (or min/max) of 0 means "no orders / unknown", never decides whether a point is dropped.
 * Positive min/max values of kept points are clamped into the accepted band for display.
 */
export function filterBazaarPriceOutliers(prices: BazaarPrice[]): BazaarPrice[] {
    const medianBuy = getMedian(getPositivePrices(prices.map(p => p.buyData.price)))
    const medianSell = getMedian(getPositivePrices(prices.map(p => p.sellData.price)))

    return prices
        .filter(p => !isOutsideBand(p.buyData.price, medianBuy) && !isOutsideBand(p.sellData.price, medianSell))
        .map(p => ({
            ...p,
            buyData: clampPriceData(p.buyData, medianBuy),
            sellData: clampPriceData(p.sellData, medianSell)
        }))
}
