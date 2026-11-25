import { useCallback, useEffect, useState } from 'react'

// end times by key, shared by every component using the same key so a remount keeps a running cooldown
const cooldownEnds = new Map<string, number>()

function getSecondsLeft(endsAt: number | undefined): number {
    if (endsAt === undefined) {
        return 0
    }
    return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}

/**
 * A countdown in whole seconds, e.g. for a rate limit, shared by all users of the same `key`.
 * `start(seconds)` begins it, `secondsLeft` is 0 when none is running and `isActive()` reads the current state
 * directly, without waiting for a re-render. Ticks once per second only while a cooldown is running.
 */
export function useCooldown(key: string) {
    const [endsAt, setEndsAt] = useState<number | undefined>(() => cooldownEnds.get(key))
    const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(cooldownEnds.get(key)))

    const start = useCallback(
        (seconds: number) => {
            const end = Date.now() + Math.max(0, seconds) * 1000
            cooldownEnds.set(key, end)
            setEndsAt(end)
            setSecondsLeft(getSecondsLeft(end))
        },
        [key]
    )

    const isActive = useCallback(() => getSecondsLeft(cooldownEnds.get(key)) > 0, [key])

    useEffect(() => {
        if (endsAt === undefined) {
            return
        }
        const interval = setInterval(() => {
            const left = getSecondsLeft(endsAt)
            setSecondsLeft(left)
            if (left === 0) {
                setEndsAt(undefined)
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [endsAt])

    return { secondsLeft, start, isActive }
}
