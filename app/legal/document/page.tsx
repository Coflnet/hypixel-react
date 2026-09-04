import { createHash } from 'crypto'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

const LEGAL_ORIGIN = 'https://coflnet.com'
const VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type DiffBlock = {
    kind: 'added' | 'removed' | 'unchanged'
    value: string
}

function markdownBlocks(source: string) {
    return source
        .replace(/^\s*<a id="[a-z0-9-]+"><\/a>\s*$/gim, '')
        .trim()
        .split(/\n{2,}/)
}

function diffBlocks(previous: string, current: string): DiffBlock[] {
    const before = markdownBlocks(previous)
    const after = markdownBlocks(current)
    const lengths = Array.from({ length: before.length + 1 }, () => new Uint16Array(after.length + 1))

    for (let left = before.length - 1; left >= 0; left--)
        for (let right = after.length - 1; right >= 0; right--)
            lengths[left][right] =
                before[left] === after[right] ? lengths[left + 1][right + 1] + 1 : Math.max(lengths[left + 1][right], lengths[left][right + 1])

    const result: DiffBlock[] = []
    let left = 0
    let right = 0
    while (left < before.length || right < after.length) {
        if (left < before.length && right < after.length && before[left] === after[right]) {
            result.push({ kind: 'unchanged', value: before[left] })
            left++
            right++
        } else if (right === after.length || (left < before.length && lengths[left + 1][right] >= lengths[left][right + 1])) {
            result.push({ kind: 'removed', value: before[left++] })
        } else {
            result.push({ kind: 'added', value: after[right++] })
        }
    }
    return result
}

function renderMarkdown(source: string) {
    const markdown = new MarkdownIt({ linkify: true })
    const defaultLinkOpen = markdown.renderer.rules.link_open
    markdown.renderer.rules.link_open = (tokens, index, options, environment, self) => {
        const href = tokens[index].attrGet('href')
        if (href?.startsWith('/')) tokens[index].attrSet('href', new URL(href, LEGAL_ORIGIN).toString())
        tokens[index].attrSet('target', '_blank')
        tokens[index].attrSet('rel', 'noreferrer')
        return defaultLinkOpen ? defaultLinkOpen(tokens, index, options, environment, self) : self.renderToken(tokens, index, options)
    }
    const withoutAnchors = source.replace(/^\s*<a id="[a-z0-9-]+"><\/a>\s*$/gim, '')
    return markdown.render(withoutAnchors)
}

function comparisonUrl(documentUrl: URL, compareVersion?: string) {
    if (!compareVersion || !VERSION_PATTERN.test(compareVersion)) return null
    const match = documentUrl.pathname.match(/^(.*-(?:en|de)-)(\d{4}-\d{2}-\d{2})(\.md)$/)
    if (!match || compareVersion >= match[2]) return null
    return new URL(`${match[1]}${compareVersion}${match[3]}`, LEGAL_ORIGIN)
}

function renderComparison(previous: string, current: string, german: boolean) {
    const labels = german ? { added: 'Neuer Wortlaut', removed: 'Bisheriger Wortlaut' } : { added: 'New wording', removed: 'Previous wording' }
    return diffBlocks(previous, current)
        .map(block => {
            if (block.kind === 'unchanged') return renderMarkdown(block.value)
            const tag = block.kind === 'added' ? 'ins' : 'del'
            return `<${tag} class="${styles[block.kind]}"><strong class="${styles.changeLabel}">${labels[block.kind]}</strong>${renderMarkdown(block.value)}</${tag}>`
        })
        .join('')
}

export default async function LegalDocumentPage(props: { searchParams: Promise<{ url?: string; sha256?: string; compareVersion?: string }> }) {
    const { url, sha256, compareVersion } = await props.searchParams
    if (!url || !sha256?.match(/^[a-f0-9]{64}$/i)) notFound()

    let documentUrl: URL
    try {
        documentUrl = new URL(url)
    } catch {
        notFound()
    }
    if (documentUrl.origin !== LEGAL_ORIGIN || !documentUrl.pathname.startsWith('/legal/archive/') || !documentUrl.pathname.endsWith('.md')) notFound()

    const response = await fetch(documentUrl, { next: { revalidate: 86400 } })
    if (!response.ok) notFound()
    const source = await response.text()
    if (createHash('sha256').update(source).digest('hex') !== sha256.toLowerCase()) notFound()

    const { content } = matter(source)
    const compareUrl = comparisonUrl(documentUrl, compareVersion)
    let comparison: string | null = null
    if (compareUrl) {
        try {
            const previousResponse = await fetch(compareUrl, { next: { revalidate: 86400 } })
            if (previousResponse.ok) comparison = matter(await previousResponse.text()).content
        } catch {
            comparison = null
        }
    }
    const german = documentUrl.pathname.includes('-de-')

    return (
        <main className="container">
            {comparison ? (
                <aside className={styles.comparison}>
                    <strong>{german ? `Änderungen seit ${compareVersion}` : `Changes since ${compareVersion}`}</strong>
                    <span>{german ? 'Neuer Wortlaut ist grün, bisheriger Wortlaut rot markiert.' : 'New wording is green; previous wording is red.'}</span>
                </aside>
            ) : null}
            <article
                className={styles.document}
                dangerouslySetInnerHTML={{ __html: comparison ? renderComparison(comparison, content, german) : renderMarkdown(content) }}
            />
            <p className={styles.source}>
                {german
                    ? 'Der aktuelle Wortlaut stammt aus dem exakten, durch das angezeigte Vereinbarungspaket verifizierten Dokument; der Vergleich stammt aus der früheren unveränderlichen Coflnet-Archivversion.'
                    : 'The current wording comes from the exact document verified by the displayed agreement package; comparison wording comes from the earlier immutable Coflnet archive version.'}
            </p>
        </main>
    )
}
