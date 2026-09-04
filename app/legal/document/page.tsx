import { createHash } from 'crypto'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

const LEGAL_ORIGIN = 'https://coflnet.com'

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

export default async function LegalDocumentPage(props: { searchParams: Promise<{ url?: string; sha256?: string }> }) {
    const { url, sha256 } = await props.searchParams
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
    return (
        <main className="container">
            <article className={styles.document} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
            <p className={styles.source}>This readable page was generated from the exact immutable document verified by the displayed agreement package.</p>
        </main>
    )
}
