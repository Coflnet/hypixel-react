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
 * The payment options for `country`, limited to `productSlug` when given. A failed request keeps the Lemon Squeezy
 * fallback. While another country or product loads, the previous providers are kept to preserve applied codes.
 */
export function useSubscriptionProviders(country?: string, productSlug?: string) {
    const query = useGetApiPremiumSubscriptionProviders(
        { country, productSlug },
        { query: { enabled: !!country, staleTime: PROVIDERS_STALE_TIME, retry: false, placeholderData: keepPreviousData } }
    )
    const options = country && query.data?.status === 200 ? query.data.data : undefined
    const providers = getDirectProviders(options)
    const pending = !country || query.isLoading
    const loading = pending || query.isPlaceholderData
    const unavailable = !loading && !query.isError && Array.isArray(options) && options.length === 0
    return {
        providers,
        mode: getProviderMode(options),
        loading,
        unavailable,
        codeProvider: getCodeProvider(providers, pending)
    }
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
    // another country's answer is kept while this country's loads: it is never shown as this country's promotion
    const loading = !country || query.isLoading || query.isPlaceholderData
    const promotion: AutoDiscount | null = !loading && query.data?.status === 200 ? query.data.data : null
    const now = usePromotionClock(promotion)
    return { promotion: isPromotionRunning(promotion, now) ? promotion : null, loading }
}

export interface CheckoutOffer {
    /** direct providers to offer, card first */
    providers: PaymentProvider[]
    /** true only when the providers API returns an empty list for the current country and product */
    unavailable: boolean
    /** the automatic promotion, only when one of `providers` honours it */
    promotion: AutoDiscount | null
    /** how the providers bill: `managed` (Stripe adds the tax, the page shows net prices) or `direct`; null without providers */
    mode: ProviderMode | null
    /** the provider a discount code is checked for, regardless of availability and undefined while unknown */
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
        unavailable: providers.unavailable,
        promotion: getPromotionFor(auto.promotion, providers.providers),
        mode: providers.mode,
        codeProvider: providers.codeProvider,
        loading: providers.loading || auto.loading
    }
}

/**
 * The promotion the visitor's country gets right now, for banners outside a checkout: null while it is unknown and when none runs
 * for the country's providers. `loading` is true until that is known (server-rendered page, country, providers or promotion still
 * loading); a country that cannot be detected settles on no promotion.
 */
export function useVisitorPromotion(): { promotion: AutoDiscount | null; loading: boolean } {
    const country = useCountryDetection()
    const countryCode = country.selectedCountry?.value
    const offer = useCheckoutOffer(countryCode)
    // after a country change the previous country's promotion is kept until this country's answers arrived
    const loading = country.isDetecting || (!!countryCode && offer.loading)
    return { promotion: loading ? null : offer.promotion, loading }
}
