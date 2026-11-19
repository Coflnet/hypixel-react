// These are real, unedited messages from the SkyCofl community chat.
// Never add invented or edited quotes. Remove `name` when the author has not agreed to be named.
// Newest first.

export interface CommunityQuote {
    /** the author's chat name; leave it out when the author has not agreed to be named */
    name?: string
    /** day the message was sent, `YYYY-MM-DD` */
    date: string
    /** the message, exactly as sent */
    text: string
}

export const COMMUNITY_QUOTES: CommunityQuote[] = [
    { name: 'Mr_Fahad_09', date: '2026-07-15', text: 'prem+ best' },
    { name: 'strikeangles', date: '2025-02-16', text: 'prem+ is awesome' }
]
