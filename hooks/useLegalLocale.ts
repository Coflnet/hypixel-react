'use client'
import { useSyncExternalStore } from 'react'
import { getLegalLocale, LegalLocale } from '../utils/LegalLinks'

function subscribe(onChange: () => void) {
    window.addEventListener('languagechange', onChange)
    return () => window.removeEventListener('languagechange', onChange)
}

/** the browser's legal locale (German or English); English on the server and during hydration, so the markup matches */
export function useLegalLocale(): LegalLocale {
    return useSyncExternalStore(subscribe, getLegalLocale, () => 'en')
}
