import Link from 'next/link'
import styles from './ListItemAdElementAdBlockBackup.module.css'

export default function ListItemAdElementAdBlockBackup() {
    return (
        <div className={styles.backupContainer}>
            <div className={styles.spinner} />
            <div className={styles.fallbackText}>
                Get <Link href="/premium?tier=premium">premium</Link> to remove the ad slots
            </div>
        </div>
    )
}