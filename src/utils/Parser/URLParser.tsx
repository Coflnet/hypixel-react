export function parseItemFilter(itemFilterBase64: string): ItemFilter {
    let itemFilter: any = JSON.parse(atob(itemFilterBase64));
    if (!itemFilter) {
        return {};
    }
    return itemFilter;
}
export function getItemFilterFromUrl(query: URLSearchParams): ItemFilter {
    let itemFilterBase64 = query.get("itemFilter")
    return itemFilterBase64 ? parseItemFilter(itemFilterBase64) : {};
}