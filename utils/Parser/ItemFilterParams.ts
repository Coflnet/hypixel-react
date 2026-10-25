/** query params of an item page that are kept in the URL when the filter changes but are not filters */
export const NON_FILTER_PARAMS = ['range', 'refId', 'conId', 'tags', 'armorSet', 'orderBy', 'q', 'perTagLimit', 'categories', 'page', 'itemNameContains']

/** params never treated as a filter; `apply` was sent by older builds for flat filter links and is rejected by the backend */
export const IGNORED_FILTER_PARAMS = [...NON_FILTER_PARAMS, 'apply']

/** converts flat query entries into an item filter, skipping the params that are not filters */
export function itemFilterFromEntries(entries: [string, any][]): ItemFilter {
    let itemFilter: ItemFilter = {}
    for (const [key, value] of entries) {
        if (IGNORED_FILTER_PARAMS.indexOf(key) === -1) {
            itemFilter[key] = value
        }
    }
    return itemFilter
}
