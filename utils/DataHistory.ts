// How far back collected data reaches, so texts like "about 6 years of bazaar data" grow on their own.

/** Bazaar history starts on 12 March 2020 */
export const BAZAAR_HISTORY_START = Date.UTC(2020, 2, 12)
/** The auction archive starts in early November 2019 */
export const AUCTION_HISTORY_START = Date.UTC(2019, 10, 1)

/** the first day of bazaar history as a date input value (yyyy-mm-dd), the earliest export start */
export const BAZAAR_HISTORY_MIN_DATE = new Date(BAZAAR_HISTORY_START).toISOString().slice(0, 10)

/** the day the bazaar history starts, for texts like "data since 12 March 2020" */
export const BAZAAR_HISTORY_SINCE = '12 March 2020'

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

function fullYearsSince(start: number, now: number): number {
    return Math.floor((now - start) / YEAR_MS)
}

/** full years of bazaar history at `now` (6 until March 2027) */
export function getBazaarHistoryYears(now: number = Date.now()): number {
    return fullYearsSince(BAZAAR_HISTORY_START, now)
}

/** full years of the auction archive at `now` (7 from November 2026) */
export function getAuctionHistoryYears(now: number = Date.now()): number {
    return fullYearsSince(AUCTION_HISTORY_START, now)
}
