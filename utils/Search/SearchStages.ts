import { getApiItemSearchSearchVal, getApiSearchSearchVal } from '../../api/_generated/skyApi'
import { parseSearchResultItem } from '../Parser/APIResponseParser'
import { getMatchingPreviousSearches } from '../PreviousSearchUtils'
import { matchPages, toPageSearchResultItem } from './PageSearchRegistry'
import type { ParsedSearchQuery, SearchSection } from './SearchRows'

export type { ParsedSearchQuery, SearchSection } from './SearchRows'

export interface SearchStage {
    key: string
    section: SearchSection
    /** primary stages are awaited by Enter before the first result is opened */
    awaitForEnter: boolean
    /** results of this stage are always shown in the section above (instead of by result type) */
    fixedSection?: boolean
    /** results of this stage are marked as previous searches by `decorateItems` */
    decorate?: boolean
    appliesTo(q: ParsedSearchQuery): boolean
    /** synchronous result if one is available without a request (cache, pure computation) */
    peek?(q: ParsedSearchQuery): SearchResultItem[] | undefined
    run(q: ParsedSearchQuery, signal: AbortSignal): SearchResultItem[] | Promise<SearchResultItem[]>
}

const ITEM_CACHE_LIMIT = 300
const ITEM_RESULTS_EXPECTED = 5
const itemCache = new Map<string, SearchResultItem[]>()

function cloneResult(item: SearchResultItem): SearchResultItem {
    return { ...item, dataItem: { ...item.dataItem } }
}

export function clearItemSearchCache() {
    itemCache.clear()
}

function writeItemCache(key: string, results: SearchResultItem[]) {
    if (itemCache.has(key)) {
        itemCache.delete(key)
    }
    itemCache.set(key, results)
    while (itemCache.size > ITEM_CACHE_LIMIT) {
        const oldest = itemCache.keys().next().value
        if (oldest === undefined) {
            break
        }
        itemCache.delete(oldest)
    }
}

function parseResultList(data: unknown): SearchResultItem[] {
    return Array.isArray(data) ? data.map(item => parseSearchResultItem(item)) : []
}

/** previous searches matching the text, shown in their own section above everything else */
export function createRecentStage(previousSearchKey?: string): SearchStage {
    const matching = (q: ParsedSearchQuery) => getMatchingPreviousSearches(q.text, previousSearchKey)
    return {
        key: 'recent',
        section: 'Recent',
        awaitForEnter: true,
        fixedSection: true,
        appliesTo: q => q.text.length > 0,
        peek: matching,
        run: matching
    }
}

export const pagesStage: SearchStage = {
    key: 'pages',
    section: 'Pages',
    awaitForEnter: true,
    appliesTo: q => !q.only && q.text.length >= 2,
    peek: q => matchPages(q.text).map(toPageSearchResultItem),
    run: q => matchPages(q.text).map(toPageSearchResultItem)
}

export const itemsStage: SearchStage = {
    key: 'items',
    section: 'Items',
    awaitForEnter: true,
    fixedSection: true,
    decorate: true,
    appliesTo: q => q.only !== 'player',
    peek: q => itemCache.get(q.normalized)?.map(cloneResult),
    // the request is deliberately not abortable: finished answers are cached so that backspacing is instant
    run: async q => {
        const response = await getApiItemSearchSearchVal(q.only === 'item' ? q.text : q.raw, { expectedResults: ITEM_RESULTS_EXPECTED })
        if (response.status < 200 || response.status >= 300) {
            throw new Error('item search failed with status ' + response.status)
        }
        const results = parseResultList(response.data)
        writeItemCache(q.normalized, results)
        return results.map(cloneResult)
    }
}

const POSSIBLE_PLAYER_NAME = /^[a-z0-9_]{1,16}$/i

export function isPossiblePlayerName(q: ParsedSearchQuery): boolean {
    return POSSIBLE_PLAYER_NAME.test(q.text)
}

async function fetchFullSearch(raw: string, update: boolean, signal: AbortSignal): Promise<SearchResultItem[]> {
    const response = await getApiSearchSearchVal(raw, update ? { update: true } : undefined, { signal })
    if (response.status < 200 || response.status >= 300) {
        throw new Error('search failed with status ' + response.status)
    }
    return parseResultList(response.data)
}

export const fullSearchStage: SearchStage = {
    key: 'full',
    section: 'Players',
    awaitForEnter: false,
    appliesTo: q => q.only !== 'item',
    run: async (q, signal) => {
        const results = await fetchFullSearch(q.raw, false, signal)
        if (results.some(r => r.type === 'player') || !isPossiblePlayerName(q)) {
            return results
        }
        // the capped answer had no players: second retrieve that waits longer for them
        try {
            const updated = await fetchFullSearch(q.raw, true, signal)
            const known = new Set(results.map(r => r.id))
            return [...results, ...updated.filter(r => !known.has(r.id))]
        } catch (e) {
            if (signal.aborted) {
                throw e
            }
            return results
        }
    }
}

/** wraps a consumer provided search function (props.searchFunction) so it keeps its one-call behaviour */
export function createLegacyStage(fn: (searchText: string) => Promise<SearchResultItem[]>): SearchStage {
    return {
        key: 'legacy',
        section: 'Items',
        awaitForEnter: true,
        fixedSection: true,
        decorate: true,
        appliesTo: () => true,
        run: async q => (await fn(q.raw)) ?? []
    }
}

export const GLOBAL_SEARCH_STAGES: SearchStage[] = [pagesStage, itemsStage, fullSearchStage]
/** for bars with onSearchresultClick: those consumers branch on item.type and must never get 'page' */
export const EMBEDDED_SEARCH_STAGES: SearchStage[] = [itemsStage, fullSearchStage]
