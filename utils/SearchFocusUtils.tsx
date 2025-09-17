/**
 * Utility functions to help manage search input focus behavior
 * to prevent unwanted focus stealing between different search components
 */

/**
 * Check if a search input with a specific ID is currently in use (has focus or contains text)
 * @param searchInputId The ID of the search input to check
 * @returns true if the search input is being used, false otherwise
 */
export function isSearchInputInUse(searchInputId: string): boolean {
    if (typeof document === 'undefined') {
        return false // Server-side rendering
    }
    
    const searchInput = document.getElementById(searchInputId) as HTMLInputElement
    if (!searchInput) {
        return false
    }
    
    // Check if the search input has focus
    const hasFocus = document.activeElement === searchInput
    
    // Check if the search input contains text
    const hasText = searchInput.value && searchInput.value.trim().length > 0
    
    return hasFocus || !!hasText
}

/**
 * Check if the global search bar is currently in use (has focus or contains text)
 * @returns true if the global search is being used, false otherwise
 */
export function isGlobalSearchInUse(): boolean {
    return isSearchInputInUse('search-bar')
}

/**
 * Check if any search input from a list of IDs is currently in use
 * @param searchInputIds Array of search input IDs to check
 * @returns true if any of the search inputs are being used, false otherwise
 */
export function isAnySearchInUse(searchInputIds: string[]): boolean {
    return searchInputIds.some(id => isSearchInputInUse(id))
}

/**
 * Check if any search input is currently in use. This includes:
 * - Global search bar (search-bar)
 * - Item search on player pages (search-bar-* pattern)
 * - Any input with search-related attributes
 * @returns true if any search input is being used, false otherwise
 */
export function isAnySearchInputInUse(): boolean {
    if (typeof document === 'undefined') {
        return false // Server-side rendering
    }
    
    // Get all input elements that might be search inputs
    const searchInputs = document.querySelectorAll([
        'input[type="text"].searchBar',
        'input[id="search-bar"]',
        'input[id^="search-bar-"]',
        'input[placeholder*="Search"]',
        'input[placeholder*="search"]'
    ].join(', '))
    
    for (let i = 0; i < searchInputs.length; i++) {
        const htmlInput = searchInputs[i] as HTMLInputElement
        const hasFocus = document.activeElement === htmlInput
        const hasText = htmlInput.value && htmlInput.value.trim().length > 0
        
        if (hasFocus || hasText) {
            return true
        }
    }
    
    return false
}
