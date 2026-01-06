"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from 'react-bootstrap'
import { useState, useRef, useEffect } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import StarIcon from '@mui/icons-material/Star'
import api from '../../api/ApiHelper'
import { convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import FavoriteToggle from './FavoriteToggle'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import styles from './FavoriteItemsBar.module.css'
import { useFavorites } from './FavoritesContext'

interface Props {
    favorite: FavoriteItemEntry
    movement?: ItemPriceMovement
    isMovementLoading: boolean
}

export default function FavoriteItemCard({ favorite, movement, isMovementLoading }: Props) {
    const { toggle } = useFavorites()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [dropdownOpen])

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

    const handleRemoveFavorite = () => {
        const entry: FavoriteItemEntry = {
            tag: item.tag,
            name: item.name,
            iconUrl: item.iconUrl,
            bazaar: item.bazaar
        }
        toggle(entry)
        setDropdownOpen(false)
    }

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
            {/* Desktop actions */}
            <div className={styles.actionsDesktop}>
                <SubscribeButton
                    topic={favorite.tag}
                    type={favorite.bazaar ? 'bazaar' : 'item'}
                    buttonContent={<span>Notify</span>}
                />
                <FavoriteToggle item={item} size="small" />
            </div>
            {/* Mobile dropdown menu */}
            <div className={styles.actionsMobile} ref={dropdownRef}>
                <div className={styles.mobileDropdown}>
                    <button
                        className={styles.mobileDropdownButton}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-label="More actions"
                        aria-expanded={dropdownOpen}
                    >
                        <MoreVertIcon />
                    </button>
                    {dropdownOpen && (
                        <div className={styles.mobileDropdownMenu}>
                            <SubscribeButton
                                topic={favorite.tag}
                                type={favorite.bazaar ? 'bazaar' : 'item'}
                                buttonContent={
                                    <span className={styles.mobileDropdownItem}>
                                        <NotificationsOutlinedIcon />
                                        Notify
                                    </span>
                                }
                            />
                            <button className={styles.mobileDropdownItem} onClick={handleRemoveFavorite}>
                                <StarIcon style={{ color: '#facc15' }} />
                                Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}
