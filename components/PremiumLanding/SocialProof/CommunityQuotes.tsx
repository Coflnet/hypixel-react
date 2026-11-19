import { CommunityQuote } from '../content/quotes'
import { formatQuoteDate, getQuoteAuthor } from './quoteFormat'
import styles from './CommunityQuotes.module.css'

// Server component: plain markup, no client JS, no images, no network.

function NeutralAvatarIcon() {
    return (
        <svg className={styles.neutralIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3.5" />
            <path d="M3.5 17c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
        </svg>
    )
}

// The figcaption is the last child, as HTML requires; the grid shows it above the quote, next to the avatar.
function Quote({ quote }: { quote: CommunityQuote }) {
    const author = getQuoteAuthor(quote)
    return (
        <figure className={styles.quote}>
            <span className={styles.avatar} aria-hidden="true">
                {author.initial ?? <NeutralAvatarIcon />}
            </span>
            <blockquote className={styles.text}>{quote.text}</blockquote>
            <figcaption className={styles.caption}>
                <span className={styles.name}>{author.name}</span>
                <time className={styles.date} dateTime={quote.date}>
                    {formatQuoteDate(quote.date)}
                </time>
            </figcaption>
        </figure>
    )
}

/** real messages from the community chat, shown under the plan cards */
export default function CommunityQuotes({ quotes }: { quotes: CommunityQuote[] }) {
    if (quotes.length === 0) return null
    return (
        <div className={styles.strip} data-testid="community-quotes">
            <p className={styles.label}>FROM THE SKYCOFL COMMUNITY CHAT</p>
            <div className={styles.quotes}>
                {quotes.map(quote => (
                    <Quote key={`${quote.date}-${quote.name ?? ''}-${quote.text}`} quote={quote} />
                ))}
            </div>
        </div>
    )
}
