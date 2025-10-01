'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getSettingsObject, FLIPPER_FILTER_KEY, RESTRICTIONS_SETTINGS_KEY, FLIP_CUSTOMIZING_KEY } from '../../utils/SettingsUtils'
import { getFlipCustomizeSettings } from '../../utils/FlipUtils'

interface FlipSettingsContextValue {
    flipperFilter: FlipperFilter
    restrictions: FlipRestriction[]
    flipCustomizeSettings: FlipCustomizeSettings
    updateFlipperFilter: (filter: FlipperFilter) => void
    updateRestrictions: (restrictions: FlipRestriction[]) => void
    updateFlipCustomizeSettings: (settings: FlipCustomizeSettings) => void
    refreshSettings: () => void
}

const FlipSettingsContext = createContext<FlipSettingsContextValue | undefined>(undefined)

export function FlipSettingsProvider({ children }: { children: React.ReactNode }) {
    const [flipperFilter, setFlipperFilter] = useState<FlipperFilter>(() => 
        getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {})
    )
    const [restrictions, setRestrictions] = useState<FlipRestriction[]>(() => 
        getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
    )
    const [flipCustomizeSettings, setFlipCustomizeSettings] = useState<FlipCustomizeSettings>(() => 
        getFlipCustomizeSettings()
    )

    const refreshSettings = useCallback(() => {
        setFlipperFilter(getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {}))
        setRestrictions(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))
        setFlipCustomizeSettings(getFlipCustomizeSettings())
    }, [])

    const updateFlipperFilter = useCallback((filter: FlipperFilter) => {
        setFlipperFilter(filter)
    }, [])

    const updateRestrictions = useCallback((newRestrictions: FlipRestriction[]) => {
        setRestrictions(newRestrictions)
    }, [])

    const updateFlipCustomizeSettings = useCallback((settings: FlipCustomizeSettings) => {
        setFlipCustomizeSettings(settings)
    }, [])

    // Listen to storage events from other tabs
    useEffect(() => {
        function handleStorageChange(e: StorageEvent) {
            if (e.key === 'userSettings') {
                refreshSettings()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [refreshSettings])

    return (
        <FlipSettingsContext.Provider
            value={{
                flipperFilter,
                restrictions,
                flipCustomizeSettings,
                updateFlipperFilter,
                updateRestrictions,
                updateFlipCustomizeSettings,
                refreshSettings
            }}
        >
            {children}
        </FlipSettingsContext.Provider>
    )
}

export function useFlipSettings(): FlipSettingsContextValue {
    const context = useContext(FlipSettingsContext)
    if (!context) {
        throw new Error('useFlipSettings must be used within a FlipSettingsProvider')
    }
    return context
}
