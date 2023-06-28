'use client'
import { useEffect, useState } from 'react'
import styles from './OfflineBanner.module.css'

export function OfflineBanner(props: any) {
    let [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        window.addEventListener('online', setOnlineState)
        window.addEventListener('offline', setOnlineState)

        return () => {
            window.removeEventListener('online', setOnlineState)
            window.removeEventListener('offline', setOnlineState)
        }
    }, [])

    function setOnlineState() {
        setIsOnline(navigator.onLine)
    }

    return (
        <div>
            {!isOnline ? (
                <div id="offline-banner" className={styles.offlineBanner}>
                    <span style={{ color: 'white' }}>No connection</span>
                </div>
            ) : (
                ''
            )}
        </div>
    )
}
