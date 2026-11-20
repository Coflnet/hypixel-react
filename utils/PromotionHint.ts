import { getApiPremiumDiscountAuto } from '../api/_generated/skyApi'
import type { AutoDiscount } from '../api/_generated/skyApi.schemas'
import { isPromotionRunning } from './SubscriptionCheckout'

/** the server asks again after this many seconds; a promotion starts or ends at most this late on the reserved space */
const HINT_REVALIDATE_SECONDS = 300
/** a slow answer must not hold the page back: without it no space is reserved */
const HINT_TIMEOUT_MS = 1500

/** Cloudflare's country header of the request, e.g. "DE"; its "XX" (unknown) and "T1" (Tor) count as unknown */
export const COUNTRY_HEADER = 'cf-ipcountry'

function toCountry(value: string | null | undefined): string | undefined {
    const code = value?.trim().toUpperCase()
    if (!code || !/^[A-Z]{2}$/.test(code) || code === 'XX') return undefined
    return code
}

/**
 * The promotion the visitor likely gets, fetched on the server: the one of `country` (a dynamic page passes Cloudflare's country
 * header), otherwise the one that runs without a country (most visitors get it). The sale banner reserves its space with it while
 * the visitor's own promotion loads, so the page does not shift when it appears; null while none runs (nothing reserved).
 */
export async function getLikelyPromotion(country?: string | null): Promise<AutoDiscount | null> {
    const code = toCountry(country)
    try {
        const response = await getApiPremiumDiscountAuto(code ? { country: code } : undefined, {
            next: { revalidate: HINT_REVALIDATE_SECONDS },
            signal: AbortSignal.timeout(HINT_TIMEOUT_MS)
        })
        if (response.status !== 200 || !response.data) return null
        return isPromotionRunning(response.data) ? response.data : null
    } catch {
        return null
    }
}
