'use client'
import { useEffect, useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import styles from './LoopDetectionBanner.module.css'

const LOOP_STORAGE_KEY = 'pageLoadLoop'
const HYDRATION_ERROR_KEY = 'hydrationErrorDetected'
const LOOP_DETECTION_WINDOW = 10000 // 10 seconds
const LOOP_THRESHOLD = 4 // Number of loads in the window to trigger the banner

interface LoadRecord {
    url: string
    timestamp: number
}

function LoopDetectionBanner() {
    const [showBanner, setShowBanner] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [isHydrationError, setIsHydrationError] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            // Check if user has permanently dismissed the banner
            if (sessionStorage.getItem('loopBannerDismissed') === 'true') {
                return
            }

            // Listen for hydration errors (React error #418)
            const handleError = (event: ErrorEvent) => {
                if (event.message?.includes('#418') || event.message?.includes('Hydration')) {
                    sessionStorage.setItem(HYDRATION_ERROR_KEY, 'true')
                    setIsHydrationError(true)
                    setShowBanner(true)
                }
            }
            window.addEventListener('error', handleError)

            // Check if there was a previous hydration error
            if (sessionStorage.getItem(HYDRATION_ERROR_KEY) === 'true') {
                setIsHydrationError(true)
                setShowBanner(true)
                return
            }

            const now = Date.now()
            const currentUrl = window.location.pathname

            // Get existing load records
            let loadRecords: LoadRecord[] = []
            try {
                const stored = sessionStorage.getItem(LOOP_STORAGE_KEY)
                if (stored) {
                    loadRecords = JSON.parse(stored)
                }
            } catch (e) {
                loadRecords = []
            }

            // Add current load
            loadRecords.push({ url: currentUrl, timestamp: now })

            // Filter to only recent loads within the detection window
            loadRecords = loadRecords.filter(r => now - r.timestamp < LOOP_DETECTION_WINDOW)

            // Save back to storage
            sessionStorage.setItem(LOOP_STORAGE_KEY, JSON.stringify(loadRecords))

            // Check if we have a loop - multiple loads of similar URLs in short succession
            const itemPageLoads = loadRecords.filter(r => r.url.startsWith('/item/'))
            
            if (itemPageLoads.length >= LOOP_THRESHOLD) {
                // Check if the loads are alternating between similar URLs (with/without params)
                const uniquePatterns = new Set(itemPageLoads.map(r => r.url.split('?')[0]))
                if (uniquePatterns.size <= 2) {
                    setShowBanner(true)
                    console.warn('Loop detected: Multiple rapid page loads on item page')
                }
            }

            return () => {
                window.removeEventListener('error', handleError)
            }
        } catch (e) {
            console.error('Error in loop detection:', e)
        }
    }, [])

    const handleDismiss = () => {
        setDismissed(true)
        setShowBanner(false)
    }

    const handlePermanentDismiss = () => {
        sessionStorage.setItem('loopBannerDismissed', 'true')
        setDismissed(true)
        setShowBanner(false)
    }

    const handleClearCache = async () => {
        try {
            // Clear service worker caches
            if ('caches' in window) {
                const keys = await caches.keys()
                await Promise.all(keys.map(key => caches.delete(key)))
            }
            
            // Unregister service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations()
                await Promise.all(registrations.map(r => r.unregister()))
            }

            // Clear session storage for this issue
            sessionStorage.removeItem(LOOP_STORAGE_KEY)
            sessionStorage.removeItem(HYDRATION_ERROR_KEY)
            sessionStorage.removeItem('loopBannerDismissed')
            
            // Clear localStorage items that might cause issues
            localStorage.removeItem('chunkErrorReload')
            
            // Hard reload bypassing cache
            window.location.href = window.location.href.split('?')[0] + '?cache_bust=' + Date.now()
        } catch (e) {
            console.error('Error clearing cache:', e)
            window.location.reload()
        }
    }

    if (!showBanner || dismissed) {
        return null
    }

    return (
        <Alert variant="warning" className={styles.loopBanner} onClose={handleDismiss} dismissible>
            <Alert.Heading>⚠️ {isHydrationError ? 'Cache Conflict Detected' : 'Page Loading Issue Detected'}</Alert.Heading>
            <p>
                {isHydrationError 
                    ? 'Your browser has outdated cached files that are conflicting with the current page. This needs to be fixed to use the site properly.'
                    : 'We noticed this page might be reloading repeatedly. This is usually caused by cached data conflicts.'}
            </p>
            <p>
                <strong>Try one of these solutions:</strong>
            </p>
            <ul>
                <li><strong>Recommended:</strong> Click the button below to clear the cache and reload</li>
                <li>Open this page in an <strong>Incognito/Private window</strong></li>
                <li>Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> (or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> on Mac) for a hard refresh</li>
            </ul>
            <div className={styles.buttonGroup}>
                <Button variant="primary" onClick={handleClearCache}>
                    🔄 Clear Cache & Reload
                </Button>
                <Button variant="outline-secondary" onClick={handlePermanentDismiss}>
                    Don't show again
                </Button>
            </div>
        </Alert>
    )
}

export default LoopDetectionBanner
