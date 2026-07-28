'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import properties from '../../properties'
import styles from './AiChat.module.css'

type Message = {
    role: 'user' | 'assistant'
    content: string
    createdAt?: string
    traceId?: string
    requiresBugReport?: boolean
    rejectedContent?: string
}
type Quota = { limit: number; remaining: number; resetsAt: string; tier: string }
type AiNotice = { version: string; notice: string; privacyUrl: string }

const STORAGE_KEY = 'skycofl-ai-chat'
const OPEN_KEY = 'skycofl-ai-chat-open'
const CONVERSATION_KEY = 'skycofl-ai-conversation'
const QUOTA_KEY = 'skycofl-ai-chat-quota'
const RETRY_KEY = 'skycofl-ai-chat-retry'
const ERROR_KEY = 'skycofl-ai-chat-error'
const progressMessages = [
    'Understanding your question…',
    'Searching SkyCofl knowledge…',
    'Checking relevant live data…',
    'Verifying links and details…',
    'Writing the answer…'
]
const welcome: Message = {
    role: 'assistant',
    content: 'Ask me about SkyCofl features, filters, guides, API endpoints, or current SkyBlock item prices.'
}

export function AiChat({ fullPage = false }: { fullPage?: boolean }) {
    const pathname = usePathname()
    const [loaded, setLoaded] = useState(false)
    const [open, setOpen] = useState(false)
    const [notice, setNotice] = useState<AiNotice>()
    const [noticeError, setNoticeError] = useState('')
    const [messages, setMessages] = useState<Message[]>([welcome])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [progressIndex, setProgressIndex] = useState(0)
    const [quota, setQuota] = useState<Quota>()
    const [error, setError] = useState('')
    const [retryMessage, setRetryMessage] = useState('')
    const [authenticated, setAuthenticated] = useState(false)
    const [conversationId, setConversationId] = useState('')
    const [requiresNewConversation, setRequiresNewConversation] = useState(false)
    const [transcriptSize, setTranscriptSize] = useState<{ bytes: number; limit: number }>()
    const [launcher, setLauncher] = useState<HTMLElement | null>(null)
    const [now, setNow] = useState(Date.now())
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setOpen(localStorage.getItem(OPEN_KEY) === 'true')
        setConversationId(localStorage.getItem(CONVERSATION_KEY) || '')
        setAuthenticated(Boolean(sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')))
        setRetryMessage(localStorage.getItem(RETRY_KEY) || '')
        setError(localStorage.getItem(ERROR_KEY) || '')
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
            if (Array.isArray(stored) && stored.length) setMessages(stored.map(sanitizeStoredMessage))
        } catch {}
        try {
            const storedQuota = JSON.parse(localStorage.getItem(QUOTA_KEY) || 'null')
            if (storedQuota?.tier && typeof storedQuota.remaining === 'number') setQuota(storedQuota)
        } catch {}
        setLoaded(true)
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        fetch(`${properties.apiEndpoint}/data/ai/notice`, { cache: 'no-store', signal: controller.signal })
            .then(async response => {
                if (!response.ok) throw new Error(`AI data notice failed (${response.status})`)
                const data = await response.json()
                const currentNotice = readNotice(data)
                if (!currentNotice) throw new Error('The AI data notice is incomplete.')
                setNotice(currentNotice)
                setNoticeError('')
            })
            .catch(requestError => {
                if (requestError instanceof DOMException && requestError.name === 'AbortError') return
                setNoticeError('The AI chat is unavailable because its current data notice could not be loaded.')
            })
        return () => controller.abort()
    }, [])

    useEffect(() => {
        const onLogin = () => setAuthenticated(true)
        document.addEventListener('googleLogin', onLogin)
        return () => document.removeEventListener('googleLogin', onLogin)
    }, [])

    useEffect(() => {
        if (!loaded) return
        localStorage.setItem(OPEN_KEY, String(open))
    }, [loaded, open])

    useEffect(() => {
        setLauncher(document.getElementById('skycofl-ai-chat-launcher'))
    }, [pathname])

    useEffect(() => {
        if (!loaded) return
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [loaded, messages, loading])

    useEffect(() => {
        if (!quota || quota.remaining > 0) return
        setNow(Date.now())
        if (Date.parse(quota.resetsAt) <= Date.now()) return
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [quota])

    useEffect(() => {
        if (!loading) return
        const timer = window.setInterval(() => setProgressIndex(current => (current + 1) % progressMessages.length), 3600)
        return () => window.clearInterval(timer)
    }, [loading])

    const limitReached = Boolean(quota && quota.remaining <= 0 && Date.parse(quota.resetsAt) > now)

    async function send(event?: FormEvent) {
        event?.preventDefault()
        const content = input.trim()
        if (!content) return
        await sendMessage(content, true)
    }

    async function sendMessage(content: string, append: boolean) {
        if (!notice || loading || requiresNewConversation || (limitReached && append)) return

        if (append) {
            setMessages(current => [...current, { role: 'user', content, createdAt: new Date().toISOString() }])
            setInput('')
        }
        setError('')
        setProgressIndex(0)
        setLoading(true)
        try {
            const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
            const response = await fetch(`${properties.apiEndpoint}/data/ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    conversationId: conversationId || undefined,
                    message: content,
                    page: pathname,
                    dataNoticeVersion: notice.version
                })
            })
            const data = await response.json().catch(() => ({}))
            if (response.status === 428) {
                const currentNotice = readNotice({
                    version: data.dataNoticeVersion ?? data.DataNoticeVersion,
                    notice: data.dataNotice ?? data.DataNotice,
                    privacyUrl: notice.privacyUrl
                })
                if (currentNotice) setNotice(currentNotice)
                throw new Error('The AI data notice changed. Please review it and send your message again.')
            }
            const responseQuota = data.quota ?? data.Quota
            if (responseQuota) {
                const nextQuota = {
                    limit: responseQuota.limit ?? responseQuota.Limit,
                    remaining: responseQuota.remaining ?? responseQuota.Remaining,
                    resetsAt: responseQuota.resetsAt ?? responseQuota.ResetsAt,
                    tier: responseQuota.tier ?? responseQuota.Tier
                }
                setQuota(nextQuota)
                localStorage.setItem(QUOTA_KEY, JSON.stringify(nextQuota))
            }
            const responseConversation = data.conversationId ?? data.ConversationId
            if (responseConversation) {
                setConversationId(responseConversation)
                localStorage.setItem(CONVERSATION_KEY, responseConversation)
            }
            const blocked = data.requiresNewConversation ?? data.RequiresNewConversation ?? response.status === 404
            setRequiresNewConversation(Boolean(blocked))
            const bytes = data.transcriptBytes ?? data.TranscriptBytes
            const limit = data.transcriptLimit ?? data.TranscriptLimit
            if (typeof bytes === 'number' && typeof limit === 'number') setTranscriptSize({ bytes, limit })
            if (!response.ok) throw new Error(data.answer ?? data.Answer ?? data.message ?? data.Message ?? `Chat request failed (${response.status})`)
            const traceId = data.traceId ?? data.TraceId ?? response.headers.get('X-Trace-Id') ?? undefined
            const rawAnswer = data.answer ?? data.Answer ?? ''
            const requiresBugReport = Boolean(data.requiresBugReport ?? data.RequiresBugReport) || !isPlausibleAnswer(rawAnswer)
            const answer = requiresBugReport ? rejectedAnswer(traceId) : rawAnswer
            setMessages(current => [
                ...current,
                {
                    role: 'assistant',
                    content: answer || 'I could not produce an answer.',
                    createdAt: new Date().toISOString(),
                    traceId,
                    requiresBugReport,
                    rejectedContent: requiresBugReport && rawAnswer !== answer ? rawAnswer : undefined
                }
            ])
            setRetryMessage('')
            localStorage.removeItem(RETRY_KEY)
            localStorage.removeItem(ERROR_KEY)
        } catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : 'Chat request failed. Please try again.'
            setError(message)
            setRetryMessage(content)
            localStorage.setItem(ERROR_KEY, message)
            localStorage.setItem(RETRY_KEY, content)
        } finally {
            setLoading(false)
        }
    }

    async function clearConversation() {
        const id = conversationId
        setMessages([welcome])
        setConversationId('')
        setRequiresNewConversation(false)
        setTranscriptSize(undefined)
        setError('')
        setRetryMessage('')
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(CONVERSATION_KEY)
        localStorage.removeItem(RETRY_KEY)
        localStorage.removeItem(ERROR_KEY)
        if (!id) return
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
        await fetch(`${properties.apiEndpoint}/data/ai/${id}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(() => undefined)
    }

    function exportConversation() {
        const report = {
            format: 'skycofl-ai-report-v1',
            exportedAt: new Date().toISOString(),
            conversationId: conversationId || null,
            page: pathname,
            messages,
            transcriptSize: transcriptSize ?? null,
            dataNoticeVersion: notice?.version ?? null,
            notice: notice?.notice ?? null
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `skycofl-ai-report-${new Date().toISOString().replaceAll(':', '-')}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void send()
        }
    }

    if (!loaded) return null

    if (!open && !fullPage) {
        if (!launcher) return null
        return createPortal(
            <button className={styles.bubble} onClick={() => setOpen(true)} aria-label="Open SkyCofl AI assistant">
                <span aria-hidden="true">✦</span> Ask SkyCofl
            </button>,
            launcher
        )
    }

    return (
        <section className={`${styles.panel} ${fullPage ? styles.fullPage : ''}`} aria-label="SkyCofl AI assistant">
            <header className={styles.header}>
                <div className={styles.title}>
                    <strong>SkyCofl Assistant</strong>
                    <span>Prices, filters, features & guides</span>
                </div>
                <div className={styles.actions}>
                    {!fullPage ? (
                        <Link href="/chat" aria-label="Expand chat to full page">
                            Expand
                        </Link>
                    ) : null}
                    <button onClick={exportConversation} aria-label="Export chat report">
                        Export
                    </button>
                    <button onClick={() => void clearConversation()} aria-label="Clear chat and start a new session">
                        Clear
                    </button>
                    {!fullPage ? (
                        <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close assistant">
                            ×
                        </button>
                    ) : null}
                </div>
            </header>
            <div className={styles.notice} role="note">
                <span>
                    {notice?.notice || noticeError || 'Loading the AI data notice…'}{' '}
                    {notice ? (
                        <>
                            <a href={notice.privacyUrl} target="_blank" rel="noreferrer">
                                Privacy details
                            </a>
                            {' · '}
                            <a href="mailto:support@coflnet.com">Contact human support</a>
                        </>
                    ) : null}
                </span>
            </div>
            <div className={styles.messages} aria-live="polite">
                {messages.map((message, index) => (
                    <div key={index} className={`${styles.message} ${styles[message.role]}`}>
                        {message.role === 'assistant' ? <Markdown text={message.content} /> : message.content}
                        {message.traceId ? (
                            <button className={styles.trace} onClick={() => void navigator.clipboard.writeText(message.traceId!)} title={message.traceId}>
                                trace {message.traceId.slice(0, 12)}…
                            </button>
                        ) : null}
                        {message.requiresBugReport ? (
                            <div className={styles.bugReportActions}>
                                <button onClick={() => reportOnDiscord(previousUserMessage(messages, index), message.traceId)}>
                                    Copy report & open Discord
                                </button>
                                <button onClick={exportConversation}>Export transcript</button>
                            </div>
                        ) : null}
                    </div>
                ))}
                {loading ? (
                    <div key={progressIndex} className={`${styles.message} ${styles.assistant} ${styles.typing}`}>
                        {progressMessages[progressIndex]}
                    </div>
                ) : null}
                {error ? <div className={styles.error}>{error}</div> : null}
                {limitReached && quota ? (
                    <div className={styles.limitActions}>
                        {quota.tier === 'anonymous' ? (
                            authenticated ? (
                                <strong>You’re signed in. Retry to use your account allowance.</strong>
                            ) : (
                                <Link className={styles.primaryAction} href="/account">
                                    Log in for 10 messages/day
                                </Link>
                            )
                        ) : upgradePath(quota.tier) ? (
                            <Link className={styles.primaryAction} href={upgradePath(quota.tier)!}>
                                {upgradeLabel(quota.tier)}
                            </Link>
                        ) : null}
                        {retryMessage && (quota.tier !== 'anonymous' || authenticated) ? (
                            <button onClick={() => void sendMessage(retryMessage, false)} disabled={loading}>
                                Retry message
                            </button>
                        ) : !retryMessage && (quota.tier !== 'anonymous' || authenticated) ? (
                            <button
                                onClick={() => {
                                    setQuota(undefined)
                                    setError('')
                                    localStorage.removeItem(QUOTA_KEY)
                                    localStorage.removeItem(ERROR_KEY)
                                }}
                            >
                                Continue with updated allowance
                            </button>
                        ) : null}
                    </div>
                ) : null}
                <div ref={endRef} />
            </div>
            <form className={styles.form} onSubmit={send}>
                <textarea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={!notice || requiresNewConversation || limitReached}
                    maxLength={6000}
                    rows={2}
                    placeholder={
                        !notice
                            ? noticeError || 'Loading the AI data notice…'
                            : requiresNewConversation
                              ? 'Export or clear this full conversation to continue.'
                              : limitReached
                                ? `Daily limit reached · resets in ${formatDuration(Date.parse(quota!.resetsAt) - now)}`
                                : 'What is Hyperion worth? How do filters work?'
                    }
                    aria-label="Message SkyCofl assistant"
                />
                <button type="submit" disabled={!notice || !input.trim() || loading || requiresNewConversation || limitReached}>
                    Send
                </button>
            </form>
            <footer className={styles.footer}>
                {quota ? `${quota.remaining} of ${quota.limit} daily messages left (${formatTier(quota.tier)})` : 'Anonymous: 3 messages/day · Sign in for 10'}
                {limitReached ? ` · Resets in ${formatDuration(Date.parse(quota!.resetsAt) - now)}` : null}
                {transcriptSize ? ` · ${contextPercentage(transcriptSize)}% of context` : null}
            </footer>
        </section>
    )
}

function readNotice(data: Record<string, unknown>): AiNotice | undefined {
    const version = data.version ?? data.Version
    const notice = data.notice ?? data.Notice
    const privacyUrl = data.privacyUrl ?? data.PrivacyUrl
    return typeof version === 'string' && typeof notice === 'string' && typeof privacyUrl === 'string' ? { version, notice, privacyUrl } : undefined
}

function Markdown({ text }: { text: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{
                a: ({ href, children }) => {
                    const safe = safeHref(href || '')
                    if (!safe) return <>{children}</>
                    return safe.startsWith('/') ? (
                        <Link href={safe}>{children}</Link>
                    ) : (
                        <a href={safe} target="_blank" rel="noreferrer">
                            {children}
                        </a>
                    )
                }
            }}
        >
            {text}
        </ReactMarkdown>
    )
}

function safeHref(value: string) {
    if (value.startsWith('/') && !value.startsWith('//')) return value
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && (url.hostname === 'coflnet.com' || url.hostname.endsWith('.coflnet.com')) ? value : null
    } catch {
        return null
    }
}

function isPlausibleAnswer(answer: unknown): answer is string {
    if (
        typeof answer !== 'string' ||
        !/[A-Za-z0-9\u00c0-\uffff]/.test(answer) ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffd]/.test(answer) ||
        /(?:[<\s|｜]*DSML[\s|｜]*tool[_\s]?calls?\b|<\s*\/?\s*(?:think|tool[_\s]?calls?|invoke|parameter|function)\b|tool[_\s]?calls?\s*:\s*[\[{]|"tool_calls"\s*:|\breasoning_content\s*[:=]|<\s*\|\s*(?:analysis|assistant|tool)\s*\||["']?(?:name|function)["']?\s*:\s*["'](?:search_item|search_filter_options|get_filters|get_price|search_knowledge|search_api_tools|call_api_get)["'])/i.test(
            answer
        )
    )
        return false

    const words = answer.toLowerCase().match(/[A-Za-z0-9\u00c0-\uffff]+/g) || []
    if (words.length >= 20 && new Set(words).size <= Math.max(4, Math.floor(words.length / 5))) return false
    const lines = answer
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length >= 8)
    return !lines.some(line => lines.filter(candidate => candidate === line).length >= 3)
}

function rejectedAnswer(traceId?: string) {
    return `I couldn't safely show that response because it appeared malformed. Please report this question in the SkyCofl Discord with trace ID \`${traceId || 'unknown'}\`, or export this conversation and attach the transcript.`
}

function sanitizeStoredMessage(message: Message): Message {
    if (message?.role !== 'assistant' || isPlausibleAnswer(message.content)) return message
    return {
        ...message,
        content: rejectedAnswer(message.traceId),
        requiresBugReport: true,
        rejectedContent: message.rejectedContent || message.content
    }
}

function previousUserMessage(messages: Message[], assistantIndex: number) {
    for (let index = assistantIndex - 1; index >= 0; index--) {
        if (messages[index].role === 'user') return messages[index].content
    }
    return ''
}

function reportOnDiscord(question: string, traceId?: string) {
    const report = [
        'The SkyCofl AI assistant rejected an implausible response.',
        '',
        `Trace ID: ${traceId || 'unknown'}`,
        '',
        'Question:',
        question.slice(0, 1000),
        '',
        'Please attach the exported chat transcript if possible.'
    ].join('\n')
    void navigator.clipboard.writeText(report).catch(() => undefined)
    window.open('https://discord.gg/wvKXfTgCfb', '_blank', 'noopener,noreferrer')
}

function formatTier(tier: string) {
    return tier.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

function contextPercentage({ bytes, limit }: { bytes: number; limit: number }) {
    return limit > 0 ? Math.min(100, Math.round((bytes / limit) * 100)) : 0
}

function formatDuration(milliseconds: number) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainder = seconds % 60
    return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${remainder}s` : `${remainder}s`
}

function upgradePath(tier: string) {
    if (tier === 'starter_premium') return '/premium?tier=premium'
    if (tier === 'premium') return '/premium?tier=premium_plus'
    if (tier === 'logged_in') return '/premium?tier=starter'
    return null
}

function upgradeLabel(tier: string) {
    if (tier === 'starter_premium') return 'Upgrade to Premium for 50 messages/day'
    if (tier === 'premium') return 'Upgrade to Premium+ for 200 messages/day'
    return 'Upgrade to Starter Premium for 20 messages/day'
}
