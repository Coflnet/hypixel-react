import styles from './ListItemAdElementAdBlockBackup.module.css'

export default function ListItemAdElementAdBlockBackup() {
    return (
        <div className={styles.backupContainer}>
            <div className={styles.spinner} />
            <div className={styles.fallbackText}>
                Get premium to remove the ad slots
            </div>
        </div>
    )
}