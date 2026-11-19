import { useEffect, useRef } from 'react'

/** runs `onRestore` when the browser shows this page again from its back/forward cache (e.g. back from the payment provider) */
export function useBackForwardRestore(onRestore: () => void) {
    const latest = useRef(onRestore)
    latest.current = onRestore
    useEffect(() => {
        const listener = (event: PageTransitionEvent) => {
            if (event.persisted) latest.current()
        }
        window.addEventListener('pageshow', listener)
        return () => window.removeEventListener('pageshow', listener)
    }, [])
}
