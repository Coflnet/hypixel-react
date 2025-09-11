/**
 * Utility functions for detecting platform-specific environments
 */

/**
 * Detects if the app is running in a Google Play Store PWA context
 * This checks for the TWA (Trusted Web Activity) environment which is used
 * when the PWA is installed from the Google Play Store
 */
export function isGooglePlayStorePWA(): boolean {
    if (typeof window === 'undefined') {
        return false
    }

    // Check if running in a TWA (Trusted Web Activity)
    // TWAs are detected by the presence of specific query parameters or headers
    const urlParams = new URLSearchParams(window.location.search)
    const isTWA = urlParams.has('utm_source') && urlParams.get('utm_source') === 'pwa'
    
    // Check for Android Chrome in standalone mode (which could be from Play Store)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://')
    
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg|Edge/i.test(navigator.userAgent)
    
    // Additional check for TWA environment variables
    const hasTWAFeatures = 'getInstalledRelatedApps' in navigator ||
                          window.location.href.includes('utm_source=pwa') ||
                          sessionStorage.getItem('google-play-billing-enabled') === 'true'
    
    return isAndroid && isChrome && isStandalone && (isTWA || hasTWAFeatures)
}

/**
 * Detects if Google Play Billing is available
 * This would be true in a TWA environment where the billing API is available
 */
export function isGooglePlayBillingAvailable(): boolean {
    if (typeof window === 'undefined') {
        return false
    }

    // Check if the Google Play Billing interface is available
    // This would be injected by the TWA wrapper
    return !!(window as any).googlePlayBilling || 
           !!(window as any).AndroidInterface?.purchaseItem ||
           sessionStorage.getItem('google-play-billing-enabled') === 'true'
}

/**
 * Detects if the app is running as a PWA (Progressive Web App)
 */
export function isPWA(): boolean {
    if (typeof window === 'undefined') {
        return false
    }

    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://')
}

/**
 * For development/testing purposes - allows forcing Google Play Store context
 */
export function enableGooglePlayStoreModeForTesting(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('google-play-billing-enabled', 'true')
        console.log('Google Play Store mode enabled for testing')
    }
}

/**
 * Disable Google Play Store testing mode
 */
export function disableGooglePlayStoreModeForTesting(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google-play-billing-enabled')
        console.log('Google Play Store mode disabled')
    }
}
