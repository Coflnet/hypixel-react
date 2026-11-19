import { useQuery } from '@tanstack/react-query'
import { requestPricing } from '../components/Premium/BuySubscription/useSubscriptionPricing'
import { getProviderPrice } from '../utils/PricingUtils'

const QUOTE_STALE_TIME = 5 * 60 * 1000

/**
 * The quoted price of the 4-week plan a 13/52 week subscription continues with, after the creator code (before VAT and before
 * the discount code): the renewal is computed from it. Null while it loads, without a 4-week plan (`fourWeekSlug` null),
 * without a country or when the quote fails, so the page leaves the renewal price out instead of guessing it.
 */
export function useRenewalPrice(fourWeekSlug: string | null, countryCode: string | undefined, creatorCode: string | null): number | null {
    const query = useQuery({
        queryKey: ['renewal-quote', fourWeekSlug, countryCode, creatorCode ?? ''],
        queryFn: () => requestPricing(fourWeekSlug!, countryCode!, creatorCode ?? ''),
        enabled: !!fourWeekSlug && !!countryCode,
        staleTime: QUOTE_STALE_TIME,
        retry: false
    })
    if (!fourWeekSlug) return null
    const price = getProviderPrice(query.data ?? null, fourWeekSlug, 'lemonsqueezy')
    return price !== null && Number.isFinite(price) ? price : null
}
