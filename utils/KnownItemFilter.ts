import { cache } from 'react'
import { initAPI } from '../api/ApiHelper'
import { pickKnownFilterKeys } from './EmbedUtils'

/**
 * The filter options of an item. cache() dedupes them within one page render (metadata, page, filter normalisation);
 * React does not memoize outside a render, so in the Discord embed route every call fetches.
 */
export const getItemFilterOptions = cache((tag: string): Promise<FilterOptions[]> => initAPI(true).getFilters(tag))

/**
 * The URL filter reduced to the keys the item has filter options for, for embeds, descriptions and embed price requests.
 * Query params that are no filter (fbclid, utm_source, ...) are parsed as filters too, so they are dropped here.
 * Options are only fetched when there is a filter; without options (request failed) no filter is kept.
 */
export async function getKnownItemFilter(tag: string, filter: ItemFilter | null | undefined): Promise<ItemFilter | null> {
    if (!filter || Object.keys(filter).length === 0) {
        return null
    }
    try {
        const options = await getItemFilterOptions(tag)
        return pickKnownFilterKeys(
            filter,
            (options || []).map(option => option.name)
        )
    } catch (e) {
        console.error(`Error loading filter options of ${tag} for the embed. ${e instanceof Error ? e.message : JSON.stringify(e)}`)
        return null
    }
}
