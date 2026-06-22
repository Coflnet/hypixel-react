import { atobUnicode } from '../Base64Utils'
import { isClientSideRendering } from '../SSRUtils'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

const NON_FILTER_PARAMS = ['range', 'refId', 'conId']
const LEGACY_ITEM_FILTER_PARAM = 'itemFilter'
const PET_LEVEL_FILTER = 'PetLevel'
const RARITY_FILTER = 'Rarity'
const ANY_FILTER_OPTION = 'Any'

function getSingleAllowedRarity(filterOptions: FilterOptions[] = []): string | null {
    const rarityFilter = filterOptions.find(filter => filter.name === RARITY_FILTER)
    if (!rarityFilter) {
        return null
    }

    const explicitRarityOptions = rarityFilter.options.filter(option => option && option !== ANY_FILTER_OPTION)
    return explicitRarityOptions.length === 1 ? explicitRarityOptions[0] : null
}

export function normalizeItemFilter(itemFilter: ItemFilter | null | undefined, filterOptions: FilterOptions[] = []): ItemFilter {
    if (!itemFilter) {
        return {}
    }

    const normalizedFilter = { ...itemFilter }
    if (normalizedFilter[PET_LEVEL_FILTER] && !normalizedFilter[RARITY_FILTER]) {
        const singleAllowedRarity = getSingleAllowedRarity(filterOptions)
        if (singleAllowedRarity) {
            normalizedFilter[RARITY_FILTER] = singleAllowedRarity
        }
    }

    return normalizedFilter
}

export function parseItemFilter(itemFilterBase64: string): ItemFilter {
    let itemFilter: any = JSON.parse(atobUnicode(itemFilterBase64))
    if (!itemFilter) {
        return {}
    }
    return itemFilter
}
export function getItemFilterFromUrl(): ItemFilter {
    if (!isClientSideRendering()) {
        return {}
    }

    // backwards compatibility for old itemFilter
    let itemFilterBase64 = getURLSearchParam(LEGACY_ITEM_FILTER_PARAM)
    if (itemFilterBase64) {
        return parseItemFilter(itemFilterBase64)
    }

    let searchParams = new URLSearchParams(window.location.search)
    let itemFilter: ItemFilter = {}
    searchParams.forEach((value, key) => {
        if (NON_FILTER_PARAMS.indexOf(key) === -1) {
            itemFilter[key] = value
        }
    })
    return itemFilter
}

export function getURLSearchParam(key: string): string | null {
    if (!isClientSideRendering()) {
        return null
    }
    let searchParams = new URLSearchParams(window.location.search)
    return searchParams.get(key)
}

export function setFilterIntoUrlParams(_router: AppRouterInstance, pathname: string, itemFilter: ItemFilter) {
    if (isClientSideRendering()) {
        let currentSearchParams = new URLSearchParams(window.location.search)
        let nextSearchParams = new URLSearchParams()

        NON_FILTER_PARAMS.forEach(key => {
            let value = currentSearchParams.get(key)
            if (value !== null) {
                nextSearchParams.set(key, value)
            }
        })

        Object.keys(itemFilter).forEach(key => {
            let value = itemFilter[key]
            if (value !== undefined && value !== null && value !== '') {
                nextSearchParams.set(key, value)
            }
        })

        nextSearchParams.delete(LEGACY_ITEM_FILTER_PARAM)

        let nextSearch = nextSearchParams.toString()
        if (nextSearch === currentSearchParams.toString()) {
            return
        }

        let nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname
        window.history.replaceState(null, '', nextUrl)
    } else {
        console.error('Tried to update url query "itemFilter" during serverside rendering')
    }
}
