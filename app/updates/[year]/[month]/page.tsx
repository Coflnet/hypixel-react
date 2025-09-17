import { notFound } from 'next/navigation'
import MarkdownIt from 'markdown-it'
import Link from 'next/link'
import { getApiDataUpdatesYearMonth } from '../../../../api/_generated/skyApi'
import styles from './page.module.css'
import { Container } from 'react-bootstrap'

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

    if (!hasUpdates) {
        return (
            <article>
                <h1>Updates - {year}/{month}</h1>
                <p>No updates for this month{isCurrent ? ' (yet)' : ''}.</p>
                <div style={{ marginTop: '12px' }}>
                    {/* For months without updates, only show forward navigation per spec (but not when current month) */}
                    {!isCurrent ? (
                        <Link href={`/updates/${next.year}/${next.month}`} style={{ marginRight: '8px' }}>
                            Next →
                        </Link>
                    ) : null}
                </div>
            </article>
        )
    }

    const mdRenderer = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })

    return <Container>
        <article>
            <div className={styles.topNav}>
                {showPrev ? <Link className={styles.navLink} href={`/updates/${prev.year}/${prev.month}`}>← Prev</Link> : <div />}
                <h1 className={styles.title}>Updates — {year}/{month}</h1>
                {!isCurrent ? <Link className={styles.navLink} href={`/updates/${next.year}/${next.month}`}>Next →</Link> : <div />}
            </div>

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
                                        <Link key={idx} href={url} target="_blank" rel="noreferrer" className='disableLinkStyle'>
                                            <img src={url} className={styles.attachmentImg} loading="lazy" alt={`attachment-${idx}`} style={{ color: "white" }} />
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )
                })}
            </div>

            <div className={styles.bottomNav}>
                {showPrev ? <Link className={styles.navLink} href={`/updates/${prev.year}/${prev.month}`}>← Prev</Link> : <div />}
                {!isCurrent ? <Link className={styles.navLink} href={`/updates/${next.year}/${next.month}`}>Next →</Link> : <div />}
            </div>
        </article>
    </Container>
}

export async function generateMetadata(props: any) {
    const params = await props.params
    const year = Number(params.year)
    const month = Number(params.month)
    return {
        title: `Updates ${year}/${month}`,
        description: `Dev-log updates for ${year}/${month}`
    }
}
