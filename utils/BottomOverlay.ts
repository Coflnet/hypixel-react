// Bars fixed to the bottom of the window can cover the end of the page: the cookie banners and the closable anchor ad.
// The footer keeps its legally required cancellation link reachable by leaving that much space under it.

/** the bottom bars: react-cookie-consent's banner, Nitro's consent banner and the anchor ad (BottomBanner) */
export const BOTTOM_OVERLAY_SELECTORS = ['.CookieConsent', '#ncmp__tool .ncmp__banner', '[id^="bottom-banner"]']

interface Box {
    top: number
    bottom: number
    height: number
}

/** how far the visible boxes reaching the window's bottom edge cover it, in whole pixels; 0 without any */
export function getCoveredHeight(boxes: Box[], viewportHeight: number): number {
    const covering = boxes.filter(box => box.height > 0 && box.top < viewportHeight && box.bottom >= viewportHeight - 1)
    if (covering.length === 0) return 0
    return Math.ceil(Math.max(...covering.map(box => viewportHeight - box.top)))
}
