import { useMemo, useSyncExternalStore } from 'react'
import { useGetApiTasksSlugSetupsDetails } from '../api/_generated/skyApi'
import { normalizeSetups, type PublicTaskGearSetups } from '../api/publicTaskApi'
import { classifyPremiumResponse, type PremiumResponseProblem } from '../utils/premiumResponse'
import { useGoogleToken } from './useGoogleToken'

const SETUP_DETAILS_STALE_TIME_MS = 2 * 60 * 1000

/** pending: not mounted yet (the server snapshot has no token), notNeeded: nothing is locked. */
export type TaskSetupDetailsStatus = 'pending' | 'notNeeded' | 'signedOut' | 'loading' | 'success' | 'invalidToken' | 'premiumRequired' | 'error'

export interface TaskSetupDetails {
    status: TaskSetupDetailsStatus
    /** A 200 may reveal authorized setups while higher tiers remain locked. */
    data?: PublicTaskGearSetups
}

const subscribeNever = () => () => {}

/** False during the server render and hydration, true afterwards, without an effect. */
function useIsMounted(): boolean {
    return useSyncExternalStore(subscribeNever, () => true, () => false)
}

function toStatus(problem: PremiumResponseProblem | undefined): TaskSetupDetailsStatus {
    return problem === 'other' ? 'error' : (problem ?? 'success')
}

/**
 * Premium numbers of a task's gear setups. The request is only sent with a token (the backend decides about premium),
 * the token is part of the query key so a login or a changed account never serves another user's cached response.
 */
export function useTaskSetupDetails(slug: string, needed: boolean): TaskSetupDetails {
    const token = useGoogleToken()
    const mounted = useIsMounted()
    const fetchOptions = useMemo(() => (token ? ({ headers: { GoogleToken: token } } as RequestInit) : undefined), [token])
    const query = useGetApiTasksSlugSetupsDetails(encodeURIComponent(slug), {
        query: {
            queryKey: ['taskSetupDetails', slug, token],
            enabled: needed && !!token,
            staleTime: SETUP_DETAILS_STALE_TIME_MS,
            retry: false
        },
        fetch: fetchOptions
    })

    return useMemo<TaskSetupDetails>(() => {
        if (!mounted) return { status: 'pending' }
        if (!needed) return { status: 'notNeeded' }
        if (!token) return { status: 'signedOut' }
        if (query.isPending) return { status: 'loading' }
        if (query.isError || !query.data) return { status: 'error' }
        const status = toStatus(classifyPremiumResponse(query.data.status, query.data.data))
        if (status !== 'success') return { status }
        const data = normalizeSetups(query.data.data, { details: true })
        if (!data) return { status: 'error' }
        return { status: data.locked ? 'premiumRequired' : status, data }
    }, [mounted, needed, token, query.isPending, query.isError, query.data])
}
