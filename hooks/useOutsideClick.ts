'use client'
import { RefObject, useEffect, useRef } from 'react'

/** calls the handler for every click (capture phase) that happens outside of the referenced element */
export function useOutsideClick(ref: RefObject<HTMLElement | null>, handler: () => void) {
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        function onClick(event: MouseEvent) {
            const element = ref.current
            if (element && event.target instanceof Node && element.contains(event.target)) {
                return
            }
            handlerRef.current()
        }
        document.addEventListener('click', onClick, true)
        return () => document.removeEventListener('click', onClick, true)
    }, [ref])
}
