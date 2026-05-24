'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { LAST_PREMIUM_PRODUCTS } from '../../utils/SettingsUtils'
import { parsePremiumProducts } from '../../utils/Parser/APIResponseParser'
import properties from '../../properties'

interface AdsContextValue {
    shouldShowAds: boolean
    refreshAdsVisibility: () => void
}

const AdsContext = createContext<AdsContextValue | undefined>(undefined)

function evaluateShouldShowAds(): boolean {
    if (properties.isTestRunner) {
        return false
    }

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

export function AdsProvider({ children }: { children: React.ReactNode }) {
    const [shouldShowAds, setShouldShowAds] = useState<boolean>(() => evaluateShouldShowAds())

    const refreshAdsVisibility = useCallback(() => {
        setShouldShowAds(evaluateShouldShowAds())
    }, [])

    useEffect(() => {
        // Listen to premium product updates (this is the ONE global notification event for ads)
        function handlePremiumUpdate() {
            refreshAdsVisibility()
        }

        // Listen to custom event from premium product updates
        window.addEventListener('premium.products.updated', handlePremiumUpdate)
        // Listen to localStorage changes from other tabs
        window.addEventListener('storage', handlePremiumUpdate)

        return () => {
            window.removeEventListener('premium.products.updated', handlePremiumUpdate)
            window.removeEventListener('storage', handlePremiumUpdate)
        }
    }, [refreshAdsVisibility])

    return <AdsContext.Provider value={{ shouldShowAds, refreshAdsVisibility }}>{children}</AdsContext.Provider>
}

export function useAds(): AdsContextValue {
    const context = useContext(AdsContext)
    if (!context) {
        throw new Error('useAds must be used within an AdsProvider')
    }
    return context
}
