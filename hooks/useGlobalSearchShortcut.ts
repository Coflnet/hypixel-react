'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isEditableTarget } from '../utils/Search/EditableTarget'

export { isEditableTarget }

export const GLOBAL_SEARCH_INPUT_ID = 'search-bar'

/** Ctrl/Cmd+K anywhere and "/" outside of text fields focus the global search bar (or open the home page which has one) */
export function useGlobalSearchShortcut() {
    const router = useRouter()

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.isComposing || e.repeat || e.defaultPrevented) {
                return
            }
            const isCtrlK = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k'
            const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditableTarget(e.target)
            if (!isCtrlK && !isSlash) {
                return
            }
            e.preventDefault()
            const input = document.getElementById(GLOBAL_SEARCH_INPUT_ID) as HTMLInputElement | null
            if (input) {
                input.focus()
                input.select()
            } else {
                router.push('/')
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [router])
}
