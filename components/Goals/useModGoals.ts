import { getGetApiModGoalsQueryKey, useGetApiModGoals } from '../../api/_generated/skyApi'
import type { ModGoalsResponse } from '../../api/_generated/skyApi.schemas'
import { useGoogleToken } from '../../hooks/useGoogleToken'

/** The in-game goals of the logged in user; disabled (and empty) without a token. */
export function useModGoals() {
    const token = useGoogleToken()
    const query = useGetApiModGoals({
        fetch: token ? { headers: { GoogleToken: token } } : undefined,
        query: {
            enabled: !!token,
            queryKey: [...getGetApiModGoalsQueryKey(), token],
            retry: false
        }
    })
    const response = query.data
    const goals: ModGoalsResponse | null = token && response?.status === 200 ? response.data : null
    return { token, query, response, data: goals }
}
