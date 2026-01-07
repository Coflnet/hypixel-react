import { unstable_cache } from 'next/cache'
import { getApiItems } from '../api/_generated/skyApi'
import type { ItemMetadataElement, ItemFlags } from '../api/_generated/skyApi.schemas'

/**
 * Item flags enum (matches backend)
 * NONE = 0
 * BAZAAR = 1
 * TRADEABLE = 2
 * AUCTION = 4
 * CRAFT = 8
 * GLOWING = 16
 * MUSEUM = 32
 * FIRESALE = 64
 */
export const ItemFlagsNumeric = {
    NONE: 0,
    BAZAAR: 1,
    TRADEABLE: 2,
    AUCTION: 4,
    CRAFT: 8,
    GLOWING: 16,
    MUSEUM: 32,
    FIRESALE: 64
} as const

export type ItemFlagsNumericType = (typeof ItemFlagsNumeric)[keyof typeof ItemFlagsNumeric]

/**
 * Check if a flag is set (works with both numeric and string flags)
 */
export function hasItemFlag(flags: number | string | ItemFlags | undefined | null, flag: ItemFlagsNumericType): boolean {
    if (flags === undefined || flags === null) return false

    if (typeof flags === 'number') {
        return (flags & flag) === flag
    }

    if (typeof flags === 'string') {
        const flagMap: Record<number, string> = {
            [ItemFlagsNumeric.BAZAAR]: 'BAZAAR',
            [ItemFlagsNumeric.TRADEABLE]: 'TRADEABLE',
            [ItemFlagsNumeric.AUCTION]: 'AUCTION',
            [ItemFlagsNumeric.CRAFT]: 'CRAFT',
            [ItemFlagsNumeric.GLOWING]: 'GLOWING',
            [ItemFlagsNumeric.MUSEUM]: 'MUSEUM',
            [ItemFlagsNumeric.FIRESALE]: 'FIRESALE'
        }
        return flags.includes(flagMap[flag] || '')
    }

    return false
}

export interface CachedItemInfo {
    tag: string
    name: string | null
    isBazaar: boolean
    isTradeable: boolean
    isAuction: boolean
    isCraftable: boolean
    isMuseum: boolean
    isFireSale: boolean
    flags: number | string
}

/**
 * Cached function to get all items metadata
 * Revalidates every hour (3600 seconds) - same as the API endpoint update frequency
 * Returns a Record instead of Map to avoid serialization issues with Next.js cache
 */
export const getCachedItems = unstable_cache(
    async (): Promise<Record<string, CachedItemInfo>> => {
        try {
            const response = await getApiItems({
                next: { revalidate: 3600 }
            } as any)

            const itemsRecord: Record<string, CachedItemInfo> = {}

            if (response.data && Array.isArray(response.data)) {
                for (const item of response.data) {
                    if (!item.tag) continue

                    const flags = item.flags
                    const numericFlags = parseFlags(flags)

                    itemsRecord[item.tag] = {
                        tag: item.tag,
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
            }

            return itemsRecord
        } catch (error) {
            console.error('Failed to fetch items cache:', error)
            return {}
        }
    },
    ['items-metadata-cache'],
    {
        revalidate: 3600, // 1 hour
        tags: ['items-metadata']
    }
)

/**
 * Parse flags to numeric value for consistent comparison
 * Handles both string flags (single "BAZAAR" or combined numeric) and numeric flags
 * When multiple flags are set, the API returns a number; when only one flag is set, it may return a string
 */
export function parseFlags(flags: ItemFlags | string | number | undefined | null): number {
    if (flags === undefined || flags === null) return 0

    if (typeof flags === 'number') return flags

    if (typeof flags === 'string') {
        const flagNames = flags.split(',').map(f => f.trim().toUpperCase())
        let result = 0
        for (const name of flagNames) {
            if (name in ItemFlagsNumeric) {
                result |= ItemFlagsNumeric[name as keyof typeof ItemFlagsNumeric]
            }
        }
        return result
    }

    return 0
}

/**
 * Get cached item info by tag
 * Returns null if item not found in cache
 */
export async function getCachedItemInfo(tag: string): Promise<CachedItemInfo | null> {
    try {
        const itemsRecord = await getCachedItems()
        return itemsRecord[tag] || null
    } catch (error) {
        console.error('Error getting cached item info:', error)
        return null
    }
}

/**
 * Check if an item is a bazaar item using the cached items list
 * This is much faster than fetching item details individually
 */
export async function isItemBazaar(tag: string): Promise<boolean> {
    const itemInfo = await getCachedItemInfo(tag)
    return itemInfo?.isBazaar ?? false
}
