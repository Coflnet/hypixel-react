import { parseItemFilter } from '../Parser/URLParser'

const LEGACY_ITEM_FILTER_KEY = 'itemFilter'

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value.replace(/\+/g, ' '))
    } catch {
        return value
    }
}

/**
 * Splits a search result id into the item tag and the filter it carries.
 * Handles the flat form (`TAG?name=value&name2=value2`) and the legacy `TAG?itemFilter=<base64 JSON>`.
 */
export function splitSearchResultId(id: string): { tag: string; filter: ItemFilter | null } {
    let questionMark = id.indexOf('?')
    if (questionMark === -1) {
        return { tag: id, filter: null }
    }
    let tag = id.substring(0, questionMark)
    let query = id.substring(questionMark + 1)
    let pairs = query.split('&').filter(p => p.length > 0)

    let legacy = pairs.find(p => p === LEGACY_ITEM_FILTER_KEY || p.startsWith(LEGACY_ITEM_FILTER_KEY + '='))
    if (legacy) {
        // take the raw value: URLSearchParams would turn a base64 '+' into a space
        let raw = legacy.substring(LEGACY_ITEM_FILTER_KEY.length + 1)
        let candidates = [raw]
        try {
            let decoded = decodeURIComponent(raw)
            if (decoded !== raw) {
                candidates.unshift(decoded)
            }
        } catch {
            // keep raw
        }
        for (let candidate of candidates) {
            try {
                let filter = parseItemFilter(candidate)
                return { tag, filter: Object.keys(filter).length > 0 ? filter : null }
            } catch {
                // try next candidate
            }
        }
        return { tag, filter: null }
    }

    let filter: ItemFilter = {}
    for (let pair of pairs) {
        let eq = pair.indexOf('=')
        let key = safeDecode(eq === -1 ? pair : pair.substring(0, eq))
        let value = eq === -1 ? '' : safeDecode(pair.substring(eq + 1))
        if (key) {
            filter[key] = value
        }
    }
    return { tag, filter: Object.keys(filter).length > 0 ? filter : null }
}

export function toFilterSearchParams(filter: ItemFilter): URLSearchParams {
    let params = new URLSearchParams()
    Object.keys(filter).forEach(key => params.set(key, String(filter[key])))
    return params
}

function titleCase(name: string): string {
    return name
        .split('_')
        .filter(w => w.length > 0)
        .map(w => w.charAt(0).toUpperCase() + w.substring(1))
        .join(' ')
}

/** Human readable form of a filter, e.g. `Sharpness 7, Heroic`-style text */
export function describeFilter(filter: ItemFilter): string {
    return Object.keys(filter)
        .map(key => {
            let name = /^[a-z0-9_]+$/.test(key) ? titleCase(key) : key
            let value = String(filter[key])
            let lower = value.toLowerCase()
            if (lower === 'true' || lower === 'yes') {
                return name
            }
            if (value === '>0') {
                return name + ' any'
            }
            return value ? name + ' ' + value : name
        })
        .join(', ')
}

/** Item name of a picked search result without the " · <filter description>" suffix of filter results */
export function getPickedItemName(result: SearchResultItem, filter: ItemFilter | null): string {
    let name = result.dataItem.name
    if (!filter) {
        return name
    }
    let separator = name.indexOf(' · ')
    return separator === -1 ? name : name.substring(0, separator)
}

/** Route, URL params and description of a `filter` search result; legacy ids come out as flat params too */
export function getFilterResultTarget(id: string): { route: string; urlSearchParams: URLSearchParams; description?: string } {
    let { tag, filter } = splitSearchResultId(id)
    return {
        route: '/item/' + tag,
        urlSearchParams: toFilterSearchParams(filter || {}),
        description: filter ? describeFilter(filter) : undefined
    }
}

/** title of a filter result row: the item name without the filter text, which the description line shows */
export function getFilterResultTitle(result: SearchResultItem): string {
    if (result.type !== 'filter' || !result.description) {
        return result.dataItem.name
    }
    let separator = result.dataItem.name.indexOf(' · ')
    return separator === -1 ? result.dataItem.name : result.dataItem.name.substring(0, separator)
}

/**
 * The URL a search result opens. Filter results are rebuilt from their id: a result read back from
 * localStorage has lost its `URLSearchParams` (JSON turns it into `{}`), so `urlSearchParams` is never trusted.
 */
export function getResultNavigationUrl(item: Pick<SearchResultItem, 'id' | 'type' | 'route'>): string {
    if (item.type !== 'filter') {
        return item.route
    }
    let target = getFilterResultTarget(item.id)
    let query = target.urlSearchParams.toString()
    return query ? `${target.route}?${query}` : target.route
}

/** restores route, urlSearchParams and description of a filter result that went through JSON (e.g. localStorage) */
export function rehydrateFilterResult<T extends SearchResultItem>(item: T): T {
    if (item.type !== 'filter' || typeof item.id !== 'string') {
        return item
    }
    return { ...item, ...getFilterResultTarget(item.id) }
}

/** the item and the filter a picked search result stands for; the filter is null for a plain item result */
export function pickSearchResult(result: SearchResultItem): { item: { tag: string; name: string; iconUrl: string }; filter: ItemFilter | null } {
    let { tag, filter } = splitSearchResultId(result.id)
    return { item: { tag, name: getPickedItemName(result, filter), iconUrl: result.dataItem.iconUrl }, filter }
}

/** picked filter values override the same keys of the existing filter, other keys are kept */
export function mergePickedFilter(existing: ItemFilter | undefined, picked: ItemFilter | null): ItemFilter | undefined {
    return picked ? { ...existing, ...picked } : existing
}
