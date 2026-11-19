'use client'
import { useEffect, useState } from 'react'

/** browsers may report a crossing of 0.5 as 0.4999… */
const RATIO_TOLERANCE = 0.01

export interface Visibility {
    /** at least `threshold` of the element is visible */
    inView: boolean
    /** any part of the element is visible */
    visible: boolean
}

const HIDDEN: Visibility = { inView: false, visible: false }
const SHOWN: Visibility = { inView: true, visible: true }
const PARTIAL: Visibility = { inView: false, visible: true }

/**
 * Tracks how much of an element is visible. Returns a callback ref and the visibility.
 * Without IntersectionObserver the element counts as visible.
 */
export function useInView<T extends Element>(threshold: number): [(element: T | null) => void, Visibility] {
    const [element, setElement] = useState<T | null>(null)
    const [visibility, setVisibility] = useState<Visibility>(HIDDEN)

    useEffect(() => {
        if (!element) return
        if (typeof IntersectionObserver === 'undefined') {
            setVisibility(SHOWN)
            return
        }
        const observer = new IntersectionObserver(
            entries => {
                const entry = entries[entries.length - 1]
                if (!entry.isIntersecting) return setVisibility(HIDDEN)
                setVisibility(entry.intersectionRatio >= threshold - RATIO_TOLERANCE ? SHOWN : PARTIAL)
            },
            { threshold: [0, threshold] }
        )
        observer.observe(element)
        return () => observer.disconnect()
    }, [element, threshold])

    return [setElement, visibility]
}
