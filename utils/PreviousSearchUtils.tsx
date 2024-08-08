const PREVIOUS_SEARCHES_KEY = 'lastSearches'
const MAX_PREVIOUS_SEARCHES_TO_DISPLAY = 3
const MAX_PREVIOUS_SEARCHES_TO_STORE = 100

export function addClickedSearchResultToPreviousSearches(item: SearchResultItem, previousSearchKey?: string) {
    let previousSearches: SearchResultItem[] = getPreviousSearchesFromLocalStorage(previousSearchKey)

    let alreadyFoundIndex = previousSearches.findIndex(r => r.dataItem.name === item.dataItem.name)
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
    let alreadyFoundIndex = previousSearches.findIndex(r => r.dataItem.name === item.dataItem.name)
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
    let index = previousSearches.findIndex(r => r.dataItem.name === item.dataItem.name)
    if (index !== -1) {
        previousSearches[index].pinned = false
    } else {
        // item to remove was not found
        return
    }
    localStorage.setItem(PREVIOUS_SEARCHES_KEY, JSON.stringify(previousSearches))
}

export function addPreviousSearchResultsToDisplay(searchText: string, searchResults: SearchResultItem[], previousSearchKey?: string) {
    let newSearchResults = [...searchResults]
    let previousSearches: SearchResultItem[] = getPreviousSearchesFromLocalStorage(previousSearchKey)
    let matches: SearchResultItem[] = []
    let matchingPreviousSearchesInResuls = 0

    previousSearches.forEach(prevSearch => {
        let alreadyFoundIndex = newSearchResults.findIndex(r => r.dataItem.name === prevSearch.dataItem.name)
        if (alreadyFoundIndex !== -1) {
            newSearchResults[alreadyFoundIndex] = prevSearch
            matchingPreviousSearchesInResuls++
        } else if (prevSearch.dataItem.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1) {
            matches.unshift(prevSearch)
        }
    })

    let pinnedSort = (a, b) => {
        if (a.pinned) {
            return -1
        }
        if (b.pinned) {
            return 1
        }
        return 0
    }

    newSearchResults.sort(pinnedSort)
    matches.sort(pinnedSort).slice(0, MAX_PREVIOUS_SEARCHES_TO_DISPLAY - matchingPreviousSearchesInResuls)

    if (MAX_PREVIOUS_SEARCHES_TO_DISPLAY <= matchingPreviousSearchesInResuls) {
        return newSearchResults
    }

    return [...matches, ...newSearchResults]
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
            return prevSearch
        })
}
