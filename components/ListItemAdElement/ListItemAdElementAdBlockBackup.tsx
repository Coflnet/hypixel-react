'use client'

import Link from 'next/link'
import { useAds } from '../Providers/AdsProvider'
import styles from './ListItemAdElementAdBlockBackup.module.css'

export default function ListItemAdElementAdBlockBackup() {
    const { shouldShowAds } = useAds()

    if (!shouldShowAds) {
        return null
    }

    return (
        <div className={styles.backupContainer}>
            <div className={styles.spinner} />
            <div className={styles.fallbackText}>
                Get <Link href="/premium?tier=premium">premium</Link> to remove the ad slots
            </div>
        </div>
    )
}