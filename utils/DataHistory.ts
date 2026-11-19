// How far back collected data reaches, so texts like "about 7 years of bazaar data" grow on their own.

/** Bazaar history starts here: data collection began in early November 2019 */
export const BAZAAR_HISTORY_START = Date.UTC(2019, 10, 1)

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

/** full years of bazaar history at `now` (7 from November 2026 on) */
export function getBazaarHistoryYears(now: number = Date.now()): number {
    return Math.floor((now - BAZAAR_HISTORY_START) / YEAR_MS)
}
