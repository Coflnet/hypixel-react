/** How a response to a premium-gated endpoint should be treated. */
export type PremiumResponseProblem = 'invalidToken' | 'premiumRequired' | 'other'

/** Non-2xx bodies of premium-gated endpoints carry an error `slug`. */
interface PremiumErrorBody {
    slug?: string
}

/**
 * Classifies a response of a premium-gated endpoint by status and error slug:
 * undefined for a 200 (nothing to report), 'invalidToken' for an expired/rejected token (401, or slug `invalid_token`),
 * 'premiumRequired' for a valid token without enough premium (403, or slug `premium_required`)
 * and 'other' for any other non-200 (a real error).
 */
export function classifyPremiumResponse(status: number | undefined, data: unknown): PremiumResponseProblem | undefined {
    if (status === undefined || status === 200) {
        return undefined
    }
    const slug = (data as PremiumErrorBody | undefined)?.slug
    if (slug === 'invalid_token' || status === 401) {
        return 'invalidToken'
    }
    if (slug === 'premium_required' || status === 403) {
        return 'premiumRequired'
    }
    return 'other'
}
