'use client'
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react'

const POPOVER_MAX_WIDTH = 340
const VIEWPORT_MARGIN = 8
const GAP = 4

/** runs an action after a delay; scheduling again or cancelling drops the pending one; cleared on unmount */
export function useDelayedAction() {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => () => cancel(), [])

    function cancel() {
        if (timer.current) clearTimeout(timer.current)
        timer.current = null
    }

    function schedule(action: () => void, delay: number) {
        cancel()
        timer.current = setTimeout(() => {
            timer.current = null
            action()
        }, delay)
    }

    return { schedule, cancel }
}

export interface PopoverPlacement {
    left: number
    top: number
    width: number
    above: boolean
}

/** below the anchor when there is room, otherwise above it; always inside the viewport horizontally */
export function placePopover(anchor: DOMRect, popoverHeight: number, viewport: { width: number; height: number }): PopoverPlacement {
    const width = Math.min(POPOVER_MAX_WIDTH, viewport.width - 2 * VIEWPORT_MARGIN)
    const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left + 8, viewport.width - width - VIEWPORT_MARGIN))
    const roomBelow = viewport.height - anchor.bottom - GAP - VIEWPORT_MARGIN
    const roomAbove = anchor.top - GAP - VIEWPORT_MARGIN
    const above = roomBelow < popoverHeight && roomAbove >= popoverHeight
    const top = above ? anchor.top - GAP - popoverHeight : anchor.bottom + GAP
    return { left, top, width, above }
}

function applyPlacement(anchor: HTMLElement, popover: HTMLElement) {
    popover.style.width = `${Math.min(POPOVER_MAX_WIDTH, window.innerWidth - 2 * VIEWPORT_MARGIN)}px`
    const placement = placePopover(anchor.getBoundingClientRect(), popover.offsetHeight, { width: window.innerWidth, height: window.innerHeight })
    popover.style.left = `${placement.left}px`
    popover.style.top = `${placement.top}px`
    popover.dataset.placement = placement.above ? 'above' : 'below'
}

/** keeps a position:fixed popover attached to its anchor while the page or the table scrolls */
export function useAnchoredPosition(anchorRef: RefObject<HTMLElement | null>, popoverRef: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const anchor = anchorRef.current
        const popover = popoverRef.current
        if (!anchor || !popover) return
        const update = () => applyPlacement(anchor, popover)
        update()
        const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
        resizeObserver?.observe(popover)
        window.addEventListener('scroll', update, { capture: true, passive: true })
        window.addEventListener('resize', update, { passive: true })
        return () => {
            resizeObserver?.disconnect()
            window.removeEventListener('scroll', update, { capture: true })
            window.removeEventListener('resize', update)
        }
    }, [anchorRef, popoverRef])
}

/** closes on Escape; hands focus back to the trigger if it was inside the popover's wrapper */
export function useEscapeToClose(onClose: () => void, wrapper: RefObject<HTMLElement | null>, focusTarget: RefObject<HTMLElement | null>) {
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return
            const hadFocus = !!wrapper.current?.contains(document.activeElement)
            onCloseRef.current()
            if (hadFocus) focusTarget.current?.focus()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [wrapper, focusTarget])
}

/** a preview left open must not reappear when the page is opened again (the store outlives client navigation) */
export function useCloseOnUnmount(close: () => void) {
    const closeRef = useRef(close)
    closeRef.current = close
    useEffect(() => () => closeRef.current(), [])
}
