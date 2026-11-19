import { useCallback, useRef } from 'react'

function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= window.innerHeight
}

function focusAndReveal(element: HTMLElement) {
    element.focus({ preventScroll: true })
    if (isInViewport(element)) return
    // instant, so it also respects reduced motion; the title's scroll-margin-top keeps it off the edge
    element.scrollIntoView({ block: 'start' })
}

/**
 * Moves focus to the step title after a step change the visitor made, so keyboard and screen reader users land on the new
 * step. Steps changed by the page (a plan card, a ?tier= link) do not take the focus. The title must be keyed by its step,
 * so React mounts a new element per step and calls the ref with it.
 */
export function useStepTitleFocus() {
    const pending = useRef(false)

    const titleRef = useCallback((element: HTMLHeadingElement | null) => {
        if (!element || !pending.current) return
        pending.current = false
        focusAndReveal(element)
    }, [])

    const focusNextTitle = useCallback(() => {
        pending.current = true
    }, [])

    return { titleRef, focusNextTitle }
}
