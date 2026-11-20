'use client'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getApiPremiumSubscriptionExternalIdTerms, getGetApiPremiumSubscriptionExternalIdTermsQueryKey } from '../api/_generated/skyApi'
import type { TermOptions } from '../utils/SubscriptionTermSwitch'
import { useGoogleToken } from './useGoogleToken'

const PROCESSING_POLL_MS = 5_000
/** a switch waiting for the payment or approval: the provider may confirm it any moment (e.g. back from ?switched=) */
const PENDING_POLL_MS = 15_000
const STALE_MS = 60_000

async function loadTermOptions(externalId: string, token: string): Promise<TermOptions> {
    const response = await getApiPremiumSubscriptionExternalIdTerms(externalId, { headers: { GoogleToken: token } })
    if (response.status !== 200) throw new Error(`The term options answered ${response.status}`)
    return response.data as TermOptions
}

function getPollInterval(options: TermOptions | undefined): number | false {
    if (!options?.pending) return false
    return options.pending.status === 'processing' ? PROCESSING_POLL_MS : PENDING_POLL_MS
}

export function getTermOptionsKey(externalId: string) {
    return getGetApiPremiumSubscriptionExternalIdTermsQueryKey(externalId)
}

/**
 * The longer terms a subscription can switch to (GET /api/premium/subscription/{id}/terms), shared by the row and its dialog.
 * While a switch is pending it is polled until the payment is confirmed.
 */
export function useTermSwitchOptions(externalId: string, enabled: boolean) {
    const token = useGoogleToken()
    return useQuery({
        queryKey: getTermOptionsKey(externalId),
        queryFn: () => loadTermOptions(externalId, token!),
        enabled: enabled && !!token,
        staleTime: STALE_MS,
        retry: false,
        refetchInterval: query => getPollInterval(query.state.data)
    })
}

/**
 * Whether a switch that was processing has finished since this component saw it; `onSettled` runs once at that moment (the
 * subscription list then shows the new term).
 */
export function useProcessingSettled(processing: boolean, onSettled: () => void): boolean {
    const [seenProcessing, setSeenProcessing] = useState(processing)
    const latest = useRef(onSettled)
    latest.current = onSettled
    if (processing && !seenProcessing) setSeenProcessing(true)
    const settled = seenProcessing && !processing
    useEffect(() => {
        if (settled) latest.current()
    }, [settled])
    return settled
}
