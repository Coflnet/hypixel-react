import { useSyncExternalStore } from 'react'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'
import { getGoogleToken } from '../api/NotificationApi'

// GoogleSignIn only ever writes the token into storage and dispatches CUSTOM_EVENTS.GOOGLE_LOGIN
// (see completeLogin in components/GoogleSignIn/GoogleSignIn.tsx) - there is no matching "logged out"
// event, so that's the one signal this hook needs to resubscribe to for the token to go from
// missing/expired to present. useSyncExternalStore re-runs getSnapshot on every dispatch, so callers
// depending on the token (e.g. useMarketAnalysis) pick it up and refetch without an inline useEffect.
function subscribe(callback: () => void): () => void {
    document.addEventListener(CUSTOM_EVENTS.GOOGLE_LOGIN, callback)
    return () => {
        document.removeEventListener(CUSTOM_EVENTS.GOOGLE_LOGIN, callback)
    }
}

function getSnapshot(): string | null {
    return getGoogleToken()
}

function getServerSnapshot(): string | null {
    return null
}

/** The current Google auth token (session/local storage), reactively updated after a login completes. */
export function useGoogleToken(): string | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
