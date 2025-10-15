'use client'

import { useMemo } from 'react'
import { Spinner } from 'react-bootstrap'
import { useGetApiPricesChange } from '../../api/_generated/skyApi'
import { parsePriceMovement } from '../../utils/Parser/APIResponseParser'
import { useFavorites } from './FavoritesContext'
import FavoriteItemCard from './FavoriteItemCard'
import styles from './FavoriteItemsBar.module.css'

const REFRESH_INTERVAL = 5 * 60 * 1000

function FavoriteItemsBar() {
    const { favorites } = useFavorites()
    
    const { data, isLoading, isError } = useGetApiPricesChange(
        favorites.length > 0 ? { itemTags: favorites.map(f => f.tag) } : undefined,
        {
            query: {
                enabled: favorites.length > 0,
                refetchInterval: REFRESH_INTERVAL,
                staleTime: REFRESH_INTERVAL
            }
        }
    )

    const priceMovements = useMemo(() => {
        if (!data?.data) {
            return {}
        }
        
        const raw = data.data
        const parsed: Record<string, ItemPriceMovement> = {}
        Object.keys(raw).forEach(tag => {
            parsed[tag] = parsePriceMovement(tag, raw[tag])
        })
        return parsed
    }, [data])

    const lastUpdatedText = useMemo(() => {
        const timestamps = Object.values(priceMovements)
            .map(movement => movement.lastUpdated?.getTime())
            .filter(Boolean) as number[]

        if (timestamps.length === 0) {
            return null
        }

        const latest = Math.max(...timestamps)
        return new Date(latest)
    }, [priceMovements])

    if (favorites.length === 0) {
        return null
    }

    return (
        <section className={styles.wrapper} aria-label="Favorite items summary">
            <div className={styles.headerRow}>
                <h2 className={styles.heading}>Favorites</h2>
                <div className={styles.meta}>
                    {isLoading ? <Spinner animation="border" size="sm" /> : null}
                    {lastUpdatedText ? <span>Last updated {lastUpdatedText.toLocaleTimeString()}</span> : null}
                </div>
            </div>
            {isError ? <p className={styles.error}>Failed to load price movement data. Please try again later.</p> : null}
            <div className={styles.list}>
                {favorites.map(favorite => {
                    const movement = priceMovements[favorite.tag]
                    const isMovementLoading = isLoading && !movement
                    return <FavoriteItemCard key={favorite.tag} favorite={favorite} movement={movement} isMovementLoading={isMovementLoading} />
                })}
            </div>
        </section>
    )
}

export default FavoriteItemsBar
