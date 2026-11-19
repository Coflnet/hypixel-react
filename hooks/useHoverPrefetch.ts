'use client'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const MAX_PREFETCHED_ROUTES = 500

/** routes already prefetched, shared by every hook user so many cards dedupe together (oldest dropped past the cap) */
const sharedPrefetched = new Set<string>()

interface TimerApi {
    setTimeout: (fn: () => void, ms: number) => any
    clearTimeout: (handle: any) => void
}

/** framework free hover/focus/touch prefetch logic, kept separate from React so it can be unit tested */
export class HoverPrefetchController {
    private timer: any = undefined

    constructor(
        private prefetch: (route: string) => void,
        private delayMs = 150,
        private prefetched: Set<string> = sharedPrefetched,
        private timers: TimerApi = { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: h => clearTimeout(h) },
        private maxEntries = MAX_PREFETCHED_ROUTES
    ) {}

    private run(route: string) {
        if (this.prefetched.has(route)) {
            return
        }
        if (this.prefetched.size >= this.maxEntries) {
            const oldest = this.prefetched.values().next().value
            if (oldest !== undefined) {
                this.prefetched.delete(oldest)
            }
        }
        this.prefetched.add(route)
        this.prefetch(route)
    }

    enter(route: string) {
        this.cancel()
        if (this.prefetched.has(route)) {
            return
        }
        this.timer = this.timers.setTimeout(() => {
            this.timer = undefined
            this.run(route)
        }, this.delayMs)
    }

    leave() {
        this.cancel()
    }

    touch(route: string) {
        this.cancel()
        this.run(route)
    }

    cancel() {
        if (this.timer !== undefined) {
            this.timers.clearTimeout(this.timer)
            this.timer = undefined
        }
    }
}

/** prefetches a route after the pointer rested on an element for delayMs (immediately on touch) */
export function useHoverPrefetch(delayMs = 150) {
    const router = useRouter()
    const controller = useMemo(() => new HoverPrefetchController(route => router.prefetch(route), delayMs), [router, delayMs])

    useEffect(() => () => controller.cancel(), [controller])

    return {
        bind: (route: string) => ({
            onMouseEnter: () => controller.enter(route),
            onMouseLeave: () => controller.leave(),
            onFocus: () => controller.enter(route),
            onBlur: () => controller.leave(),
            onTouchStart: () => controller.touch(route)
        })
    }
}
