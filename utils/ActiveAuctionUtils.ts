/** Pure helpers of the active auction explorer (/auctions): URL (de)serialisation, chips, live insertion position. */

export type ActiveAuctionOrder = 'LOWEST_PRICE' | 'HIGHEST_PRICE' | 'ENDING_SOON' | 'NEWEST'

export const ACTIVE_AUCTION_ORDERS: { label: string; value: ActiveAuctionOrder }[] = [
    { label: 'Lowest price', value: 'LOWEST_PRICE' },
    { label: 'Highest price', value: 'HIGHEST_PRICE' },
    { label: 'Ending soon', value: 'ENDING_SOON' },
    { label: 'Newest', value: 'NEWEST' }
]

export const DEFAULT_ACTIVE_AUCTION_ORDER: ActiveAuctionOrder = 'LOWEST_PRICE'
export const GROUPED_PER_TAG_LIMIT = 5
export const ACTIVE_AUCTION_PAGE_SIZE = 50
export const MAX_KNOWN_UUIDS = 200

/** the explicit state that drives the request, the URL and the live subscription */
export interface ActiveAuctionQueryState {
    q: string
    tags: string[]
    armorSet: string | null
    categories: string[]
    itemNameContains: string | null
    filters: { [key: string]: string }
    orderBy: ActiveAuctionOrder
    /** 0 = flat list, otherwise the max auctions per item (grouped by item) */
    perTagLimit: number
}

export function createEmptyQueryState(): ActiveAuctionQueryState {
    return {
        q: '',
        tags: [],
        armorSet: null,
        categories: [],
        itemNameContains: null,
        filters: {},
        orderBy: DEFAULT_ACTIVE_AUCTION_ORDER,
        perTagLimit: 0
    }
}

/** URL params that are not item filters (kept in sync with NON_FILTER_PARAMS of ItemFilterParams) */
export const RESERVED_QUERY_KEYS = ['q', 'tags', 'armorSet', 'categories', 'itemNameContains', 'orderBy', 'perTagLimit', 'page', 'pageSize']

const FILTER_UI_KEYS = ['_hide', '_sellerName']

function splitList(value: string | null | undefined): string[] {
    return (value || '')
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
}

export function cleanFilters(filters: { [key: string]: any } | undefined | null): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    Object.keys(filters || {}).forEach(key => {
        const value = filters![key]
        if (FILTER_UI_KEYS.includes(key) || RESERVED_QUERY_KEYS.includes(key) || key === 'apply') {
            return
        }
        if (value === undefined || value === null || value === '') {
            return
        }
        result[key] = String(value)
    })
    return result
}

/** reads the shareable URL (`?tags=A,B&armorSet=X&orderBy=..&Sharpness=7`) back into a state, unknown keys are item filters */
export function stateFromSearchParams(search: string | URLSearchParams): ActiveAuctionQueryState {
    const params = typeof search === 'string' ? new URLSearchParams(search) : search
    const state = createEmptyQueryState()
    state.q = params.get('q') || ''
    state.tags = splitList(params.get('tags'))
    state.armorSet = params.get('armorSet') || null
    state.categories = splitList(params.get('categories'))
    state.itemNameContains = params.get('itemNameContains') || null
    const order = params.get('orderBy')
    if (ACTIVE_AUCTION_ORDERS.some(o => o.value === order)) {
        state.orderBy = order as ActiveAuctionOrder
    }
    const perTag = Number(params.get('perTagLimit'))
    state.perTagLimit = Number.isFinite(perTag) && perTag > 0 ? Math.floor(perTag) : 0
    const filters: { [key: string]: string } = {}
    params.forEach((value, key) => {
        filters[key] = value
    })
    state.filters = cleanFilters(filters)
    return state
}

/** flat params shared by the URL and the request; defaults are omitted to keep links short */
export function stateToParams(state: ActiveAuctionQueryState): { [key: string]: string } {
    const params: { [key: string]: string } = {}
    if (state.q.trim()) params.q = state.q.trim()
    if (state.tags.length) params.tags = state.tags.join(',')
    if (state.armorSet) params.armorSet = state.armorSet
    if (state.categories.length) params.categories = state.categories.join(',')
    if (state.itemNameContains) params.itemNameContains = state.itemNameContains
    if (state.orderBy !== DEFAULT_ACTIVE_AUCTION_ORDER) params.orderBy = state.orderBy
    if (state.perTagLimit > 0) params.perTagLimit = String(state.perTagLimit)
    Object.assign(params, cleanFilters(state.filters))
    return params
}

export function stateToSearchString(state: ActiveAuctionQueryState): string {
    return new URLSearchParams(stateToParams(state)).toString()
}

/**
 * params of the backend request. The free text `q` is only kept for the URL/input: it has already been resolved into
 * the explicit tags/armorSet/filters (which the user may have edited), so sending it too would re-apply removed chips.
 */
export function stateToRequestParams(state: ActiveAuctionQueryState, page: number, pageSize: number = ACTIVE_AUCTION_PAGE_SIZE): { [key: string]: string | number } {
    const params: { [key: string]: string | number } = stateToParams({ ...state, q: '' })
    params.orderBy = state.orderBy
    params.page = page
    params.pageSize = pageSize
    return params
}

/** a live subscription only makes sense when it is narrowed by at least one tag or filter */
export function hasAnyNarrowing(state: ActiveAuctionQueryState): boolean {
    return (
        state.tags.length > 0 ||
        !!state.armorSet ||
        state.categories.length > 0 ||
        !!state.itemNameContains ||
        Object.keys(cleanFilters(state.filters)).length > 0
    )
}

/** filter object sent with the live subscription */
export function stateToSubscriptionFilter(state: ActiveAuctionQueryState): { [key: string]: string } {
    const filter: { [key: string]: string } = { ...cleanFilters(state.filters) }
    if (state.itemNameContains) filter.itemNameContains = state.itemNameContains
    return filter
}

export const MAX_SUBSCRIPTION_TAGS = 8

/** tags of the live topic: the backend's resolved tag set, capped to the 8 biggest by tagCounts */
export function getSubscriptionTags(resolvedTags: string[], tagCounts: { [tag: string]: number }): string[] {
    if (resolvedTags.length <= MAX_SUBSCRIPTION_TAGS) {
        return [...resolvedTags]
    }
    return [...resolvedTags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0)).slice(0, MAX_SUBSCRIPTION_TAGS)
}

/** `active/*` is only allowed with a real filter or name; with resolved tags the topic is always narrow enough */
export function shouldSubscribeLive(state: ActiveAuctionQueryState, resolvedTags: string[]): boolean {
    return resolvedTags.length > 0 || Object.keys(stateToSubscriptionFilter(state)).length > 0
}

export type ChipKind = 'tag' | 'armorSet' | 'category' | 'filter' | 'name'

export interface QueryChip {
    kind: ChipKind
    /** tag / category value, or the filter key */
    key: string
    label: string
}

export function chipsFromState(state: ActiveAuctionQueryState, tagLabel: (tag: string) => string = t => t): QueryChip[] {
    const chips: QueryChip[] = []
    state.tags.forEach(tag => chips.push({ kind: 'tag', key: tag, label: tagLabel(tag) }))
    if (state.armorSet) chips.push({ kind: 'armorSet', key: state.armorSet, label: `Set: ${state.armorSet}` })
    state.categories.forEach(c => chips.push({ kind: 'category', key: c, label: c }))
    Object.entries(cleanFilters(state.filters)).forEach(([key, value]) => chips.push({ kind: 'filter', key, label: `${key}: ${value}` }))
    if (state.itemNameContains) chips.push({ kind: 'name', key: state.itemNameContains, label: `Name contains "${state.itemNameContains}"` })
    return chips
}

export function removeChip(state: ActiveAuctionQueryState, chip: QueryChip): ActiveAuctionQueryState {
    const next: ActiveAuctionQueryState = { ...state, filters: { ...state.filters } }
    switch (chip.kind) {
        case 'tag':
            next.tags = state.tags.filter(t => t !== chip.key)
            break
        case 'armorSet':
            next.armorSet = null
            break
        case 'category':
            next.categories = state.categories.filter(c => c !== chip.key)
            break
        case 'filter':
            delete next.filters[chip.key]
            break
        case 'name':
            next.itemNameContains = null
            break
    }
    return next
}

/** replaces the resolvable part of the state with what the free text resolved to; an unresolvable text falls back to a name search */
export function applyResolvedQuery(state: ActiveAuctionQueryState, resolved: ResolvedActiveQuery, q: string): ActiveAuctionQueryState {
    const filters = cleanFilters(resolved.filters)
    const nothingResolved = resolved.tags.length === 0 && !resolved.armorSet && !resolved.itemNameContains && Object.keys(filters).length === 0
    return {
        ...state,
        q,
        tags: [...resolved.tags],
        armorSet: resolved.armorSet || null,
        filters,
        itemNameContains: nothingResolved && q.trim() ? q.trim() : resolved.itemNameContains || null
    }
}

export function getAuctionPrice(a: { highestBidAmount: number; startingBid: number }): number {
    return a.highestBidAmount > 0 ? a.highestBidAmount : a.startingBid
}

type Sortable = { highestBidAmount: number; startingBid: number; end: Date; start?: Date }

function compareForOrder(a: Sortable, b: Sortable, order: ActiveAuctionOrder): number {
    switch (order) {
        case 'LOWEST_PRICE':
            return getAuctionPrice(a) - getAuctionPrice(b)
        case 'HIGHEST_PRICE':
            return getAuctionPrice(b) - getAuctionPrice(a)
        case 'ENDING_SOON':
            return a.end.getTime() - b.end.getTime()
        case 'NEWEST':
            return (b.start ?? b.end).getTime() - (a.start ?? a.end).getTime()
    }
}

/**
 * Index at which a live auction belongs in the loaded (already sorted) window, or -1 when it would sort behind the
 * last loaded element while more pages exist (it then belongs to a not yet loaded page and is only counted as new).
 */
export function findInsertIndex(list: Sortable[], item: Sortable, order: ActiveAuctionOrder, hasMore: boolean): number {
    for (let i = 0; i < list.length; i++) {
        if (compareForOrder(item, list[i], order) < 0) {
            return i
        }
    }
    return hasMore ? -1 : list.length
}

/** short text for the time left, e.g. `2d 3h`, `5m 12s`, `ended` */
export function formatTimeLeft(end: Date, now: number = Date.now()): string {
    const seconds = Math.floor((end.getTime() - now) / 1000)
    if (seconds <= 0) return 'ended'
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}
