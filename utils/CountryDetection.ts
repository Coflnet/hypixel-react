// The visitor's country from their IP address, for prices, taxes and the referral program.
// SkyApi answers with the country Cloudflare saw (GET /api/premium/country); no third party is asked.
// It is requested once per page load and kept in memory only: nothing is stored on the device.

import { getApiPremiumCountry } from '../api/_generated/skyApi'

/** a request that hangs (e.g. a firewall dropping it) must not keep the country unknown and the country select disabled */
export const DETECTION_TIMEOUT_MS = 5000
/** where earlier versions kept the country on the device without consent */
const LEGACY_STORAGE_KEYS = ['userCountryCode', 'referralRewardsCountry']

let detection: Promise<string | undefined> | undefined

/** an upper-case country code, undefined for anything else (null for an unknown country, an error body) */
function toCountryCode(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value.toUpperCase() : undefined
}

/** the country SkyApi reports; unknown when it fails, times out or does not know the endpoint yet (404) */
async function requestCountryCode(): Promise<string | undefined> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DETECTION_TIMEOUT_MS)
    try {
        const response = await getApiPremiumCountry({ signal: controller.signal })
        if ((response.status as number) !== 200) return undefined
        return toCountryCode(response.data?.country)
    } catch {
        return undefined
    } finally {
        clearTimeout(timer)
    }
}

/** removes the country earlier versions stored on the device */
function forgetStoredCountry() {
    try {
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
    } catch {
        // storage is unavailable (server, blocked site data): nothing was stored there either
    }
}

/** the visitor's upper-case country code, undefined when it is unknown (failed, blocked or timed out); one request per page load */
export function detectVisitorCountryCode(): Promise<string | undefined> {
    if (!detection) {
        forgetStoredCountry()
        detection = requestCountryCode()
    }
    return detection
}
