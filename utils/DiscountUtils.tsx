/**
 * Centralized discount / promotional sale handling.
 *
 * The CoflCoins sale codes, their percentages and validity windows live here so
 * the start page banner and the CoflCoins shop stay in sync. Subscription sales
 * come from the backend's automatic promotion (GET /api/premium/discount/auto,
 * see useCheckoutOffer) and need no code.
 */

export type DiscountTarget = 'subscription' | 'coins'

export interface Discount {
    /** Stable identifier */
    id: string
    /** Short, human readable name, e.g. "Summer Sale" */
    label: string
    /** The code the user enters at checkout (or that is pre-filled via ?code=) */
    code: string
    /** Percentage off, e.g. 20 for 20% */
    percentage: number
    /** What the discount can be applied to */
    target: DiscountTarget
    /** The discount is active up to and including this moment */
    endsAt: Date
}

/** 10% off CoflCoins, until July 31st, code SUMMERCOINS. */
export const SUMMER_COINS_SALE: Discount = {
    id: 'summer-coins-2026',
    label: 'Summer CoflCoins Sale',
    code: 'SUMMERCOINS',
    percentage: 10,
    target: 'coins',
    endsAt: new Date('2026-07-31T23:59:59.000Z')
}

/** Every discount known to the frontend. */
export const ALL_DISCOUNTS: Discount[] = [SUMMER_COINS_SALE]

/** True while `now` is on or before the discount's end date. */
export function isDiscountActive(discount: Discount, now: Date = new Date()): boolean {
    return now.getTime() <= discount.endsAt.getTime()
}

/** The currently running CoflCoins discount, or null if none is active. */
export function getActiveCoinsDiscount(now: Date = new Date()): Discount | null {
    return isDiscountActive(SUMMER_COINS_SALE, now) ? SUMMER_COINS_SALE : null
}

/**
 * Format a discount end date for display, e.g. "August 8".
 * Formatted in UTC so the shown day matches the `...T23:59:59Z` end dates above
 * regardless of the viewer's (or server's) timezone.
 */
export function formatDiscountEndDate(date: Date): string {
    return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' })
}
