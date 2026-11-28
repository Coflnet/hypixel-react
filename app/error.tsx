'use client'
import { getHeadMetadata } from '../utils/SSRUtils'
import { Error } from '../components/Error/Error'
import { useStaleBuildRecovery } from '../hooks/useStaleBuildRecovery'

export default function Custom500({ error }) {
    // Some deploys leave a tab with a mixed-build webpack module map (stale HTML/RSC/JS cached by
    // Cloudflare/the service worker). That surfaces here as a plain render-time error rather than a
    // ChunkLoadError, so it never reaches the window 'error' listener in MainApp. The hook recovers the same way:
    // clear caches and reload once, guarded so a repeat failure falls through to the normal error page.
    const isReloading = useStaleBuildRecovery(error)

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
