'use client'

import { useEffect, useRef, useState } from 'react'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../utils/PremiumTypeUtils'
import { LAST_PREMIUM_PRODUCTS } from '../utils/SettingsUtils'
import { parsePremiumProducts } from '../utils/Parser/APIResponseParser'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'

function evaluateShouldShowAds(): boolean {
    if (typeof window === 'undefined') {
        return true
    }

    try {
        const raw = window.localStorage.getItem(LAST_PREMIUM_PRODUCTS)
        if (!raw) {
            return true
        }

        const parsedProducts = parsePremiumProducts(JSON.parse(raw))
        const hasPremium = hasHighEnoughPremium(parsedProducts, PREMIUM_RANK.STARTER)
        return !hasPremium
    } catch (e) {
        console.warn('Failed to evaluate premium cache for ads', e)
        return true
    }
}

export function useShouldShowAds(): boolean {
    const [shouldShowAds, setShouldShowAds] = useState<boolean>(() => evaluateShouldShowAds())
    const isMountedRef = useRef(true)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    useEffect(() => {
        function handlePremiumUpdate() {
            if (!isMountedRef.current) {
                return
            }
            setShouldShowAds(evaluateShouldShowAds())
        }

    window.addEventListener(CUSTOM_EVENTS.PREMIUM_PRODUCTS_UPDATED, handlePremiumUpdate as EventListener)
        window.addEventListener('storage', handlePremiumUpdate)

        return () => {
            window.removeEventListener(CUSTOM_EVENTS.PREMIUM_PRODUCTS_UPDATED, handlePremiumUpdate as EventListener)
            window.removeEventListener('storage', handlePremiumUpdate)
        }
    }, [])

    return shouldShowAds
}
