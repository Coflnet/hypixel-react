"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getFavoriteItems, toggleFavoriteItem } from '../../utils/FavoriteItemUtils'

interface FavoritesContextValue {
    favorites: FavoriteItemEntry[]
    reload: () => void
    add: (item: FavoriteItemEntry) => void
    remove: (tag: string) => void
    toggle: (item: FavoriteItemEntry) => boolean
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteItemEntry[]>(getFavoriteItems)

    function reload() {
        setFavorites(getFavoriteItems())
    }

    function add(item: FavoriteItemEntry) {
        const result = toggleFavoriteItem(item)
        
        setFavorites(result.favorites)
    }

    function remove(tag: string) {
        const result = toggleFavoriteItem({ tag } as FavoriteItemEntry)
        setFavorites(result.favorites)
    }

    function toggle(item: FavoriteItemEntry) {
        const result = toggleFavoriteItem(item)
        setFavorites(result.favorites)
        return result.isFavorite
    }

    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key === undefined || e.key === null) {
                // unknown change, reload
                reload()
                return
            }
            if (e.key === 'settings') {
                // settings changed, reload favorites
                reload()
            }
        }

        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const value: FavoritesContextValue = { favorites, reload, add, remove, toggle }

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
    const ctx = useContext(FavoritesContext)
    if (!ctx) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return ctx
}
