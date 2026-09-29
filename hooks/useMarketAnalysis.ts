'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGetApiItemPriceItemTagAnalysis } from '../api/_generated/skyApi'
import type { AdvancedAnalysisResult } from '../api/_generated/skyApi.schemas'
import { useGoogleToken } from './useGoogleToken'

// Collapsing/re-expanding the section (or a same-args re-render) should reuse the cached response
// instead of refetching - react-query's own cache does this via staleTime, so neither this hook nor
// its callers need to hand-roll a cache/inFlight map the way an earlier version of this hook did.
const MARKET_ANALYSIS_STALE_TIME_MS = 5 * 60 * 1000

/**
 * `uniqueBuyers`/`uniqueSellers`/`topBuyers` - BEING ADDED TO THE BACKEND IN PARALLEL and not in the
 * generated client yet (the currently deployed backend doesn't send them either). Remove this type -
 * folding the three fields back into `AdvancedAnalysisResult` - once the backend ships and
 * `npm run generate_api` picks them up.
 */
export interface SoldAnalysisResult extends AdvancedAnalysisResult {
    uniqueBuyers?: number
    uniqueSellers?: number
    /** @nullable */
    topBuyers?: AdvancedAnalysisResult['topSellers']
}

/**
 * `/item/price/{tag}/analysis/live` - live BIN-listing analysis for the Market analysis section's
 * "Live market" block. The endpoint is deployed, but the generated orval client has not been
 * regenerated since, so it has no hook for it yet. This hand-written fetch function mirrors the
 * generated client's own style (hardcoded https://sky.coflnet.com/api base, best-effort JSON body
 * parsing - see `getApiItemPriceItemTagAnalysis`/`parseGeneratedResponseBody` in
 * api/_generated/skyApi.ts) so it is a drop-in swap for the generated
 * `useGetApiItemPriceItemTagAnalysisLive` hook after the next `npm run generate_api`. At that point,
 * delete this function and the interfaces below in favor of the generated hook + schema type.
 */
export interface LiveMarketPriceBucket {
    minPrice: number
    maxPrice: number
    avgPrice: number
    count: number
}

export interface LiveMarketTimeOnMarketBucket {
    minPrice: number
    maxPrice: number
    avgPrice: number
    avgSellTimeSeconds: number
    speedCategory: 'FRESH' | 'AGING' | 'STALE'
    sampleCount: number
}

export interface LiveMarketAnalysisResult {
    binCount: number
    auctionCount: number
    sellerCount: number
    lowestBin: number
    medianBin: number
    highestBin: number
    avgTimeOnMarketSeconds: number
    medianTimeOnMarketSeconds: number
    bucketRangeMax: number
    aboveRangeCount: number
    priceBuckets: LiveMarketPriceBucket[]
    timeOnMarketBuckets: LiveMarketTimeOnMarketBucket[]
}

const LIVE_ANALYSIS_BASE_URL = 'https://sky.coflnet.com/api'

async function fetchLiveMarketAnalysis(tag: string, itemFilter?: ItemFilter): Promise<LiveMarketAnalysisResult | null> {
    try {
        const params = new URLSearchParams()
        Object.entries(itemFilter || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, String(value))
            }
        })
        const query = params.toString()
        const res = await fetch(`${LIVE_ANALYSIS_BASE_URL}/item/price/${encodeURIComponent(tag)}/analysis/live${query ? `?${query}` : ''}`)
        // Any failure - an HTTP error, a network failure below, or an unparsable/empty body - means
        // "unavailable", never a thrown error: the
        // live block is best-effort and must never surface a toast or trigger a retry loop.
        if (!res.ok) {
            return null
        }
        const text = await res.text()
        if (!text) {
            return null
        }
        let data: unknown
        try {
            data = JSON.parse(text)
        } catch {
            return null
        }
        return data && typeof data === 'object' ? (data as LiveMarketAnalysisResult) : null
    } catch {
        return null
    }
}

export type SoldAnalysisStatus = 'loading' | 'success' | 'empty' | 'premium' | 'error'
export type LiveAnalysisStatus = 'loading' | 'success' | 'unavailable'

export interface UseMarketAnalysisArgs {
    tag: string
    itemFilter?: ItemFilter
    /** Selected analysis period in days (1 / 7 / 30 / 365). */
    days: number
    /** Only fetch once the section has been expanded at least once. */
    expanded: boolean
}

export interface UseMarketAnalysisResult {
    sold: {
        status: SoldAnalysisStatus
        data?: SoldAnalysisResult
        /**
         * Only meaningful while `status === 'premium'`: which action the gate should offer. True
         * ("Go to Premium") when a valid-looking token was sent and the backend refused for
         * insufficient premium; false (show the GoogleSignIn button) when there is no token at all,
         * or the backend told us the token itself is invalid/expired.
         */
        isSignedIn: boolean
        retry: () => void
    }
    live: {
        status: LiveAnalysisStatus
        data?: LiveMarketAnalysisResult
    }
}

/** Non-2xx sold-analysis response bodies carry a `slug` instead of the real `AdvancedAnalysisResult`. */
interface SoldErrorBody {
    slug?: string
}

/**
 * Fetches sold-auction analysis (react-query wrapping the generated client) and live-listing
 * analysis (react-query wrapping the hand-written fetch above) for the Market analysis section, in
 * parallel, once `expanded` is true. The backend is the single source of truth for premium gating:
 * this hook never pre-fetches premium status - it sends the request (with the Google token, for
 * ranges over 7 days) and classifies the response. MarketAnalysis.tsx stays a thin shell
 * (expanded/days state + this hook + the lazily loaded body) and MarketAnalysisBody.tsx stays purely
 * presentational.
 */
export function useMarketAnalysis({ tag, itemFilter, days, expanded }: UseMarketAnalysisArgs): UseMarketAnalysisResult {
    const token = useGoogleToken()

    const itemFilterKey = JSON.stringify(itemFilter || {})
    // The generated params type nests filter keys under `filters`, but its URL builder only
    // serializes the params object's own top-level keys - keep filter keys next to `days`, matching
    // how ApiHelper's getItemPrices/getRecentAuctions/etc. already work around the same limitation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const soldParams = useMemo(() => ({ days, ...(itemFilter || {}) }) as any, [days, itemFilterKey])

    // Ranges over 7 days need the Google token; free ranges stay anonymous. Without a token there is
    // nothing to gain from firing the request - the backend would only refuse it - so it's simply not
    // sent, and the gate is shown with the sign-in button instead.
    const requiresAuth = days > 7
    const soldAuthOptions = useMemo(() => {
        if (!requiresAuth || !token) return undefined
        return { headers: { GoogleToken: token, 'Content-Type': 'application/json' } } as RequestInit
    }, [requiresAuth, token])

    const soldQuery = useGetApiItemPriceItemTagAnalysis(tag, soldParams, {
        query: {
            enabled: expanded && (!requiresAuth || !!token),
            // Custom key: the auth header isn't part of `params`, but a signed-in vs anonymous
            // response for the same tag/days/filter must not share a cache entry, and picking up a
            // new token (e.g. right after login) must be treated as a new query rather than serving a
            // stale cached one.
            queryKey: ['marketAnalysisSold', tag, days, itemFilterKey, requiresAuth ? token : null],
            staleTime: MARKET_ANALYSIS_STALE_TIME_MS
        },
        fetch: soldAuthOptions
    })

    const liveQuery = useQuery({
        queryKey: ['marketAnalysisLive', tag, itemFilterKey],
        queryFn: () => fetchLiveMarketAnalysis(tag, itemFilter),
        enabled: expanded,
        staleTime: MARKET_ANALYSIS_STALE_TIME_MS,
        retry: false
    })

    // Classifies the sold response once: undefined for a 200 (nothing to report), 'invalidToken' for
    // an expired/rejected token (401, or slug `invalid_token`), 'premiumRequired' for a valid token
    // that just doesn't have enough premium (403, or slug `premium_required`), 'other' for any other
    // non-200 (a real error - never rendered as the "not enough sales" empty state).
    const soldAuthProblem = useMemo(() => {
        const status = soldQuery.data?.status as number | undefined
        if (status === undefined || status === 200) return undefined
        const data = soldQuery.data?.data as SoldErrorBody | undefined
        if (data?.slug === 'invalid_token' || status === 401) return 'invalidToken' as const
        if (data?.slug === 'premium_required' || status === 403) return 'premiumRequired' as const
        return 'other' as const
    }, [soldQuery.data])

    const soldStatus: SoldAnalysisStatus = useMemo(() => {
        if (requiresAuth && !token) return 'premium'
        if (soldQuery.isPending) return 'loading'
        if (soldQuery.isError) return 'error'
        if (soldAuthProblem === 'invalidToken' || soldAuthProblem === 'premiumRequired') return 'premium'
        if (soldAuthProblem === 'other') return 'error'
        const data = soldQuery.data?.data as SoldAnalysisResult | undefined
        if (!data || !data.totalSales) return 'empty'
        return 'success'
    }, [requiresAuth, token, soldQuery.isPending, soldQuery.isError, soldAuthProblem, soldQuery.data])

    const soldIsSignedIn = useMemo(() => {
        if (!requiresAuth) return true
        if (!token) return false
        return soldAuthProblem !== 'invalidToken'
    }, [requiresAuth, token, soldAuthProblem])

    const liveStatus: LiveAnalysisStatus = useMemo(() => {
        if (liveQuery.isPending) return 'loading'
        if (!liveQuery.data || !liveQuery.data.binCount) return 'unavailable'
        return 'success'
    }, [liveQuery.isPending, liveQuery.data])

    return {
        sold: {
            status: soldStatus,
            data: soldQuery.data?.data as SoldAnalysisResult | undefined,
            isSignedIn: soldIsSignedIn,
            retry: () => {
                soldQuery.refetch()
            }
        },
        live: {
            status: liveStatus,
            data: liveQuery.data ?? undefined
        }
    }
}
