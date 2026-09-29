import { useSyncExternalStore } from 'react'
import { getItemFilterFromUrl, ITEM_FILTER_URL_CHANGE_EVENT } from '../utils/Parser/URLParser'

// `next/navigation`'s `useSearchParams()` only updates on Next.js router navigations. The item
// filter is written to the URL via a raw `window.history.replaceState` call (see
// setFilterIntoUrlParams), which bypasses the Next.js router entirely - so useSearchParams would
// never observe it, and using it here would leave callers reading a stale filter. This hook instead
// subscribes directly to the URL (ITEM_FILTER_URL_CHANGE_EVENT for same-tab filter edits, `popstate`
// for back/forward navigation) via useSyncExternalStore, so it stays correct without needing a
// Suspense boundary either.
function subscribe(callback: () => void): () => void {
    window.addEventListener(ITEM_FILTER_URL_CHANGE_EVENT, callback)
    window.addEventListener('popstate', callback)
    return () => {
        window.removeEventListener(ITEM_FILTER_URL_CHANGE_EVENT, callback)
        window.removeEventListener('popstate', callback)
    }
}

// Serialized so useSyncExternalStore's Object.is comparison is stable across renders where nothing
// actually changed (getItemFilterFromUrl() otherwise returns a fresh object identity every call).
function getSnapshot(): string {
    return JSON.stringify(getItemFilterFromUrl())
}

function getServerSnapshot(): string {
    return '{}'
}

/** The current item filter read from the URL, reactively updated as it changes after load. */
export function useItemFilterFromUrl(): ItemFilter {
    const serialized = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    return JSON.parse(serialized)
}
