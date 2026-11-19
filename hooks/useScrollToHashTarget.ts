import { useCallback, useRef } from 'react'
import { getScrollBehavior } from './useScrollToAfterRender'

/**
 * A ref callback for the element with id `targetId` that scrolls it into view once, the first time it mounts while the page's
 * #hash names it. The browser's own hash scroll runs at load, before an element that only renders after the account loaded
 * exists, so a link to /premium#buyPremium would stay at the top. No effect: the ref callback runs when the element is mounted.
 */
export function useScrollToHashTarget(targetId: string): (element: HTMLElement | null) => void {
    const scrolled = useRef(false)
    return useCallback(
        (element: HTMLElement | null) => {
            if (!element || scrolled.current || window.location.hash !== `#${targetId}`) return
            scrolled.current = true
            element.scrollIntoView({ block: 'start', behavior: getScrollBehavior() })
        },
        [targetId]
    )
}
