'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getResultNavigationUrl } from '../utils/Search/FilterResultId'

/** prefetches the route of the selected search result (once per route) and exposes the same for hovered rows */
export function usePrefetchSearchResult(selected: SearchResultItem | undefined) {
    const router = useRouter()
    const prefetched = useRef(new Set<string>())

    const prefetch = useCallback(
        (item: SearchResultItem | undefined) => {
            const route = item ? getResultNavigationUrl(item) : undefined
            if (!route || prefetched.current.has(route)) {
                return
            }
            prefetched.current.add(route)
            router.prefetch(route)
        },
        [router]
    )

    useEffect(() => {
        prefetch(selected)
    }, [selected ? getResultNavigationUrl(selected) : undefined, prefetch])

    return prefetch
}
