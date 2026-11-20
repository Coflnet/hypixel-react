import { useEffect, useState } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { useGetApiPremiumDiscountAuto, useGetApiPremiumSubscriptionProviders } from '../api/_generated/skyApi'
import type { AutoDiscount } from '../api/_generated/skyApi.schemas'
import {
    PaymentProvider,
    ProviderMode,
    getCodeProvider,
    getDirectProviders,
    getProviderMode,
    getNextPromotionChange,
    getPromotionFor,
    isPromotionRunning
} from '../utils/SubscriptionCheckout'
import { useCountryDetection } from './useCountryDetection'

const PROVIDERS_STALE_TIME = 10 * 60 * 1000
/** setTimeout fires at once for longer delays; a later change is scheduled again when this one fires */
const MAX_TIMEOUT = 2 ** 31 - 1

/**
 * The direct providers (Stripe, PayPal) a buyer from `country` can subscribe with, for `productSlug` when given.
 * Empty while they are off, or when the request fails (e.g. before the backend knows the endpoint): the checkout then
 * keeps the single Lemon Squeezy button. Another country or product keeps the last answer until its own arrives,
 * so a code applied for it is not dropped and applied again; `loading` stays true meanwhile so no checkout opens with it.
 */
export function useSubscriptionProviders(country?: string, productSlug?: string) {
    const query = useGetApiPremiumSubscriptionProviders(
        { country, productSlug },
        { query: { enabled: !!country, staleTime: PROVIDERS_STALE_TIME, retry: false, placeholderData: keepPreviousData } }
    )
    const providers = query.data?.status === 200 ? getDirectProviders(query.data.data) : []
    const mode = query.data?.status === 200 ? getProviderMode(query.data.data) : null
    const pending = !country || query.isLoading
    return { providers, mode, loading: pending || query.isPlaceholderData, codeProvider: getCodeProvider(providers, pending) }
}

/** the current time, renewed when `promotion` starts or ends so the page stops applying it at its end */
function usePromotionClock(promotion: AutoDiscount | null): Date {
    const [now, setNow] = useState(() => new Date())
    const next = getNextPromotionChange(promotion, now)
    useEffect(() => {
        if (next === null) return
        const timer = setTimeout(() => setNow(new Date()), Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT))
        return () => clearTimeout(timer)
        // `now` too: a timer that fired early is scheduled again
    }, [next, now])
    return now
}

/** the promotion new subscriptions from `country` get automatically while it runs; fetched once per country and page */
export function useAutoPromotion(country?: string) {
    const query = useGetApiPremiumDiscountAuto(
        { country },
        { query: { enabled: !!country, staleTime: Infinity, retry: false, placeholderData: keepPreviousData } }
    )
    const promotion: AutoDiscount | null = query.data?.status === 200 ? query.data.data : null
    const now = usePromotionClock(promotion)
    return { promotion: isPromotionRunning(promotion, now) ? promotion : null, loading: !country || query.isLoading }
}

export interface CheckoutOffer {
    /** direct providers to offer, card first; empty for the Lemon Squeezy checkout */
    providers: PaymentProvider[]
    /** the automatic promotion, only when one of `providers` honours it */
    promotion: AutoDiscount | null
    /** how the providers bill: `managed` (Stripe adds the tax, the page shows net prices) or `direct`; null without providers */
    mode: ProviderMode | null
    /** the provider a discount code is checked for, undefined while unknown */
    codeProvider?: PaymentProvider
    /** true until the providers of this country and product are known; no checkout may open meanwhile */
    loading: boolean
}

/** how a new subscription can be paid and which promotion it gets; without a product slug for the whole country */
export function useCheckoutOffer(country?: string, productSlug?: string): CheckoutOffer {
    const providers = useSubscriptionProviders(country, productSlug)
    const auto = useAutoPromotion(country)
    return {
        providers: providers.providers,
        promotion: getPromotionFor(auto.promotion, providers.providers),
        mode: providers.mode,
        codeProvider: providers.codeProvider,
        loading: providers.loading || auto.loading
    }
}

/**
 * The promotion the visitor's country gets right now, for banners outside a checkout. Null while it is unknown (server-rendered
 * page, country or providers still loading) and when none runs for the country's providers.
 */
export function useVisitorPromotion(): AutoDiscount | null {
    const countryCode = useCountryDetection().selectedCountry?.value
    const offer = useCheckoutOffer(countryCode)
    // after a country change the previous country's promotion is kept until this country's answers arrived
    return offer.loading ? null : offer.promotion
}
