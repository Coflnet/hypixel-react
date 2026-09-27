/**
 * Result of comparing an item's category against a currently selected `ItemCategory` filter value.
 * - 'included': the item's category matches the selected filter value
 * - 'excluded': the item's category is known but does not match the selected filter value
 * - 'unknown': the item's category could not be determined (missing/UNKNOWN)
 * - 'noSelection': the item's category is known, but no filter value is selected yet
 */
export type ItemCategoryMatchState = 'included' | 'excluded' | 'unknown' | 'noSelection'

function normalizeCategory(category?: string | null): string | undefined {
    if (!category) {
        return undefined
    }
    let trimmed = category.trim()
    if (!trimmed || trimmed.toUpperCase() === 'UNKNOWN') {
        return undefined
    }
    return trimmed.toUpperCase()
}

/**
 * Compares the category of a looked-up item against the category currently selected in an
 * `ItemCategory` filter, so the UI can tell a player whether that filter would actually match
 * the item they have in mind.
 *
 * @param selectedCategory the value currently selected in the `ItemCategory` filter (may be empty/undefined)
 * @param itemCategory the category returned for the looked-up item (may be null/undefined/'UNKNOWN')
 */
export function compareItemCategory(selectedCategory: string | undefined | null, itemCategory: string | undefined | null): ItemCategoryMatchState {
    let normalizedItemCategory = normalizeCategory(itemCategory)
    if (!normalizedItemCategory) {
        return 'unknown'
    }

    let normalizedSelectedCategory = normalizeCategory(selectedCategory)
    if (!normalizedSelectedCategory) {
        return 'noSelection'
    }

    return normalizedSelectedCategory === normalizedItemCategory ? 'included' : 'excluded'
}
