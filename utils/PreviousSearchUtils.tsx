import { rehydrateFilterResult } from './Search/FilterResultId'

const PREVIOUS_SEARCHES_KEY = 'lastSearches'
const MAX_PREVIOUS_SEARCHES_TO_DISPLAY = 3
const MAX_PREVIOUS_SEARCHES_TO_STORE = 100

export function addClickedSearchResultToPreviousSearches(item: SearchResultItem, previousSearchKey?: string) {
    let previousSearches: SearchResultItem[] = getPreviousSearchesFromLocalStorage(previousSearchKey)

    let alreadyFoundIndex = previousSearches.findIndex(r => r.id === item.id)
    if (alreadyFoundIndex !== -1) {
        previousSearches.splice(alreadyFoundIndex, 1)
    }
    previousSearches.push(item)
    if (previousSearches.length > MAX_PREVIOUS_SEARCHES_TO_STORE) {
        previousSearches.shift()
    }
    localStorage.setItem(PREVIOUS_SEARCHES_KEY, JSON.stringify(previousSearches))
}

export function pinSearchResult(item: SearchResultItem, previousSearchKey?: string) {
    let previousSearches: SearchResultItem[] = getPreviousSearchesFromLocalStorage(previousSearchKey)
    let alreadyFoundIndex = previousSearches.findIndex(r => r.id === item.id)
    if (alreadyFoundIndex !== -1) {
        previousSearches[alreadyFoundIndex].pinned = true
    } else {
        previousSearches.push({
            ...item,
            pinned: true
        })
    }
    localStorage.setItem(PREVIOUS_SEARCHES_KEY, JSON.stringify(previousSearches))
}

export function unpinSearchResult(item: SearchResultItem, previousSearchKey?: string) {
    let previousSearches: SearchResultItem[] = getPreviousSearchesFromLocalStorage(previousSearchKey)
    let index = previousSearches.findIndex(r => r.id === item.id)
    if (index !== -1) {
        previousSearches[index].pinned = false
    } else {
        // item to remove was not found
        return
    }
    localStorage.setItem(PREVIOUS_SEARCHES_KEY, JSON.stringify(previousSearches))
}

const pinnedFirst = (a: SearchResultItem, b: SearchResultItem) => Number(!!b.pinned) - Number(!!a.pinned)

/** previous searches whose name contains the search text, pinned first */
export function getMatchingPreviousSearches(
    searchText: string,
    previousSearchKey?: string,
    max: number = MAX_PREVIOUS_SEARCHES_TO_DISPLAY
): SearchResultItem[] {
    const needle = searchText.toLowerCase()
    // the most recently used previous search is the last one stored
    const matches = getPreviousSearchesFromLocalStorage(previousSearchKey)
        .filter(prevSearch => (prevSearch.dataItem?.name ?? '').toLowerCase().includes(needle))
        .reverse()
    return matches.sort(pinnedFirst).slice(0, max)
}

/** marks results that are also previous searches (and carries over their pinned state) */
export function markPreviousSearches(searchResults: SearchResultItem[], previousSearchKey?: string): SearchResultItem[] {
    const previousSearches = getPreviousSearchesFromLocalStorage(previousSearchKey)
    return searchResults.map(result => {
        const previous = previousSearches.find(p => p.id === result.id)
        return previous ? { ...result, isPreviousSearch: true, pinned: previous.pinned } : result
    })
}

export function getFirstPreviousSearches(amount: number, previousSearchKey?: string) {
    let previousSearches: SearchResultItem[] = getPreviousSearchesFromLocalStorage(previousSearchKey)
    return previousSearches
        .sort((a, b) => {
            if (a.pinned) {
                return 1
            }
            if (b.pinned) {
                return -1
            }
            return 0
        })
        .slice(-amount)
        .reverse()
}

function getPreviousSearchesFromLocalStorage(keyForPinnedItems?: string) {
    let previousSearches: SearchResultItem[] = localStorage.getItem(PREVIOUS_SEARCHES_KEY) ? JSON.parse(localStorage.getItem(PREVIOUS_SEARCHES_KEY)!) : []
    return previousSearches
        .filter(prevSearch => prevSearch.previousSearchKey === keyForPinnedItems)
        .map(prevSearch => {
            prevSearch.isPreviousSearch = true
            return rehydrateFilterResult(prevSearch)
        })
}
