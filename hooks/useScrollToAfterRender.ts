'use client'
import { useEffect, useState } from 'react'

export function prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** smooth scrolling unless the visitor asked for less motion */
export function getScrollBehavior(): ScrollBehavior {
    return prefersReducedMotion() ? 'auto' : 'smooth'
}

/**
 * Scrolls to an element id after the next render, so it also works for elements that a state
 * change is about to render (e.g. the purchase wizard). Falls back to `fallbackId` if the target is missing.
 */
export function useScrollToAfterRender(fallbackId: string): (id: string) => void {
    const [target, setTarget] = useState<{ id: string } | null>(null)

    useEffect(() => {
        if (!target) return
        const element = document.getElementById(target.id) ?? document.getElementById(fallbackId)
        element?.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' })
        setTarget(null)
    }, [target, fallbackId])

    return (id: string) => setTarget({ id })
}
