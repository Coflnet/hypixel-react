'use client'

import MarkdownIt from 'markdown-it'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

type DiffBlock = {
    kind: 'added' | 'removed' | 'unchanged'
    value: string
}

function contentOnly(source: string) {
    return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
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
        if (href?.startsWith('/')) tokens[index].attrSet('href', new URL(href, 'https://coflnet.com').toString())
        tokens[index].attrSet('target', '_blank')
        tokens[index].attrSet('rel', 'noreferrer')
        return defaultLinkOpen ? defaultLinkOpen(tokens, index, options, environment, self) : self.renderToken(tokens, index, options)
    }
    return markdown.render(source.replace(/^\s*<a id="[a-z0-9-]+"><\/a>\s*$/gim, ''))
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

async function hash(source: string) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export default function LegalDocumentReader({
    url,
    sha256,
    compareUrl,
    compareVersion,
    german
}: {
    url: string
    sha256: string
    compareUrl?: string
    compareVersion?: string
    german: boolean
}) {
    const [html, setHtml] = useState<string>()
    const [comparison, setComparison] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        let active = true
        async function load() {
            try {
                const response = await fetch(url)
                if (!response.ok) throw new Error('Document download failed')
                const source = await response.text()
                if ((await hash(source)) !== sha256) throw new Error('Document checksum mismatch')

                let previous: string | undefined
                if (compareUrl) {
                    try {
                        const previousResponse = await fetch(compareUrl)
                        if (previousResponse.ok) previous = contentOnly(await previousResponse.text())
                    } catch {
                        previous = undefined
                    }
                }
                if (!active) return
                const content = contentOnly(source)
                setComparison(Boolean(previous))
                setHtml(previous ? renderComparison(previous, content, german) : renderMarkdown(content))
            } catch {
                if (active) setError(true)
            }
        }
        load()
        return () => {
            active = false
        }
    }, [compareUrl, german, sha256, url])

    if (error)
        return <main className="container">{german ? 'Das verifizierte Dokument konnte nicht geladen werden.' : 'The verified document could not be loaded.'}</main>
    if (!html) return <main className="container">{german ? 'Dokument wird geladen…' : 'Loading document…'}</main>

    return (
        <main className="container">
            {comparison ? (
                <aside className={styles.comparison}>
                    <strong>{german ? `Änderungen seit ${compareVersion}` : `Changes since ${compareVersion}`}</strong>
                    <span>{german ? 'Neuer Wortlaut ist grün, bisheriger Wortlaut rot markiert.' : 'New wording is green; previous wording is red.'}</span>
                </aside>
            ) : null}
            <article className={styles.document} dangerouslySetInnerHTML={{ __html: html }} />
            <p className={styles.source}>
                {german
                    ? 'Der aktuelle Wortlaut stammt aus dem exakten, durch das angezeigte Vereinbarungspaket verifizierten Dokument; der Vergleich stammt aus der früheren unveränderlichen Coflnet-Archivversion.'
                    : 'The current wording comes from the exact document verified by the displayed agreement package; comparison wording comes from the earlier immutable Coflnet archive version.'}
            </p>
        </main>
    )
}
