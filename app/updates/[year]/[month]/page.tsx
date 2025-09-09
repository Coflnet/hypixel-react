import { notFound } from 'next/navigation'
import MarkdownIt from 'markdown-it'
import Link from 'next/link'
import { getApiDataUpdatesYearMonth } from '../../../../api/_generated/skyApi'

export default async function UpdatesMonthPage(props: any) {
    const params = await props.params
    const year = Number(params.year)
    const month = Number(params.month)

    if (!year || !month) {
        notFound()
    }

    const res = await getApiDataUpdatesYearMonth(year, month)
    const messages = res?.data ?? []

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

    const hasUpdates = !!(messages && messages.length > 0)

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

    // concatenate messages into a markdown document
    const md = messages
        .map(m => {
            const date = m.createdAt ? new Date(m.createdAt).toLocaleString() : ''
            const author = m.authorName || 'Unknown'
            const content = m.content || ''
            // attachments is an object mapping names to urls, or null
            let attachmentsMd = ''
            if (m.attachments) {
                try {
                    const urls = Object.values(m.attachments)
                    attachmentsMd = urls
                        .map(u => `![](${u})`)
                        .join('\n\n')
                } catch (e) {
                    attachmentsMd = ''
                }
            }
            return `### ${author} - ${date}\n\n${content}${attachmentsMd ? '\n\n' + attachmentsMd : ''}`
        })
        .join('\n\n---\n\n')

    const mdRenderer = new MarkdownIt({ html: true, linkify: true, typographer: true })
    const html = mdRenderer.render(md)

    return (
        <article>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {showPrev ? <Link href={`/updates/${prev.year}/${prev.month}`}>← Prev</Link> : <span />}
                <h1>Updates - {year}/{month}</h1>
                {!isCurrent ? <Link href={`/updates/${next.year}/${next.month}`}>Next →</Link> : <span />}
            </div>

            <div dangerouslySetInnerHTML={{ __html: html }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                {showPrev ? <Link href={`/updates/${prev.year}/${prev.month}`}>← Prev</Link> : <span />}
                {!isCurrent ? <Link href={`/updates/${next.year}/${next.month}`}>Next →</Link> : <span />}
            </div>
        </article>
    )
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
