import { useRef } from 'react'
import { v4 as generateUUID } from 'uuid'

/** a random GUID; crypto.randomUUID only exists in secure contexts (https, localhost) and newer browsers */
function newRequestId(): string {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : generateUUID()
}

/**
 * The declaration request id (a GUID) of a checkout attempt. Retrying the same plan with the same provider is the same
 * attempt and keeps it (the payment backend moves the declaration to the new checkout); another plan or provider gets a
 * new one, and `renew` drops it after the server refused the declaration.
 */
export function useCheckoutRequestId() {
    const attempt = useRef<{ key: string; id: string } | null>(null)

    function requestIdFor(plan: string, provider: string): string {
        const key = `${plan}|${provider}`
        if (attempt.current?.key !== key) attempt.current = { key, id: newRequestId() }
        return attempt.current.id
    }

    function renew() {
        attempt.current = null
    }

    return { requestIdFor, renew }
}
