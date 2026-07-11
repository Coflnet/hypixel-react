/**
 * Centralized discount / promotional sale handling.
 *
 * All active discount codes, their percentages, what they apply to and their
 * validity windows live here so the sales banner, the premium wizard, the
 * flip-list premium notes and the CoflCoins shop all stay in sync.
 *
 * To start, change or end a sale, edit the constants below - nothing else in
 * the UI hardcodes a code, percentage or end date.
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

/** 20% off any premium subscription, until August 8th, code SUMMER. */
export const SUMMER_SALE: Discount = {
    id: 'summer-sale-2026',
    label: 'Summer Sale',
    code: 'SUMMER',
    percentage: 20,
    target: 'subscription',
    endsAt: new Date('2026-08-08T23:59:59.000Z')
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
export const ALL_DISCOUNTS: Discount[] = [SUMMER_SALE, SUMMER_COINS_SALE]

/** True while `now` is on or before the discount's end date. */
export function isDiscountActive(discount: Discount, now: Date = new Date()): boolean {
    return now.getTime() <= discount.endsAt.getTime()
}

/** The currently running subscription discount, or null if none is active. */
export function getActiveSubscriptionDiscount(now: Date = new Date()): Discount | null {
    return isDiscountActive(SUMMER_SALE, now) ? SUMMER_SALE : null
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
