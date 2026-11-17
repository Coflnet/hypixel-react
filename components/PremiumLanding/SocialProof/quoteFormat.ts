import type { CommunityQuote } from '../content/quotes'

// Pure helpers of the community quotes. The date is formatted from the string with a fixed English month table:
// no locale or timezone, so the server and the browser always render the same text.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** the author shown for quotes without a name */
export const ANONYMOUS_AUTHOR = 'SkyCofl user'

/** `2026-07-15` -> `15 Jul 2026`; anything else is shown as it is */
export function formatQuoteDate(isoDay: string): string {
    const match = ISO_DAY.exec(isoDay)
    if (!match) return isoDay
    const [, year, month, day] = match
    const monthName = MONTHS[Number(month) - 1]
    if (!monthName) return isoDay
    return `${Number(day)} ${monthName} ${year}`
}

export interface QuoteAuthor {
    name: string
    /** the avatar letter; undefined for a quote without a name (neutral avatar) */
    initial?: string
}

export function getQuoteAuthor(quote: CommunityQuote): QuoteAuthor {
    const name = quote.name?.trim()
    if (!name) return { name: ANONYMOUS_AUTHOR }
    return { name, initial: name.charAt(0).toUpperCase() }
}
