'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../api/ApiHelper'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'
import { useDebounce } from '../utils/Hooks'

// Only auto-refresh while the requested timestamp is still roughly "now" - a user who scrolled back
// to an old snapshot should not keep polling for an update that will never come.
const AUTO_REFRESH_MAX_AGE_MS = 60 * 60 * 1000
const AUTO_REFRESH_INTERVAL_MS = 25_000
const MIN_REFRESH_DELAY_MS = 5_000
// Quiet retry schedule for transient failures (a dropped mobile connection, Safari's "Load failed",
// a 5xx from the gateway, ...) - these retries never flip the panel into its error state or report
// anything; only exhausting the schedule does.
const RETRY_DELAYS_MS = [3_000, 6_000]

function isTransientError(error: any): boolean {
    const status = error?.status
    // No numeric status at all means the request never reached the server (network-level failure) -
    // always worth a quiet retry. A real HTTP status is only treated as transient for 5xx; 4xx (bad
    // item tag, etc.) is not and fails immediately.
    return typeof status !== 'number' || status >= 500
}

function willRetry(attempt: number, error: any): boolean {
    return attempt < RETRY_DELAYS_MS.length && isTransientError(error)
}

export interface UseBazaarSnapshotResult {
    snapshot?: BazaarSnapshot
    hasError: boolean
    retry: () => void
}

/**
 * Owns loading a bazaar snapshot for `itemTag`: reacting to BAZAAR_SNAPSHOT_UPDATE events (chart
 * zoom), quietly retrying transient failures a couple of times before giving up, and polling for a
 * fresh snapshot roughly every 25s while the tab is visible and the viewed time is recent. Pulled out
 * of BazaarSnapshot.tsx so this timer/retry wiring lives in one hook instead of several interdependent
 * effects in the component.
 *
 * A failed attempt still re-arms the next poll (via `schedulePoll` in both the success and the
 * give-up branches below) - previously the component's own auto-refresh effect only re-armed when a
 * new snapshot arrived, so a single failed poll silently stopped auto-refresh until the user pressed
 * "Retry snapshot".
 */
export function useBazaarSnapshot(itemTag: string): UseBazaarSnapshotResult {
    const [timestamp, setTimestamp] = useState<Date>(new Date())
    const [snapshot, setSnapshot] = useState<BazaarSnapshot>()
    const [hasError, setHasError] = useState(false)

    const debouncedTimestamp = useDebounce(timestamp, 100)

    // Guards a stale request (an older timestamp/item) from applying its result or scheduling a
    // retry/poll after a newer request has already started.
    const requestedTimeRef = useRef<number>(0)
    const isVisibleRef = useRef(true)
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    // Whatever was due to run next (a retry attempt or a poll tick) while the tab was hidden, so it
    // can fire immediately once the tab becomes visible again instead of being lost.
    const pendingWhileHiddenRef = useRef<(() => void) | null>(null)
    // True once the current outage has already reported (toast + error log) - reset on a successful
    // load or a manual retry, so a long outage reports once instead of on every ~25s poll cycle.
    const hasReportedErrorRef = useRef(false)

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden
            isVisibleRef.current = visible
            if (visible && pendingWhileHiddenRef.current) {
                const run = pendingWhileHiddenRef.current
                pendingWhileHiddenRef.current = null
                run()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    useEffect(() => {
        const onTimestampChangeEvent = (e: Event) => {
            const nextTimestamp = (e as CustomEvent).detail?.timestamp
            if (nextTimestamp instanceof Date && Number.isFinite(nextTimestamp.getTime())) setTimestamp(nextTimestamp)
        }
        document.addEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, onTimestampChangeEvent)
        return () => document.removeEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, onTimestampChangeEvent)
    }, [])

    // Runs `action` after `delay`, unless the tab is (or becomes) hidden in the meantime - then it is
    // deferred until the visibilitychange handler above sees the tab become visible again.
    const runWhenVisible = useCallback((delay: number, action: () => void) => {
        clearTimeout(timerRef.current)
        if (!isVisibleRef.current) {
            pendingWhileHiddenRef.current = action
            return
        }
        timerRef.current = setTimeout(() => {
            if (!isVisibleRef.current) {
                pendingWhileHiddenRef.current = action
                return
            }
            action()
        }, delay)
    }, [])

    const schedulePoll = useCallback(
        (requestedTime: number, dataTimeMs: number) => {
            if (Date.now() - requestedTime > AUTO_REFRESH_MAX_AGE_MS) return
            const nextUpdate = dataTimeMs + AUTO_REFRESH_INTERVAL_MS
            const delay = Math.max(MIN_REFRESH_DELAY_MS, nextUpdate - Date.now())
            runWhenVisible(delay, () => setTimestamp(new Date()))
        },
        [runWhenVisible]
    )

    const attemptLoad = useCallback(
        (tag: string, time: Date, attempt: number) => {
            const requestedTime = time.getTime()
            requestedTimeRef.current = requestedTime
            // An attempt that's about to be retried reports nothing (no toast, no error log) - only
            // the first exhausted attempt of an outage does, until a load succeeds again.
            const shouldReportError = (error: any) => {
                if (willRetry(attempt, error)) return false
                if (hasReportedErrorRef.current) return false
                hasReportedErrorRef.current = true
                return true
            }
            api.getBazaarSnapshot(tag, time, shouldReportError)
                .then(result => {
                    if (requestedTimeRef.current !== requestedTime) return
                    hasReportedErrorRef.current = false
                    setSnapshot(result)
                    setHasError(false)
                    schedulePoll(requestedTime, new Date(result.timeStamp).getTime())
                })
                .catch(error => {
                    if (requestedTimeRef.current !== requestedTime) return
                    if (willRetry(attempt, error)) {
                        runWhenVisible(RETRY_DELAYS_MS[attempt], () => {
                            // A newer load may have started (and cleared this timer) between scheduling
                            // and firing - guard again so a stale retry can never clobber it.
                            if (requestedTimeRef.current !== requestedTime) return
                            attemptLoad(tag, time, attempt + 1)
                        })
                        return
                    }
                    setHasError(true)
                    schedulePoll(requestedTime, requestedTime)
                })
        },
        [runWhenVisible, schedulePoll]
    )

    // Starts a fresh (attempt 0) load, first cancelling whatever retry/poll was pending so an old
    // request's retry can never fire after a newer one has already taken over.
    const startLoad = useCallback(
        (tag: string, time: Date) => {
            clearTimeout(timerRef.current)
            pendingWhileHiddenRef.current = null
            attemptLoad(tag, time, 0)
        },
        [attemptLoad]
    )

    useEffect(() => {
        startLoad(itemTag, debouncedTimestamp)
        // startLoad is stable (only depends on other stable callbacks/refs); itemTag/debouncedTimestamp
        // are the only real triggers for a fresh load. hasError is intentionally left alone here - only
        // a success or failure (or a manual retry) should change it, not an automatic poll/item/timestamp
        // change, or the error notice would flicker off and back on every retry cycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemTag, debouncedTimestamp])

    useEffect(() => () => clearTimeout(timerRef.current), [])

    const retry = useCallback(() => {
        hasReportedErrorRef.current = false
        setHasError(false)
        startLoad(itemTag, debouncedTimestamp)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemTag, debouncedTimestamp])

    return { snapshot, hasError, retry }
}
