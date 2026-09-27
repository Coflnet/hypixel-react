'use client'
import { useEffect, useRef, useState } from 'react'
import { getHeadMetadata } from '../utils/SSRUtils'
import { Error } from '../components/Error/Error'
import { recordClientError } from '../utils/ClientErrorUtils'
import { isStaleChunkError, recoverFromStaleChunks } from '../utils/StaleChunkUtils'

export default function Custom500({ error }) {
    // Some deploys leave a tab with a mixed-build webpack module map (stale HTML/RSC/JS cached by
    // Cloudflare/the service worker). That surfaces here as a plain render-time error rather than a
    // ChunkLoadError, so it never reaches the window 'error' listener in MainApp. Recover the same way:
    // clear caches and reload once, guarded so a repeat failure falls through to the normal error page.
    const isStale = isStaleChunkError(error)
    const [isReloading, setIsReloading] = useState(isStale)
    const recoveryAttempted = useRef(false)

    useEffect(() => {
        // Record the error before a potential reload so it stays in the sessionStorage error log.
        recordClientError(error, 'react-boundary')

        // The ref keeps a re-run of this effect (strict mode) from hitting the reload guard set by the first run.
        if (isStale && !recoveryAttempted.current) {
            recoveryAttempted.current = true
            if (!recoverFromStaleChunks()) {
                setIsReloading(false)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    if (isReloading) {
        return <p>Updating to the latest version…</p>
    }

    return (
        <>
            <Error title="Unable to load this page" errorObject={error} onRetry={() => window.location.reload()} />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Error',
    'An error occurred while loading the page. Please try again or contact support if the issue persists. Our Hypixel SkyBlock tools are usually available 24/7 for reliable auction and bazaar tracking.'
)
