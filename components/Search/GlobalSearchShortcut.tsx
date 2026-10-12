'use client'
import { useGlobalSearchShortcut } from '../../hooks/useGlobalSearchShortcut'

/** mounted once in MainApp; registers the Ctrl+K and "/" shortcuts for the global search bar */
export default function GlobalSearchShortcut() {
    useGlobalSearchShortcut()
    return null
}
