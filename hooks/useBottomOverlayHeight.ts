'use client'
import { useSyncExternalStore } from 'react'
import { BOTTOM_OVERLAY_SELECTORS, getCoveredHeight } from '../utils/BottomOverlay'

// One measurement for the page: the bars come and go (consent given, ad closed or loaded), so the DOM and their sizes are
// watched while anything uses the height; a change is measured once per frame.

let height = 0
let frame = 0
const listeners = new Set<() => void>()
let mutations: MutationObserver | undefined
let sizes: ResizeObserver | undefined
let observedBars: HTMLElement[] = []

/** the fixed element a bar is in (the bar itself or e.g. the ad's anchor wrapper); null when it is not fixed */
function getFixedContainer(element: Element): HTMLElement | null {
    for (let node: HTMLElement | null = element as HTMLElement; node; node = node.parentElement) {
        if (getComputedStyle(node).position === 'fixed') return node
    }
    return null
}

function findBars(): HTMLElement[] {
    const found = BOTTOM_OVERLAY_SELECTORS.flatMap(selector => Array.from(document.querySelectorAll(selector)))
    const containers = found.map(getFixedContainer).filter((container): container is HTMLElement => container !== null)
    return Array.from(new Set(containers))
}

/** watches the sizes of the bars; only a changed set is observed again (observing reports a size at once, which would loop) */
function observeSizes(bars: HTMLElement[]) {
    const unchanged = bars.length === observedBars.length && bars.every((bar, index) => bar === observedBars[index])
    if (unchanged) return
    observedBars = bars
    sizes?.disconnect()
    bars.forEach(bar => sizes?.observe(bar))
}

function measure() {
    frame = 0
    const bars = findBars()
    observeSizes(bars)
    const next = getCoveredHeight(bars.map(bar => bar.getBoundingClientRect()), window.innerHeight)
    if (next === height) return
    height = next
    listeners.forEach(listener => listener())
}

function scheduleMeasure() {
    if (!frame) frame = window.requestAnimationFrame(measure)
}

function startWatching() {
    mutations = new MutationObserver(scheduleMeasure)
    mutations.observe(document.body, { childList: true, subtree: true })
    sizes = new ResizeObserver(scheduleMeasure)
    window.addEventListener('resize', scheduleMeasure)
    scheduleMeasure()
}

function stopWatching() {
    mutations?.disconnect()
    sizes?.disconnect()
    observedBars = []
    window.removeEventListener('resize', scheduleMeasure)
    if (frame) window.cancelAnimationFrame(frame)
    frame = 0
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    if (listeners.size === 1) startWatching()
    return () => {
        listeners.delete(listener)
        if (listeners.size === 0) stopWatching()
    }
}

/** the height (px) the fixed bottom bars cover at the window's bottom edge; 0 on the server and while none is shown */
export function useBottomOverlayHeight(): number {
    return useSyncExternalStore(
        subscribe,
        () => height,
        () => 0
    )
}
