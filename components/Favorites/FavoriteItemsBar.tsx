'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Spinner } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { getApiPricesChange } from '../../api/_generated/skyApi'
import { parsePriceMovement } from '../../utils/Parser/APIResponseParser'
import { convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import { getFavoriteItems } from '../../utils/FavoriteItemUtils'
import { useFavorites } from './FavoritesContext'
import FavoriteToggle from './FavoriteToggle'
import FavoriteItemCard from './FavoriteItemCard'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import styles from './FavoriteItemsBar.module.css'

const REFRESH_INTERVAL = 5 * 60 * 1000

function FavoriteItemsBar() {
    const { favorites } = useFavorites()
    let [priceMovements, setPriceMovements] = useState<Record<string, ItemPriceMovement>>({})
    let [isLoading, setIsLoading] = useState(false)
    let [error, setError] = useState<string | null>(null)
    // Favorites are provided by FavoritesProvider; no DOM custom events required.

    useEffect(() => {
        let cancelled = false
        let intervalId: NodeJS.Timeout | null = null

        async function fetchMovements() {
            if (favorites.length === 0) {
                setPriceMovements({})
                setIsLoading(false)
                setError(null)
                return
            }

            setIsLoading(true)
            setError(null)
            try {
                const resp = await getApiPricesChange({ itemTags: favorites.map(f => f.tag) })
                const raw = resp.data || {}
                const parsed: Record<string, ItemPriceMovement> = {}
                Object.keys(raw).forEach(tag => {
                    parsed[tag] = parsePriceMovement(tag, raw[tag])
                })
                if (!cancelled) {
                    setPriceMovements(parsed)
                }
            } catch (e) {
                if (!cancelled) {
                    setError('Failed to load price movement data. Please try again later.')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        fetchMovements()

        if (favorites.length > 0) {
            intervalId = setInterval(fetchMovements, REFRESH_INTERVAL)
        }

        return () => {
            cancelled = true
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [favorites])

    let lastUpdatedText = useMemo(() => {
        let timestamps = Object.values(priceMovements)
            .map(movement => movement.lastUpdated?.getTime())
            .filter(Boolean) as number[]

        if (timestamps.length === 0) {
            return null
        }

        let latest = Math.max(...timestamps)
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
            {error ? <p className={styles.error}>{error}</p> : null}
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
