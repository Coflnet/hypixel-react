'use client'

import { useEffect, useState } from 'react'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import StarIcon from '@mui/icons-material/Star'
import styles from './FavoriteToggle.module.css'
import { isItemFavorite } from '../../utils/FavoriteItemUtils'
import { useFavorites } from './FavoritesContext'

interface Props {
    item?: Item
    className?: string
    showLabel?: boolean
    size?: 'small' | 'medium'
}

function FavoriteToggle({ item, className, showLabel = false, size = 'medium' }: Props) {
    const { toggle } = useFavorites()
    let [isFavorite, setIsFavorite] = useState(false)

    useEffect(() => {
        if (!item?.tag) {
            setIsFavorite(false)
            return
        }
        setIsFavorite(isItemFavorite(item.tag))
    }, [item?.tag])

    function onToggle() {
        if (!item?.tag) {
            return
        }

        let entry: FavoriteItemEntry = {
            tag: item.tag,
            name: item.name,
            iconUrl: item.iconUrl,
            bazaar: item.bazaar
        }

        const isFav = toggle(entry)
        setIsFavorite(isFav)
    }

    let classNames = [styles.button]
    if (isFavorite) {
        classNames.push(styles.active)
    }
    if (size === 'small') {
        classNames.push(styles.small)
    }
    if (className) {
        classNames.push(className)
    }

    return (
        <button
            type="button"
            className={classNames.join(' ')}
            onClick={onToggle}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            {isFavorite ? <StarIcon fontSize="inherit" /> : <StarBorderIcon fontSize="inherit" />}
            {showLabel ? <span className={styles.label}>{isFavorite ? 'Favorited' : 'Favorite'}</span> : null}
        </button>
    )
}

export default FavoriteToggle
