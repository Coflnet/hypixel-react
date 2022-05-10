import { atobUnicode } from '../Base64Utils'
import { isClientSideRendering } from '../SSRUtils'

export function parseItemFilter(itemFilterBase64: string): ItemFilter {
    let itemFilter: any = JSON.parse(atobUnicode(itemFilterBase64))
    if (!itemFilter) {
        return {}
    }
    return itemFilter
}
export function getItemFilterFromUrl(): ItemFilter {
    let itemFilterBase64 = getURLSearchParam('itemFilter')
    return itemFilterBase64 ? parseItemFilter(itemFilterBase64) : {}
}

export function getURLSearchParam(key: string): string | null {
    if (!isClientSideRendering()) {
        return null
    }
    let searchParams = new URLSearchParams(window.location.search)
    return searchParams.get(key)
}
