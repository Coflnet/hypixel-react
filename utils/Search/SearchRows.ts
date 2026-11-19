export type SearchSection = 'Recent' | 'Pages' | 'Items' | 'Players'

export interface ParsedSearchQuery {
    /** the trimmed text as typed, including an "item "/"player " prefix */
    raw: string
    /** the text without the prefix */
    text: string
    /** lower-cased text with collapsed whitespace, used as cache key */
    normalized: string
    only?: 'item' | 'player'
}

export type StageStatus = 'pending' | 'done' | 'error'

export interface StageOutcome {
    key: string
    /** primary stages are awaited by Enter */
    primary: boolean
    /** items of this outcome always belong to this section (otherwise the section follows the result type) */
    fixedSection?: SearchSection
    status: StageStatus
    results: SearchResultItem[]
}

export type SearchRow = { kind: 'header'; label: SearchSection; pending?: boolean } | { kind: 'result'; index: number; result: SearchResultItem }

export interface ComposedSearchRows {
    results: SearchResultItem[]
    rows: SearchRow[]
}

const QUERY_PREFIX = /^(item|player)\s+(\S.*)$/i

export function parseSearchQuery(input: string): ParsedSearchQuery {
    const raw = input.trim()
    const match = QUERY_PREFIX.exec(raw)
    const only = match ? (match[1].toLowerCase() as 'item' | 'player') : undefined
    const text = match ? match[2].trim() : raw
    return {
        raw,
        text,
        normalized: text.toLowerCase().replace(/\s+/g, ' '),
        only
    }
}

const MAX_ITEM_ROWS = 6

function sectionOf(outcome: StageOutcome, result: SearchResultItem): 'Recent' | 'ExactPages' | 'OtherPages' | 'Items' | 'Players' {
    if (outcome.fixedSection === 'Recent') {
        return 'Recent'
    }
    if (outcome.fixedSection === 'Items') {
        return 'Items'
    }
    if (result.type === 'page') {
        return result.exact ? 'ExactPages' : 'OtherPages'
    }
    if (result.type === 'player') {
        return 'Players'
    }
    return 'Items'
}

/**
 * Builds the flat selectable result list and the rows to render (including section headers).
 * The order is canonical and independent of the order in which stages settle:
 * recent searches, exact pages, items (items stage first, then extras of the full search, at most 6), other pages, players.
 */
export function composeSearchRows(outcomes: StageOutcome[]): ComposedSearchRows {
    const buckets = { Recent: [] as SearchResultItem[], ExactPages: [] as SearchResultItem[], Items: [] as SearchResultItem[], OtherPages: [] as SearchResultItem[], Players: [] as SearchResultItem[] }
    const seen = new Set<string>()

    // recent first (it wins deduplication), then the other fixed-section outcomes, then the rest
    const ordered = [
        ...outcomes.filter(o => o.fixedSection === 'Recent'),
        ...outcomes.filter(o => o.fixedSection && o.fixedSection !== 'Recent'),
        ...outcomes.filter(o => !o.fixedSection)
    ]
    for (const outcome of ordered) {
        for (const result of outcome.results) {
            if (seen.has(result.id)) {
                continue
            }
            const section = sectionOf(outcome, result)
            if (section === 'Items' && buckets.Items.length >= MAX_ITEM_ROWS) {
                continue
            }
            seen.add(result.id)
            buckets[section].push(result)
        }
    }

    const allGroups: { label: SearchSection; items: SearchResultItem[] }[] = [
        { label: 'Recent', items: buckets.Recent },
        { label: 'Pages', items: buckets.ExactPages },
        { label: 'Items', items: buckets.Items },
        { label: 'Pages', items: buckets.OtherPages },
        { label: 'Players', items: buckets.Players }
    ]
    const groups = allGroups.filter(g => g.items.length > 0)

    const nonEmptySections = new Set(groups.map(g => g.label))
    const playersPending = outcomes.some(o => o.status === 'pending' && !o.primary && !o.fixedSection)
    const showPendingPlayers = playersPending && buckets.Players.length === 0 && groups.length > 0
    const showHeaders = nonEmptySections.size > 1 || showPendingPlayers

    const results: SearchResultItem[] = []
    const rows: SearchRow[] = []
    for (const group of groups) {
        if (showHeaders) {
            rows.push({ kind: 'header', label: group.label })
        }
        for (const result of group.items) {
            rows.push({ kind: 'result', index: results.length, result })
            results.push(result)
        }
    }
    if (showPendingPlayers) {
        rows.push({ kind: 'header', label: 'Players', pending: true })
    }
    return { results, rows }
}
