// A/B test of the /premium page. This is the only place to configure it: to end the test,
// set one variant's weight to 100 (and the other to 0). Renaming the experiment reshuffles everyone.
// Nothing is stored on the device: the variant is derived on every request from a hash of the experiment name,
// the UTC day and the user agent.
// Why the day: browsers send reduced user agents, so whole groups (e.g. "Chrome 131 on Windows") share one string
// and land in the same arm. A fixed split would make the two arms differ systematically by browser and device.
// With the day in the hash every group changes arm from day to day, so the imbalance averages out over a test
// that runs for weeks, while a visitor stays in one variant within a UTC day.
// Pure module: used by the middleware (edge runtime), the page and the Cypress unit specs. The caller passes the
// current time in (`VariantRequest.now`), so the functions stay deterministic.

export type PremiumVariant = 'current' | 'new'

export interface PremiumExperimentConfig {
    /** lowercase letters, digits and dashes; it is the Matomo event action of the exposure event */
    name: string
    weights: Record<PremiumVariant, number>
}

export const PREMIUM_EXPERIMENT: PremiumExperimentConfig = {
    name: 'premium-page-2026-11',
    weights: { current: 50, new: 50 }
}

export const CONTROL_VARIANT: PremiumVariant = 'current'
export const PREMIUM_VARIANTS: PremiumVariant[] = ['current', 'new']
/** QA override for a single request, e.g. /premium?premiumVariant=new */
export const PREMIUM_VARIANT_QUERY = 'premiumVariant'
/** request header the middleware uses to hand the resolved variant to the page */
export const PREMIUM_VARIANT_HEADER = 'x-premium-variant'
/** value of PREMIUM_VARIANT_HEADER for bots: they get the control but are not part of the experiment (no tracking) */
export const BOT_VARIANT_VALUE = 'bot'

const BOT_PATTERN =
    /bot[/;_-]|bot$|crawl|spider|slurp|mediapartners|facebookexternalhit|facebookcatalog|embedly|quora link preview|vkshare|w3c_validator|whatsapp|telegrambot|discordbot|bingpreview|semrush|ahrefs|yandexbot|baiduspider|petalbot|bytespider|gptbot|claudebot|ccbot|perplexity|applebot|python-requests|curl\/|wget\//i

/** the header value the middleware hands to the page */
export function getVariantHeaderValue(decision: VariantDecision): string {
    return decision.inExperiment ? decision.variant : BOT_VARIANT_VALUE
}

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
    if (!userAgent) return true
    return BOT_PATTERN.test(userAgent)
}

export function isPremiumVariant(value: unknown): value is PremiumVariant {
    return typeof value === 'string' && (PREMIUM_VARIANTS as string[]).includes(value)
}

/** 32-bit FNV-1a over the UTF-16 code units, followed by the murmur3 finalizer so all bits are well mixed */
export function hashText(text: string): number {
    let hash = 0x811c9dc5
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
    }
    hash ^= hash >>> 16
    hash = Math.imul(hash, 0x85ebca6b)
    hash ^= hash >>> 13
    hash = Math.imul(hash, 0xc2b2ae35)
    hash ^= hash >>> 16
    return hash >>> 0
}

/** `YYYY-MM-DD` of `now` in UTC, so the split changes at the same moment for every server and visitor */
export function formatUtcDay(now: Date): string {
    return now.toISOString().slice(0, 10)
}

/**
 * The visitor's position in [0, 1): the same user agent lands on the same spot of the same experiment for the
 * whole UTC day of `now`, and on an unrelated spot the next day.
 */
export function getUserAgentBucket(userAgent: string, now: Date, config: PremiumExperimentConfig = PREMIUM_EXPERIMENT): number {
    return hashText(`${config.name}\n${formatUtcDay(now)}\n${userAgent}`) / 2 ** 32
}

/** weighted pick in the order of PREMIUM_VARIANTS; `bucket` is a number in [0, 1) */
export function pickVariant(bucket: number, config: PremiumExperimentConfig = PREMIUM_EXPERIMENT): PremiumVariant {
    const total = PREMIUM_VARIANTS.reduce((sum, variant) => sum + Math.max(0, config.weights[variant]), 0)
    if (total <= 0) return CONTROL_VARIANT
    let threshold = bucket * total
    for (const variant of PREMIUM_VARIANTS) {
        const weight = Math.max(0, config.weights[variant])
        if (threshold < weight) return variant
        threshold -= weight
    }
    return CONTROL_VARIANT
}

export interface VariantRequest {
    queryOverride?: string | null
    userAgent?: string | null
    /** the time of the request; its UTC day is part of the hash */
    now: Date
}

export interface VariantDecision {
    variant: PremiumVariant
    /** false for bots: they see the control but are not counted in the experiment */
    inExperiment: boolean
}

export function resolvePremiumVariant(request: VariantRequest, config: PremiumExperimentConfig = PREMIUM_EXPERIMENT): VariantDecision {
    const { userAgent, queryOverride, now } = request
    if (!userAgent || isBotUserAgent(userAgent)) return { variant: CONTROL_VARIANT, inExperiment: false }
    if (isPremiumVariant(queryOverride)) return { variant: queryOverride, inExperiment: true }
    return { variant: pickVariant(getUserAgentBucket(userAgent, now, config), config), inExperiment: true }
}

/**
 * Adds the QA override of the current url to a link to /premium, so a QA visitor keeps the variant when a link
 * reloads the page. Nothing is stored: without the query parameter the link is returned unchanged.
 */
export function withVariantOverride(href: string, queryOverride: string | null | undefined): string {
    if (!isPremiumVariant(queryOverride)) return href
    const url = new URL(href, 'http://placeholder')
    url.searchParams.set(PREMIUM_VARIANT_QUERY, queryOverride)
    return url.pathname + url.search + url.hash
}
