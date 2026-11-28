import { useEffect, useRef, useState } from 'react'
import { recordClientError } from '../utils/ClientErrorUtils'
import { isNewerBuildDeployed, isStaleChunkError, recoverFromStaleChunks } from '../utils/StaleChunkUtils'

/**
 * Records the error a React error boundary caught and, when it comes from a stale build, clears caches and reloads once.
 * Stale chunk errors are recognised by their text; any other error triggers a check whether a newer build is deployed.
 * Returns true while a reload is pending.
 */
export function useStaleBuildRecovery(error: unknown): boolean {
    const isStale = isStaleChunkError(error)
    const [isReloading, setIsReloading] = useState(isStale)
    const recoveryAttempted = useRef(false)

    useEffect(() => {
        // Record the error before a potential reload so it stays in the sessionStorage error log.
        recordClientError(error, 'react-boundary')

        // The ref keeps a re-run of this effect (strict mode) from hitting the reload guard set by the first run.
        if (recoveryAttempted.current) {
            return
        }
        recoveryAttempted.current = true

        if (isStale) {
            setIsReloading(recoverFromStaleChunks())
            return
        }
        isNewerBuildDeployed().then(newer => {
            if (newer && recoverFromStaleChunks()) {
                setIsReloading(true)
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    return isReloading
}
