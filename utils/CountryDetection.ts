// The visitor's country from their IP address, for prices, taxes and the referral program.
// It is requested once per page load and kept in memory only: nothing is stored on the device.
// TODO: switch to the SkyApi endpoint that reads Cloudflare's country header, then drop this third-party request.

const DETECTION_URL = 'https://api.country.is'
/** a request that hangs (e.g. a firewall dropping it) must not keep the country unknown and the country select disabled */
export const DETECTION_TIMEOUT_MS = 5000
/** where earlier versions kept the country on the device without consent */
const LEGACY_STORAGE_KEYS = ['userCountryCode', 'referralRewardsCountry']

let detection: Promise<string | undefined> | undefined

async function requestCountryCode(): Promise<string | undefined> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DETECTION_TIMEOUT_MS)
    try {
        const response = await fetch(DETECTION_URL, { signal: controller.signal })
        if (!response.ok) return undefined
        const result = await response.json()
        return typeof result?.country === 'string' ? result.country.toUpperCase() : undefined
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
