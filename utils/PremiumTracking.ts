// Typed Matomo events for the /premium page and its purchase funnel. They rely on Matomo's consent requirement:
// `requireConsent` is queued before anything else (Providers.tsx), so Matomo holds the events back and only sends
// them after the visitor consented. Nothing else receives them.
// Fire-and-forget: tracking never throws, also when Matomo is blocked.
// Event names carry `key=value` pairs (variant first) and never personal data.

import { PremiumVariant } from './PremiumExperiment'

export const EXPERIMENT_CATEGORY = 'experiment'
export const PREMIUM_PAGE_CATEGORY = 'premium page'
export const PREMIUM_FUNNEL_CATEGORY = 'premium funnel'

export type PremiumPageAction =
    | 'hero link'
    | 'explorer tab'
    | 'feature selected'
    | 'clip play'
    | 'preview opened'
    | 'plan button'
    | 'closing cta'
    /** an action that needs a signed in account opened the sign-in dialog; `source=plan|coflcoins|slots` */
    | 'sign in prompt'

export type PremiumFunnelAction = 'wizard step' | 'checkout started' | 'coflcoins purchase click' | 'slots click'

export type EventDetails = Record<string, string | number | null | undefined>

export interface MatomoEvent {
    category: string
    action: string
    name?: string
}

export type MatomoQueue = { push(instruction: unknown[]): unknown }

function isPresent(value: unknown): boolean {
    return value !== undefined && value !== null && value !== ''
}

/** `variant=new;tier=premium`; empty values are skipped, `;` and `=` inside values are replaced */
export function formatEventName(details: EventDetails = {}): string | undefined {
    const parts = Object.entries(details)
        .filter(([, value]) => isPresent(value))
        .map(([key, value]) => `${key}=${String(value).replace(/[;=]/g, '_')}`)
    return parts.length > 0 ? parts.join(';') : undefined
}

export function buildPremiumEvent(category: string, action: string, variant: PremiumVariant | undefined, details: EventDetails = {}): MatomoEvent {
    const name = formatEventName({ variant, ...details })
    return name ? { category, action, name } : { category, action }
}

function getMatomoQueue(): MatomoQueue | undefined {
    if (typeof window === 'undefined') return undefined
    return (window as Window & { _paq?: MatomoQueue })._paq
}

/** `queue` defaults to the page's Matomo queue; the unit specs pass a fake */
export function pushMatomoEvent(event: MatomoEvent, queue: MatomoQueue | undefined = getMatomoQueue()): void {
    if (!queue || typeof queue.push !== 'function') return
    const instruction: unknown[] = ['trackEvent', event.category, event.action]
    if (event.name) instruction.push(event.name)
    try {
        queue.push(instruction)
    } catch {
        // tracking must never break the page
    }
}

/** once per page view of a visitor in the experiment */
export function trackExperimentExposure(experimentName: string, variant: PremiumVariant, queue?: MatomoQueue): void {
    pushMatomoEvent({ category: EXPERIMENT_CATEGORY, action: experimentName, name: variant }, queue)
}

export function trackPremiumPageEvent(action: PremiumPageAction, variant: PremiumVariant | undefined, details?: EventDetails, queue?: MatomoQueue): void {
    pushMatomoEvent(buildPremiumEvent(PREMIUM_PAGE_CATEGORY, action, variant, details), queue)
}

/** funnel events only fire on /premium (inside the experiment), so both variants are compared with identical names */
export function trackPremiumFunnelEvent(action: PremiumFunnelAction, variant: PremiumVariant | undefined, details?: EventDetails, queue?: MatomoQueue): void {
    if (!variant) return
    pushMatomoEvent(buildPremiumEvent(PREMIUM_FUNNEL_CATEGORY, action, variant, details), queue)
}
