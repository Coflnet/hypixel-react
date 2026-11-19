import { useEffect, useRef } from 'react'

// Payment confirmation can arrive after the first ownership lookup or in another tab.
export default function usePremiumRefresh(enabled: boolean, refresh: () => Promise<unknown>) {
    const refreshRef = useRef(refresh)
    refreshRef.current = refresh

    useEffect(() => {
        if (!enabled) return
        let stopped = false
        let refreshing = false
        let fastUntil = Date.now() + 120_000
        let timer: number

        async function poll() {
            window.clearTimeout(timer)
            if (stopped || refreshing) return
            if (document.visibilityState !== 'hidden') {
                refreshing = true
                try {
                    await refreshRef.current()
                } catch {
                    // Preserve the last known status and retry after a temporary failure.
                } finally {
                    refreshing = false
                }
            }
            if (!stopped) timer = window.setTimeout(poll, Date.now() < fastUntil ? 5_000 : 30_000)
        }

        function resume() {
            if (document.visibilityState === 'hidden') return
            fastUntil = Date.now() + 120_000
            void poll()
        }

        timer = window.setTimeout(poll, 5_000)
        window.addEventListener('focus', resume)
        document.addEventListener('visibilitychange', resume)
        return () => {
            stopped = true
            window.clearTimeout(timer)
            window.removeEventListener('focus', resume)
            document.removeEventListener('visibilitychange', resume)
        }
    }, [enabled])
}
