import { atobUnicode } from '../Base64Utils'
import { isClientSideRendering } from '../SSRUtils'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

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
    let itemFilterBase64 = getURLSearchParam('itemFilter')
    if (itemFilterBase64) {
        return parseItemFilter(itemFilterBase64)
    }

    let nonFilterParams = ['range', 'refId', 'conId']
    let searchParams = new URLSearchParams(window.location.search)
    let itemFilter: ItemFilter = {}
    searchParams.forEach((value, key) => {
        if (nonFilterParams.indexOf(key) === -1) {
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

export function setFilterIntoUrlParams(router: AppRouterInstance, pathname: string, itemFilter: ItemFilter) {
    if (isClientSideRendering()) {
        let searchParams = new URLSearchParams()
        Object.keys(itemFilter).forEach(key => {
            searchParams.set(key, itemFilter[key])
        })
        router.replace(`${pathname}?${searchParams.toString()}`)
        window.history.replaceState(null, '', `${pathname}?${searchParams.toString()}`)
    } else {
        console.error('Tried to update url query "itemFilter" during serverside rendering')
    }
}
