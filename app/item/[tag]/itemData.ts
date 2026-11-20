import type { AveragePrice, ItemMetadataElement, SkyblockItem } from '../../../api/_generated/skyApi.schemas'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { convertTagToName } from '../../../utils/Formatter'
import api, { initAPI } from '../../../api/ApiHelper'
import { atobUnicode } from '../../../utils/Base64Utils'
import { hasFlag } from '../../../components/FilterElement/FilterType'
import { getCachedItemInfo, ItemFlagsNumeric, hasItemFlag, parseFlags } from '../../../utils/ItemsCache'
import type { CachedItemInfo } from '../../../utils/ItemsCache'
import { normalizeItemFilter } from '../../../utils/Parser/URLParser'
import { itemFilterFromEntries } from '../../../utils/Parser/ItemFilterParams'
import { getResultNavigationUrl } from '../../../utils/Search/FilterResultId'
import { getCustomItemRedirectPath } from '../../../utils/ItemRedirectUtils'
import { getItemComponentEmbed } from '../../../utils/DiscordPageEmbeds'
import { getItemFilterOptions, getKnownItemFilter } from '../../../utils/KnownItemFilter'
import { getEmbedItemSearchParams, isValidItemRange, toSearchString, type SearchParamsObject } from '../../../utils/DiscordEmbedLink'
import type { DiscordEmbedPayload } from '../../../utils/DiscordComponentEmbed'

// Data of the item price page, shared by the page, its metadata and its Discord embed route

export interface ItemPageData {
    item: Omit<Partial<SkyblockItem>, 'flags'> & { itemName?: string | null; flags?: number | string }
    prices: (AveragePrice | BazaarPrice)[]
    range: string | null
    filter: ItemFilter | null
    itemFlags: CachedItemInfo | null
    /** prices could not be loaded; the page still renders, but an embed must not show an item without prices */
    pricesLoadError?: boolean
}

export function getItemDisplayName(tag: string, item: ItemPageData['item'], itemFlags: CachedItemInfo | null): string {
    return item.name || item.itemName || itemFlags?.name || convertTagToName(tag)
}

// same decision as the page, which also picked the fetched price type by it
export function isBazaarItemData(item: ItemPageData['item'], itemFlags: CachedItemInfo | null): boolean {
    return itemFlags?.isBazaar ?? hasFlag(Number(item.flags), 1)
}

/**
 * The Discord embed of the item page, built from the range and the known filter keys only (no fbclid & co).
 * None when the prices failed: Discord would keep showing the item without them.
 */
export async function getItemPageEmbed(tag: string, searchParams: SearchParamsObject): Promise<DiscordEmbedPayload | null> {
    const knownFilter = await getKnownItemFilter(tag, getItemFilterFromUrl(searchParams))
    const embedParams = getEmbedItemSearchParams(searchParams, knownFilter)
    const data = await getItemData(embedParams, { tag })
    if (data.pricesLoadError) {
        return null
    }
    return getItemComponentEmbed({
        tag,
        name: getItemDisplayName(tag, data.item, data.itemFlags),
        iconUrl: data.item.iconUrl || api.getItemImageUrl({ tag } as Item),
        tier: typeof data.item.tier === 'string' ? data.item.tier : undefined,
        isBazaar: isBazaarItemData(data.item, data.itemFlags),
        prices: data.prices,
        range: data.range,
        filter: data.filter,
        search: toSearchString(embedParams)
    })
}

// cache() needs primitive arguments to share the item data between generateMetadata and the page
const getCachedItemData = cache((tag: string, searchParamsKey: string) => loadItemData(JSON.parse(searchParamsKey), { tag }))

export function getItemData(searchParams, params): Promise<ItemPageData> {
    return getCachedItemData(params.tag as string, JSON.stringify(searchParams ?? {}))
}

async function loadItemData(searchParams, params): Promise<ItemPageData> {
    const range = isValidItemRange(searchParams.range) ? searchParams.range : 'day'
    const tag = params.tag as string
    const customItemRedirect = getCustomItemRedirectPath(tag, searchParams)
    if (customItemRedirect) redirect(customItemRedirect)

    const api = initAPI(true)
    const itemFilter = await normalizeServerItemFilter(tag, getItemFilterFromUrl(searchParams))
    try {
        const cachedInfo = await getCachedItemInfo(tag)
        const isBazaarFromCache = cachedInfo?.isBazaar ?? null

        if (isBazaarFromCache !== null && range !== 'active') {
            const [itemDetails, prices] = await Promise.all([
                api.getItemDetails(tag) as Promise<SkyblockItem>,
                fetchPricesOrNull(api, tag, range, isBazaarFromCache, itemFilter)
            ])

            if (!itemDetails || !itemDetails.name) {
                const searchResults = await api.itemSearch(tag)
                if (searchResults && searchResults[0] && searchResults[0].id !== tag) {
                    redirect(getResultNavigationUrl(searchResults[0]))
                } else {
                    return {
                        item: { tag: tag, itemName: cachedInfo?.name, flags: cachedInfo?.flags },
                        prices: [],
                        range: null,
                        filter: itemFilter || null,
                        itemFlags: cachedInfo
                    }
                }
            }

            return {
                item: itemDetails,
                prices: prices || [],
                range: range || null,
                filter: itemFilter ? itemFilter : null,
                itemFlags: cachedInfo,
                pricesLoadError: prices === null
            }
        }

        const itemDetails = (await api.getItemDetails(tag)) as SkyblockItem

        if (!itemDetails || !itemDetails.name) {
            const searchResults = await api.itemSearch(tag)
            if (searchResults && searchResults[0] && searchResults[0].id !== tag) {
                redirect(getResultNavigationUrl(searchResults[0]))
            } else {
                return {
                    item: { tag: tag, itemName: cachedInfo?.name, flags: cachedInfo?.flags },
                    prices: [],
                    range: range || null,
                    filter: itemFilter || null,
                    itemFlags: cachedInfo
                }
            }
        }

        // Build item flags from item details when not available from cache.
        // This ensures items not in the /api/items cache still get correct
        // bazaar/auction/tradeable flags (e.g. BOOK_OF_STATS).
        let itemFlags = cachedInfo
        if (!itemFlags && itemDetails.flags !== undefined) {
            const numericFlags = parseFlags(itemDetails.flags)
            itemFlags = {
                tag,
                name: itemDetails.name || null,
                isBazaar: hasItemFlag(numericFlags, ItemFlagsNumeric.BAZAAR),
                isTradeable: hasItemFlag(numericFlags, ItemFlagsNumeric.TRADEABLE),
                isAuction: hasItemFlag(numericFlags, ItemFlagsNumeric.AUCTION),
                isCraftable: hasItemFlag(numericFlags, ItemFlagsNumeric.CRAFT),
                isMuseum: hasItemFlag(numericFlags, ItemFlagsNumeric.MUSEUM),
                isFireSale: hasItemFlag(numericFlags, ItemFlagsNumeric.FIRESALE),
                flags: numericFlags
            }
        }

        if (range === 'active') {
            return {
                item: itemDetails,
                prices: [],
                range: range || null,
                filter: itemFilter || null,
                itemFlags
            }
        }

        const isBazaar = hasFlag(Number(itemDetails.flags), 1)
        const prices = await fetchPricesOrNull(api, tag, range, isBazaar, itemFilter)

        return {
            item: itemDetails,
            prices: prices || [],
            range: range || null,
            filter: itemFilter ? itemFilter : null,
            itemFlags,
            pricesLoadError: prices === null
        }
    } catch (error) {
        if (isRedirectError(error)) throw error

        console.error('Error fetching item data:', error instanceof Error ? error.message : error)

        let cachedInfo = await getCachedItemInfo(tag).catch(() => null)

        if (!cachedInfo) {
            try {
                const apiBase = process.env.API_ENDPOINT || 'https://sky.coflnet.com/api'
                const itemsResponse = await fetch(`${apiBase}/items`, { next: { revalidate: 3600 } })
                const items: ItemMetadataElement[] = await itemsResponse.json()
                const item = items.find(i => i.tag === tag)
                if (item) {
                    const numericFlags = parseFlags(item.flags)
                    cachedInfo = {
                        tag,
                        name: item.name || null,
                        isBazaar: hasItemFlag(numericFlags, ItemFlagsNumeric.BAZAAR),
                        isTradeable: hasItemFlag(numericFlags, ItemFlagsNumeric.TRADEABLE),
                        isAuction: hasItemFlag(numericFlags, ItemFlagsNumeric.AUCTION),
                        isCraftable: hasItemFlag(numericFlags, ItemFlagsNumeric.CRAFT),
                        isMuseum: hasItemFlag(numericFlags, ItemFlagsNumeric.MUSEUM),
                        isFireSale: hasItemFlag(numericFlags, ItemFlagsNumeric.FIRESALE),
                        flags: numericFlags
                    }
                }
            } catch (e) {
                console.error('Failed direct API fallback:', e)
            }
        }

        return {
            item: { tag: tag, itemName: cachedInfo?.name, flags: cachedInfo?.flags },
            prices: [],
            range: range || null,
            filter: itemFilter || null,
            itemFlags: cachedInfo,
            pricesLoadError: true
        }
    }
}

// null when the prices could not be loaded (an unknown filter key like fbclid also makes the price service fail)
function fetchPricesOrNull(api: API, tag: string, range: string, isBazaar: boolean, itemFilter: ItemFilter | null) {
    return fetchPrices(api, tag, range, isBazaar, itemFilter).catch(e => {
        logPriceFetchError(tag, range, itemFilter, e)
        return null
    })
}

async function normalizeServerItemFilter(tag: string, itemFilter: ItemFilter | null): Promise<ItemFilter | null> {
    if (!itemFilter || !itemFilter.PetLevel || itemFilter.Rarity) {
        return itemFilter
    }

    try {
        const filterOptions = await getItemFilterOptions(tag)
        const normalizedFilter = normalizeItemFilter(itemFilter, filterOptions)
        return Object.keys(normalizedFilter).length > 0 ? normalizedFilter : null
    } catch (error) {
        console.error('Error normalizing item filter:', error instanceof Error ? error.message : error)
        return itemFilter
    }
}

function logPriceFetchError(tag: string, range: string, itemFilter: ItemFilter | null, error: unknown) {
    console.error('Error fetching item prices:', {
        tag,
        range,
        itemFilter,
        error: error instanceof Error ? error.message : error
    })
}

/**
 * Fetch prices based on item type (bazaar or auction house)
 */
async function fetchPrices(api: API, tag: string, range: string, isBazaar: boolean, itemFilter: ItemFilter | null): Promise<AveragePrice[] | BazaarPrice[]> {
    if (isBazaar) {
        if (range === 'full') {
            return api.getBazaarPricesByRange(tag, new Date(0), new Date())
        } else if (range === 'month') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return api.getBazaarPricesByRange(tag, monthAgo, new Date())
        } else {
            return api.getBazaarPrices(tag, range as DateRange)
        }
    } else {
        // initAPI(true) returns the generated raw prices instead of the client-side parsed dates.
        return (await api.getItemPrices(tag, range as DateRange, itemFilter ? itemFilter : {})) as unknown as AveragePrice[]
    }
}

function getItemFilterFromUrl(searchParams) {
    const itemFilterBase64 = searchParams.itemFilter
    if (itemFilterBase64) {
        try {
            return JSON.parse(atobUnicode(itemFilterBase64))
        } catch (e) {
            console.error('Error parsing item filter from URL: ' + e)
            return null
        }
    }

    const itemFilter = itemFilterFromEntries(Object.entries(searchParams))
    return Object.keys(itemFilter).length > 0 ? itemFilter : null
}
