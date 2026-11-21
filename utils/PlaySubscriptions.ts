import type { PlaySubscriptionCheckout } from '../api/_generated/skyApi.schemas'
import { PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'
import { getGeneratedApiMessage, getGeneratedApiSlug } from './GeneratedApiResponseUtils'

export const PLAY_SUBSCRIPTIONS_ENABLED = false
export const PLAY_STORE_LISTING = 'https://play.google.com/store/apps/details?id=com.coflnet.sky'
export const PLAY_SUBSCRIPTION_MANAGEMENT = 'https://play.google.com/store/account/subscriptions'
export const PLAY_CHECKOUT_UNAVAILABLE = 'Google Play checkout is temporarily unavailable. Please try again later.'
export const PLAY_SUBSCRIPTION_SLUGS = ['l_premium', 'l_prem_plus'] as const
export type PlaySubscriptionSlug = (typeof PLAY_SUBSCRIPTION_SLUGS)[number]

export function getPlaySubscriptionLabel(slug: PlaySubscriptionSlug): string {
    return slug === 'l_premium' ? 'Premium' : 'Premium+'
}

export function getPlayPurchaseMode(enabled: boolean, isAndroidApp: boolean, update: boolean): 'web' | 'play' | 'update' {
    if (!enabled) return 'web'
    if (update) return 'update'
    return isAndroidApp ? 'play' : 'web'
}

export function getInitialPlayPlan(tier: PremiumTier | null, forFriends: boolean): PlaySubscriptionSlug | '' {
    if (forFriends || tier === PremiumTier.STARTER) return ''
    return tier === PremiumTier.PREMIUM_PLUS ? 'l_prem_plus' : 'l_premium'
}

export function isPlayCheckoutExpired(expiresAt: number, now = Date.now()): boolean {
    return !Number.isFinite(expiresAt) || now >= expiresAt * 1000
}

export function buildPlaySubscriptionIntent(slug: PlaySubscriptionSlug, checkout: PlaySubscriptionCheckout): string {
    const query = Object.entries({
        productId: checkout.playProductId,
        basePlanId: checkout.basePlanId,
        userId: checkout.obfuscatedAccountId,
        slug,
        label: checkout.accountLabel,
        exp: checkout.expiresAt,
        sig: checkout.signature
    }).map(([key, value]) => key + '=' + encodeURIComponent(value)).join('&')
    const fallback = encodeURIComponent('https://sky.coflnet.com/premium?playUpdate=1')
    return `intent://subscribe?${query}#Intent;scheme=skycofl;package=com.coflnet.sky;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallback};end`
}

type PlayCheckoutError = { kind: 'terms' } | { kind: 'signIn' | 'error'; message: string }

export function getPlayCheckoutError(status?: number, data?: unknown): PlayCheckoutError {
    if (status === 428) return { kind: 'terms' }
    if (status === 401 || status === 403) {
        return { kind: 'signIn', message: 'Sign in to your SkyCofl account to subscribe.' }
    }
    if (status === 400 && getGeneratedApiSlug(data) === 'active_subscription') {
        // SkyApi includes the blocking provider in the message when Payments returned one.
        return { kind: 'error', message: getGeneratedApiMessage(data) ?? 'You already have an active subscription.' }
    }
    if (status === 400) return { kind: 'error', message: 'This subscription plan is unavailable in Google Play.' }
    return { kind: 'error', message: PLAY_CHECKOUT_UNAVAILABLE }
}

export function getPlaySubscriptionResult(hash: string, failed: boolean) {
    const prefix = failed ? '#billing_error_' : '#billing_success_'
    const slug = PLAY_SUBSCRIPTION_SLUGS.find(slug => failed ? hash.startsWith(`${prefix}${slug}_`) : hash === `${prefix}${slug}`)
    if (!slug) return null
    if (!failed) return { slug, error: null }
    try {
        return { slug, error: decodeURIComponent(hash.slice(`${prefix}${slug}_`.length)) }
    } catch {
        return { slug, error: 'Google Play could not complete the purchase.' }
    }
}
