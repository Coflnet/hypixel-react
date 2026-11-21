export function isAndroidApp(): boolean {
    return typeof window !== 'undefined' &&
        /android/i.test(navigator.userAgent) &&
        (document.referrer.includes('android-app://com.coflnet.sky') || window.matchMedia('(display-mode: standalone)').matches)
}
