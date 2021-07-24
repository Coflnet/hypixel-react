export function parseItemFilter(itemFilterBase64: string): ItemFilter {
    let itemFilter: any = JSON.parse(atob(itemFilterBase64));
    if (!itemFilter) {
        return {};
    }
    return itemFilter;
}
export function getItemFilterFromUrl(): ItemFilter {
    let itemFilterBase64 = getURLSearchParam("itemFilter");
    return itemFilterBase64 ? parseItemFilter(itemFilterBase64) : {};
}
export function setURLSearchParam(key: string, value: string): string {
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.set(key, value);
    return searchParams.toString()
}

export function getURLSearchParam(key: string): string | null {
    let searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(key);
}