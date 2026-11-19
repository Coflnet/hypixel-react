import { SITEMAP_CONFIG } from '../sitemap-config'

export type PageIconKey =
    | 'home'
    | 'bazaar'
    | 'premiumBazaar'
    | 'flipper'
    | 'hub'
    | 'crafts'
    | 'kat'
    | 'forge'
    | 'fusion'
    | 'upgrade'
    | 'book'
    | 'npc'
    | 'mayor'
    | 'supply'
    | 'recent'
    | 'movers'
    | 'leaderboard'
    | 'trade'
    | 'notifier'
    | 'premium'
    | 'account'
    | 'mod'
    | 'referral'
    | 'about'
    | 'wiki'
    | 'guides'
    | 'updates'
    | 'feedback'
    | 'data'
    | 'article'

export interface PageSearchEntry {
    route: string
    title: string
    aliases: string[]
    keywords: string[]
    description?: string
    icon: PageIconKey
    priority?: 'tool' | 'low'
}

export interface PageSearchMatch {
    entry: PageSearchEntry
    score: number
    exact: boolean
}

const MAX_TOOL_MATCHES = 3
const MAX_LOW_MATCHES = 2

function tool(route: string, title: string, icon: PageIconKey, aliases: string[], keywords: string[] = [], description?: string): PageSearchEntry {
    return { route, title, icon, aliases, keywords, description, priority: 'tool' }
}

const CORE_PAGES: PageSearchEntry[] = [
    tool('/', 'Home', 'home', ['home', 'start'], ['main', 'frontpage']),
    tool('/bazaar', 'Bazaar Flips', 'bazaar', ['bz', 'bazaar', 'bazaar flips', 'bazaar flipper'], ['bazaar', 'flip', 'flips', 'orders'], 'Profitable bazaar orders'),
    tool('/premiumBazaar', 'Premium Bazaar Flips', 'premiumBazaar', ['pbz', 'premium bazaar'], ['bazaar', 'premium'], 'Bazaar flips with more data'),
    tool('/flipper', 'AH Flipper', 'flipper', ['ah', 'flipper', 'ah flipper', 'auction flipper'], ['auction', 'flip', 'flips', 'house'], 'Live auction house flips'),
    tool('/flips', 'Flipping Hub', 'hub', ['flips', 'hub'], ['flip', 'flipping', 'overview'], 'All flip types in one place'),
    tool('/crafts', 'Craft Flips', 'crafts', ['crafts', 'crafting'], ['craft', 'flip', 'flips']),
    tool('/kat', 'Kat Flips', 'kat', ['kat'], ['pet', 'upgrade', 'flip', 'flips']),
    tool('/forge', 'Forge Flips', 'forge', ['forge'], ['dwarven', 'flip', 'flips']),
    tool('/fusion', 'Attribute Fusion Flips', 'fusion', ['fusion', 'attribute fusion'], ['attribute', 'shards', 'flip', 'flips']),
    tool('/attributeFlips', 'Item Upgrade Flips', 'upgrade', ['attribute flips', 'item upgrade'], ['attribute', 'upgrade', 'flip', 'flips']),
    tool('/bookFlips', 'Book Flips', 'book', ['book flips', 'books'], ['enchanted', 'book', 'flip', 'flips']),
    tool('/npc', 'NPC Flips', 'npc', ['npc'], ['flip', 'flips', 'shop']),
    tool('/reverseNpc', 'Reverse NPC Flips', 'npc', ['reverse npc'], ['flip', 'flips', 'shop']),
    tool('/mayor', 'Mayor Flips', 'mayor', ['mayor', 'election'], ['flip', 'flips', 'prediction']),
    tool('/lowSupply', 'Low Supply Items', 'supply', ['low supply', 'lowsupply'], ['supply', 'rare', 'items']),
    tool('/auctions', 'Active Auction Explorer', 'flipper', ['auctions', 'active auctions', 'auction explorer', 'ah search'], ['auction', 'active', 'search', 'filter', 'live'], 'Filter all live auctions'),
    tool('/recentFlips', 'Recent Flips', 'recent', ['recent flips'], ['flip', 'flips', 'history']),
    tool('/topMovers', 'Top Movers', 'movers', ['top movers', 'movers'], ['market', 'price', 'change']),
    tool('/profitLeaderboard', 'Profit Leaderboard', 'leaderboard', ['leaderboard', 'lb'], ['profit', 'ranking', 'top']),
    tool('/trade', 'Trade Tracker', 'trade', ['trade', 'trades'], ['tracker', 'trading']),
    tool('/subscriptions', 'Notifier', 'notifier', ['notifier', 'alerts', 'notifications', 'notify'], ['alert', 'subscription', 'subscriptions']),
    tool('/premium', 'Premium', 'premium', ['premium', 'coflcoins'], ['subscription', 'plans', 'coins']),
    tool('/account', 'Account', 'account', ['account', 'settings', 'login'], ['profile', 'sign']),
    tool('/mod', 'Cofl Mod', 'mod', ['mod', 'download'], ['minecraft', 'install', 'fabric']),
    tool('/ref', 'Referral', 'referral', ['ref', 'referral', 'invite'], ['friends', 'reward']),
    tool('/about', 'Links / Legal', 'about', ['about', 'legal', 'privacy'], ['impressum', 'terms', 'links']),
    tool('/wiki', 'Wiki', 'wiki', ['wiki', 'docs', 'help'], ['documentation', 'faq']),
    tool('/guides', 'Flipping Guides', 'guides', ['guides', 'guide'], ['tutorial', 'learn']),
    tool('/updates', 'Updates', 'updates', ['updates', 'changelog', 'news'], ['release', 'changes']),
    tool('/feedback', 'Feedback', 'feedback', ['feedback', 'bug'], ['report', 'support', 'contact']),
    tool('/data', 'Data', 'data', ['data', 'export'], ['download', 'csv'])
]

const CORE_ROUTES = new Set(CORE_PAGES.map(p => p.route))

/** Removes the SEO tail (" | Site", " - Subtitle") from a sitemap page title. */
export function cleanSitemapTitle(title: string): string {
    const cut = title.split(' | ')[0].split(' - ')[0].split(': ')[0].trim()
    return cut.length > 0 ? cut : title
}

function buildSitemapPages(): PageSearchEntry[] {
    return SITEMAP_CONFIG.staticPages
        .filter(page => (page.url.startsWith('/guides/') || page.url.startsWith('/wiki/')) && !CORE_ROUTES.has(page.url))
        .map(page => ({
            route: page.url,
            title: cleanSitemapTitle(page.title),
            aliases: [],
            keywords: page.keywords ?? [],
            icon: 'article' as PageIconKey,
            priority: 'low' as const
        }))
}

export const PAGE_SEARCH_ENTRIES: PageSearchEntry[] = [...CORE_PAGES, ...buildSitemapPages()]

export function normalizePageQuery(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function scoreEntry(entry: PageSearchEntry, query: string, queryWords: string[]): { score: number; exact: boolean } {
    const title = normalizePageQuery(entry.title)
    const aliases = entry.aliases.map(normalizePageQuery)
    const keywords = entry.keywords.map(normalizePageQuery)
    const titleWords = title.split(' ')
    const isLow = entry.priority === 'low'
    let score = 0
    let exact = false

    if (title === query || aliases.includes(query)) {
        score = 100
        exact = true
    } else if (title.startsWith(query)) {
        score = 80
    } else if (aliases.some(a => a.startsWith(query))) {
        score = 70
    } else {
        const allWordsPrefix = (words: string[]) => queryWords.every(qw => words.some(w => w.startsWith(qw)))
        const candidateWords = [...titleWords, ...aliases.flatMap(a => a.split(' '))]
        if (allWordsPrefix(candidateWords)) {
            score = 60
        } else if (titleWords.some(w => w.startsWith(query))) {
            score = 55
        } else if (keywords.some(k => k.startsWith(query))) {
            score = 45
        } else if (query.length >= 3 && title.includes(query)) {
            score = 35
        } else if (query.length >= 3 && keywords.some(k => k.includes(query))) {
            score = 25
        }
    }

    if (score === 0) {
        return { score: 0, exact: false }
    }
    if (isLow) {
        score -= 20
        exact = false
    }
    return { score, exact }
}

export function matchPages(rawQuery: string, entries: PageSearchEntry[] = PAGE_SEARCH_ENTRIES): PageSearchMatch[] {
    const query = normalizePageQuery(rawQuery)
    if (query.length < 2) {
        return []
    }
    const queryWords = query.split(' ')

    const scored: PageSearchMatch[] = []
    for (const entry of entries) {
        const { score, exact } = scoreEntry(entry, query, queryWords)
        if (score > 0) {
            scored.push({ entry, score, exact })
        }
    }
    scored.sort((a, b) => b.score - a.score)

    const result: PageSearchMatch[] = []
    let tools = 0
    let lows = 0
    for (const match of scored) {
        if (match.exact) {
            result.push(match)
        } else if (match.entry.priority === 'low') {
            if (lows < MAX_LOW_MATCHES) {
                lows++
                result.push(match)
            }
        } else if (tools < MAX_TOOL_MATCHES) {
            tools++
            result.push(match)
        }
    }
    return result
}

export function toPageSearchResultItem(match: PageSearchMatch): SearchResultItem {
    return {
        id: 'page:' + match.entry.route,
        type: 'page',
        route: match.entry.route,
        dataItem: { name: match.entry.title, iconUrl: '' },
        tier: '',
        iconKey: match.entry.icon,
        description: match.entry.description,
        exact: match.exact
    }
}
