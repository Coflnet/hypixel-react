import { notFound } from 'next/navigation'
import MarkdownIt from 'markdown-it'
import Link from 'next/link'
import { getApiDataUpdatesYearMonth } from '../../../../api/_generated/skyApi'
import styles from './page.module.css'
import { Container } from 'react-bootstrap'

const LAST_UPDATED_ISO = "2026-06-13"
const LAST_UPDATED_LABEL = "June 13, 2026"

export default async function UpdatesMonthPage(props: any) {
    const params = await props.params
    const year = Number(params.year)
    const month = Number(params.month)

    if (!year || !month) {
        notFound()
    }

    const res = await getApiDataUpdatesYearMonth(year, month)
    const messages = res?.data ?? []
    // only display messages that contain the ➡️ marker
    const displayMessages = messages.filter((m: any) => {
        const content = m.content || ''
        return content.includes('➡️')
    })

    const now = new Date()
    const isCurrent = now.getFullYear() === year && now.getMonth() + 1 === month

    // full month name for SEO and readability (e.g. "February")
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })

    function prevMonth(y: number, m: number) {
        let mm = m - 1
        let yy = y
        if (mm < 1) {
            mm = 12
            yy = y - 1
        }
        return { year: yy, month: mm }
    }

    function nextMonth(y: number, m: number) {
        let mm = m + 1
        let yy = y
        if (mm > 12) {
            mm = 1
            yy = y + 1
        }
        return { year: yy, month: mm }
    }

    const prev = prevMonth(year, month)
    const next = nextMonth(year, month)
    const minDate = new Date(2022, 0, 1) // Jan 2022 is the earliest month with prev disabled
    const prevDate = new Date(prev.year, prev.month - 1, 1)
    const showPrev = prevDate >= minDate

    const hasUpdates = !!(displayMessages && displayMessages.length > 0)

    // same month last year / next year for quick switching
    const lastYear = { year: year - 1, month }
    const nextYear = { year: year + 1, month }
    const lastYearDate = new Date(lastYear.year, lastYear.month - 1, 1)
    const nextYearDate = new Date(nextYear.year, nextYear.month - 1, 1)
    const showLastYear = lastYearDate >= minDate
    const showNextYear = nextYearDate <= new Date()

    function renderBreadcrumb() {
        return (
            <nav aria-label="breadcrumb" className={styles.breadcrumbNav}>
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                    <li className="breadcrumb-item"><Link href="/updates">Updates</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">{monthName} {year}</li>
                </ol>
            </nav>
        )
    }

    function renderYearSwitch() {
        return (
            <div className={styles.yearSwitch}>
                {showLastYear ? (
                    <Link href={`/updates/${lastYear.year}/${lastYear.month}`} className={styles.yearLink}>
                        ← {monthName} {lastYear.year}
                    </Link>
                ) : <div />}
                {showNextYear ? (
                    <Link href={`/updates/${nextYear.year}/${nextYear.month}`} className={styles.yearLink}>
                        {monthName} {nextYear.year} →
                    </Link>
                ) : <div />}
            </div>
        )
    }

    if (!hasUpdates) {
        return (
            <Container>
                <article>
                    {renderBreadcrumb()}
                    <div className={styles.topNav}>
                        {showPrev ? (
                            <Link className={styles.navLink} href={`/updates/${prev.year}/${prev.month}`}>
                                ← Prev
                            </Link>
                        ) : (
                            <div />
                        )}
                        <div className={styles.titleGroup}>
                            <h1 className={styles.title}>
                                Updates — {monthName} {year}
                            </h1>
                            <Link href="/updates" className={styles.archiveLink}>
                                All months
                            </Link>
                        </div>
                        {!isCurrent ? (
                            <Link className={styles.navLink} href={`/updates/${next.year}/${next.month}`}>
                                Next →
                            </Link>
                        ) : (
                            <div />
                        )}
                    </div>
                    <p className={styles.lastUpdated}>
                        Page last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                    </p>
                    {renderYearSwitch()}
                    <p>No updates for this month{isCurrent ? ' (yet)' : ''}.</p>
                    <div className={styles.bottomNav}>
                        {!isCurrent ? (
                            <Link className={styles.navLink} href={`/updates/${next.year}/${next.month}`}>
                                Next →
                            </Link>
                        ) : null}
                    </div>
                </article>
            </Container>
        )
    }

    const mdRenderer = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })

    return (
        <Container>
            <article>
                {renderBreadcrumb()}
                <div className={styles.topNav}>
                    {showPrev ? (
                        <Link className={styles.navLink} href={`/updates/${prev.year}/${prev.month}`}>
                            ← Prev
                        </Link>
                    ) : (
                        <div />
                    )}
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>
                            Updates — {monthName} {year}
                        </h1>
                        <Link href="/updates" className={styles.archiveLink}>
                            All months
                        </Link>
                    </div>
                    {!isCurrent ? (
                        <Link className={styles.navLink} href={`/updates/${next.year}/${next.month}`}>
                            Next →
                        </Link>
                    ) : (
                        <div />
                    )}
                </div>
                <p className={styles.lastUpdated}>
                    Page last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                </p>
                {renderYearSwitch()}

                <div className={styles.messages}>
                    {displayMessages.map((m: any) => {
                        const date = m.createdAt ? new Date(m.createdAt).toLocaleString() : ''
                        const author = m.authorName || 'Unknown'
                        const contentHtml = mdRenderer.render(m.content || '')
                        const attachments: string[] = m.attachments ? Object.values(m.attachments) : []

                        return (
                            <div className={styles.messageCard} key={m.messageId || Math.random()}>
                                <div className={styles.messageHeader}>
                                    <div className={styles.author}>{author}</div>
                                    <div className={styles.date}>{date}</div>
                                </div>
                                <div className={styles.messageContent} dangerouslySetInnerHTML={{ __html: contentHtml }} />
                                {attachments.length > 0 ? (
                                    <div className={styles.attachments}>
                                        {attachments.map((url, idx) => (
                                            <Link key={idx} href={url} target="_blank" rel="noreferrer" className="disableLinkStyle">
                                                <img
                                                    src={url}
                                                    className={styles.attachmentImg}
                                                    loading="lazy"
                                                    alt={`attachment-${idx}`}
                                                    style={{ color: 'white' }}
                                                />
                                            </Link>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>

                <div className={styles.bottomNav}>
                    {showPrev ? (
                        <Link className={styles.navLink} href={`/updates/${prev.year}/${prev.month}`}>
                            ← Prev
                        </Link>
                    ) : (
                        <div />
                    )}
                    {!isCurrent ? (
                        <Link className={styles.navLink} href={`/updates/${next.year}/${next.month}`}>
                            Next →
                        </Link>
                    ) : (
                        <div />
                    )}
                </div>
            </article>
        </Container>
    )
}

export async function generateMetadata(props: any) {
    const params = await props.params
    const year = Number(params.year)
    const month = Number(params.month)
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })
    const description =
        `Browse the SkyCofl dev-log for ${monthName} ${year}. See new features, bug fixes, pricing improvements, security patches, and community-requested changes released that month for the Hypixel SkyBlock price tracker, website, API, and in-game mod.`
    return {
        title: `SkyCofl Updates — ${monthName} ${year} | Dev-Log & Changelog`,
        description,
        keywords: [
            `skyblock updates ${monthName} ${year}`,
            `skycofl ${monthName} ${year}`,
            'dev-log',
            'changelog',
            'hypixel skyblock news',
            'feature releases',
            'bug fixes',
        ],
        openGraph: {
            title: `SkyCofl Updates — ${monthName} ${year}`,
            description,
        },
    }
}
