'use client'
import { useSyncExternalStore } from 'react'

// One preview popover may be open at a time across the whole comparison table.

export interface OpenPreview {
    rowId: string
    pinned: boolean
}

let openPreview: OpenPreview | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

function getSnapshot() {
    return openPreview
}

function getServerSnapshot() {
    return null
}

export function setOpenPreview(next: OpenPreview | null) {
    if (next?.rowId === openPreview?.rowId && next?.pinned === openPreview?.pinned) return
    openPreview = next
    listeners.forEach(listener => listener())
}

/** closes the preview only if it still belongs to this row */
export function closePreview(rowId: string) {
    if (openPreview?.rowId === rowId) setOpenPreview(null)
}

/** the open state of one row's preview */
export function usePreviewState(rowId: string): OpenPreview | null {
    const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    return current?.rowId === rowId ? current : null
}
