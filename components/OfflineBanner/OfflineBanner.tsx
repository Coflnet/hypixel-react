'use client'
import { useEffect, useState } from 'react'
import styles from './OfflineBanner.module.css'

export function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        function setOnlineState() {
            setIsOnline(navigator.onLine)
        }

        window.addEventListener('online', setOnlineState)
        window.addEventListener('offline', setOnlineState)
        // The connection may have dropped before hydration, when no listener could see the event.
        setOnlineState()

        return () => {
            window.removeEventListener('online', setOnlineState)
            window.removeEventListener('offline', setOnlineState)
        }
    }, [])

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
