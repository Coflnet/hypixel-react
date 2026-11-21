import type { PlaySubscriptionCheckout } from '../api/_generated/skyApi.schemas'
import { PremiumTier } from '../components/Premium/PremiumPurchaseWizard/types'
import { getGeneratedApiMessage, getGeneratedApiSlug } from './GeneratedApiResponseUtils'

export const PLAY_SUBSCRIPTIONS_ENABLED = false
export const PLAY_STORE_LISTING = 'https://play.google.com/store/apps/details?id=com.coflnet.sky'
export const PLAY_SUBSCRIPTION_MANAGEMENT = 'https://play.google.com/store/account/subscriptions'
export const PLAY_WEBSITE_CHROME_INTENT = 'intent://sky.coflnet.com/premium#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end'
export const PLAY_CHECKOUT_UNAVAILABLE = 'Google Play checkout is temporarily unavailable. Please try again later.'
export const PLAY_SUBSCRIPTION_SLUGS = ['l_premium', 'l_prem_plus'] as const
export type PlaySubscriptionSlug = (typeof PLAY_SUBSCRIPTION_SLUGS)[number]

export function getPlaySubscriptionLabel(slug: PlaySubscriptionSlug): string {
    return slug === 'l_premium' ? 'Premium' : 'Premium+'
}

export function getPlayPurchaseMode(app: boolean, update: boolean): 'web' | 'play' | 'update' {
    if (!app) return 'web'
    return update ? 'update' : 'play'
}

export function getInitialPlayPlan(tier: PremiumTier | null, forFriends: boolean): PlaySubscriptionSlug | '' {
    if (forFriends || tier === PremiumTier.STARTER) return ''
    return tier === PremiumTier.PREMIUM_PLUS ? 'l_prem_plus' : 'l_premium'
}

export function isPlayCheckoutExpired(receivedAt: number, now = performance.now()): boolean {
    return now - receivedAt >= 9 * 60 * 1000
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

const PROVIDER_NAMES: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    lemonsqueezy: 'Lemon Squeezy',
    googleplay: 'Google Play'
}

export function getPlayCheckoutError(status?: number, data?: unknown): PlayCheckoutError {
    if (status === 428) return { kind: 'terms' }
    if (status === 401 || status === 403) {
        return { kind: 'signIn', message: 'Sign in to your SkyCofl account to subscribe.' }
    }
    if (status === 400 && getGeneratedApiSlug(data) === 'active_subscription') {
        // SkyApi includes the blocking provider in the message when Payments returned one.
        const providerSlug = getGeneratedApiMessage(data)?.match(/billed by (stripe|paypal|lemonsqueezy|googleplay)\.?$/i)?.[1].toLowerCase()
        const provider = providerSlug && PROVIDER_NAMES[providerSlug]
        return { kind: 'error', message: provider ? `You already have an active subscription billed by ${provider}.` : 'You already have an active subscription.' }
    }
    if (status === 400) return { kind: 'error', message: 'This subscription plan is unavailable in Google Play.' }
    return { kind: 'error', message: PLAY_CHECKOUT_UNAVAILABLE }
}

type PlayBillingResult = { kind: 'processing' | 'error'; message: string }

const BILLING_FAILURE: PlayBillingResult = {
    kind: 'error',
    message: 'Google Play reported a checkout problem. Check your purchases in Google Play before trying again.'
}

export function getPlayBillingError(encodedError: string): PlayBillingResult {
    let error: string
    try {
        error = decodeURIComponent(encodedError).toLowerCase()
    } catch {
        return BILLING_FAILURE
    }
    switch (error) {
        case 'purchase canceled by user':
            return { kind: 'error', message: 'The purchase was cancelled.' }
        case 'this subscription belongs to a different skycofl account':
        case 'could not verify which skycofl account owns this subscription':
        case 'could not check subscription ownership in google play':
            return { kind: 'error', message: 'This purchase may already be active in Google Play or belong to another SkyCofl account. Check your subscriptions in Google Play.' }
        case 'could not securely save the subscription':
        case 'could not securely save the subscription for confirmation':
            return { kind: 'processing', message: 'Your payment is processing. Check your subscription status before trying again.' }
        case 'server completed the purchase, but play consumption will be retried':
        case 'purchase completion was interrupted and will be retried':
            return { kind: 'processing', message: 'Your CoflCoins purchase is processing. Check your balance before trying again.' }
        case 'this purchase cannot be completed automatically. contact support.':
            return { kind: 'error', message: 'This CoflCoins purchase cannot be completed automatically. Please contact support before trying again.' }
        default:
            return BILLING_FAILURE
    }
}

export function getPlaySubscriptionResult(hash: string, failed: boolean) {
    const prefix = failed ? '#billing_error_' : '#billing_success_'
    const slug = PLAY_SUBSCRIPTION_SLUGS.find(slug => failed ? hash.startsWith(`${prefix}${slug}_`) : hash === `${prefix}${slug}`)
    if (!slug) return null
    if (!failed) return { slug, error: null }
    return { slug, error: getPlayBillingError(hash.slice(`${prefix}${slug}_`.length)).message }
}
