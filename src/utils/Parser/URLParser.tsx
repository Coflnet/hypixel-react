export function parseItemFilter(itemFilterBase64: string): ItemFilter | undefined {
    let itemFilter: any = JSON.parse(atob(itemFilterBase64));
    if (!itemFilter) {
        return undefined;
    }
    return {
        enchantment: itemFilter.enchantment,
        reforge: itemFilter.reforge
    }
}
export function getItemFilterFromUrl(query: URLSearchParams): ItemFilter | undefined {
    let itemFilterBase64 = query.get("itemFilter")
    if (itemFilterBase64) {
        return parseItemFilter(itemFilterBase64);
    }
}