'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Spinner } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import { getFavoriteItems } from '../../utils/FavoriteItemUtils'
import FavoriteToggle from './FavoriteToggle'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import styles from './FavoriteItemsBar.module.css'

const REFRESH_INTERVAL = 5 * 60 * 1000

function FavoriteItemsBar() {
    let [favorites, setFavorites] = useState<FavoriteItemEntry[]>(() => getFavoriteItems())
    let [priceMovements, setPriceMovements] = useState<Record<string, ItemPriceMovement>>({})
    let [isLoading, setIsLoading] = useState(false)
    let [error, setError] = useState<string | null>(null)

    useEffect(() => {
        function load() {
            setFavorites(getFavoriteItems())
        }

        load()

        function onFavoritesUpdated(event?: Event) {
            let detailFavorites = (event as CustomEvent)?.detail as FavoriteItemEntry[] | undefined
            if (Array.isArray(detailFavorites)) {
                setFavorites(detailFavorites)
            } else {
                load()
            }
        }

        document.addEventListener(CUSTOM_EVENTS.FAVORITES_UPDATED, onFavoritesUpdated)
        return () => {
            document.removeEventListener(CUSTOM_EVENTS.FAVORITES_UPDATED, onFavoritesUpdated)
        }
    }, [])

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
                let data = await api.getPriceMovements(favorites.map(f => f.tag))
                if (!cancelled) {
                    setPriceMovements(data)
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
                    const currentPrice = movement?.now
                    const previousPrice = movement?.recent
                    const delta: number | null = currentPrice !== undefined && previousPrice !== undefined ? currentPrice - previousPrice : null
                    let percentChange: number | null = null
                    if (delta !== null && previousPrice !== undefined && Math.abs(previousPrice) > 1) {
                        percentChange = (delta / previousPrice) * 100
                    }
                    const monthlyPrice = movement?.monthly
                    const monthlyDelta: number | null = currentPrice !== undefined && monthlyPrice !== undefined ? currentPrice - monthlyPrice : null
                    const monthlyTooltip =
                        monthlyDelta !== null
                            ? `Monthly change: ${monthlyDelta >= 0 ? '+' : ''}${numberWithThousandsSeparators(Math.round(monthlyDelta))} coins`
                            : isMovementLoading
                              ? 'Loading monthly comparison…'
                              : 'Monthly comparison unavailable'
                    const isPositive = (delta ?? 0) >= 0
                    const itemName = favorite.name || convertTagToName(favorite.tag)
                    const item: Item = {
                        tag: favorite.tag,
                        name: favorite.name,
                        iconUrl: favorite.iconUrl,
                        bazaar: favorite.bazaar
                    }
                    const iconSrc = item.iconUrl || api.getItemImageUrl(item)
                    return (
                        <article key={favorite.tag} className={styles.card}>
                            <Link href={`/item/${favorite.tag}`} className={styles.cardLink}>
                                <div className={styles.iconWrapper}>
                                    <Image src={iconSrc} alt="" width={40} height={40} />
                                </div>
                                <div className={styles.details}>
                                    <span className={styles.name}>{itemName}</span>
                                    <div className={styles.stats}>
                                        <span
                                            className={`${styles.delta} ${delta !== null ? (isPositive ? styles.positive : styles.negative) : ''} ${
                                                isMovementLoading ? styles.skeletonInline : ''
                                            }`}
                                            title={monthlyTooltip}
                                        >
                                            {movement && delta !== null
                                                ? delta === 0
                                                    ? 'No change'
                                                    : `${isPositive ? '+' : ''}${numberWithThousandsSeparators(Math.round(delta))} coins`
                                                : isMovementLoading
                                                  ? ''
                                                  : 'No data'}
                                            {movement && percentChange !== null && delta !== 0 ? (
                                                <span className={styles.percent}>
                                                    {' '}
                                                    ({`${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`})
                                                </span>
                                            ) : null}
                                        </span>
                                        {movement && currentPrice !== undefined ? (
                                            <Badge bg="secondary">Now: {numberWithThousandsSeparators(Math.round(currentPrice))}</Badge>
                                        ) : isMovementLoading ? (
                                            <span className={`${styles.skeletonInline} ${styles.badgeSkeleton}`} aria-hidden="true"></span>
                                        ) : null}
                                    </div>
                                </div>
                            </Link>
                            <div className={styles.actions}>
                                <SubscribeButton
                                    topic={favorite.tag}
                                    type={favorite.bazaar ? 'bazaar' : 'item'}
                                    buttonContent={<span>Notify</span>}
                                />
                                <FavoriteToggle item={item} size="small" />
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

export default FavoriteItemsBar
