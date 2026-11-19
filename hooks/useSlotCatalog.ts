import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getApiPremiumSlotsProducts, postApiTopupRates } from '../api/_generated/skyApi'
import type { BatchProductPricingResponse, PurchaseableProduct } from '../api/_generated/skyApi.schemas'
import { applyPercent, getDirectPrice, getRenewalPrice } from '../utils/SubscriptionCheckout'
import { getDiscountPercent, getProvider, getPriceWithVAT } from '../utils/PricingUtils'

const NO_PRODUCTS: PurchaseableProduct[] = []

function isOfferedSlotProduct(product: PurchaseableProduct): boolean {
    return (
        !!product.slug &&
        [1, 4].includes(product.slotCount || 0) &&
        ['premium', 'premium_plus'].includes(product.slotTier || '') &&
        (product.ownershipSeconds || 0) > 0
    )
}

async function fetchSlotProducts(): Promise<PurchaseableProduct[]> {
    const response = await getApiPremiumSlotsProducts({ cache: 'no-store' })
    if (response.status !== 200 || !Array.isArray(response.data)) throw new Error('Could not load the slot catalog')
    return response.data.filter(isOfferedSlotProduct)
}

/**
 * The slot products on offer, loaded once per mount. The query dedupes the request, so React's development double mount
 * does not load the catalog twice. It takes no abort signal: one would make the double mount cancel and repeat the request.
 */
function useSlotProducts() {
    return useQuery({
        queryKey: ['slotCatalog'],
        queryFn: fetchSlotProducts,
        staleTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
    })
}

export default function useSlotCatalog(countryCode?: string) {
    const catalog = useSlotProducts()
    const products = catalog.data ?? NO_PRODUCTS
    const [pricing, setPricing] = useState<BatchProductPricingResponse>()
    const [pricingKey, setPricingKey] = useState('')
    const [creatorCode, setCreatorCode] = useState('')
    const [rejectedCreatorCode, setRejectedCreatorCode] = useState('')
    const [pricingError, setPricingError] = useState(false)

    useEffect(() => {
        const subscriptions = products.filter(product => product.slug?.startsWith('l_'))
        if (!countryCode || !subscriptions.length) return
        const controller = new AbortController()
        setPricingError(false)
        setPricingKey('')
        postApiTopupRates(
            { productSlugs: subscriptions.map(product => product.slug!), countryCode, creatorCode: creatorCode || null },
            {
                signal: controller.signal,
                headers: { GoogleToken: sessionStorage.getItem('googleId') || '' }
            }
        )
            .then(response => {
                if (response.status !== 200 || !response.data.products) throw new Error()
                if (controller.signal.aborted) return
                setPricing(response.data)
                setPricingKey(`${countryCode}|${creatorCode}`)
            })
            .catch(() => {
                if (controller.signal.aborted) return
                if (!creatorCode) return setPricingError(true)
                // a creator code the quote fails for (unknown or expired) is dropped, the prices load again without it
                setRejectedCreatorCode(creatorCode)
                setCreatorCode('')
            })
        return () => controller.abort()
    }, [products, countryCode, creatorCode])

    const canUsePrices = !!countryCode && pricingKey === `${countryCode}|${creatorCode}` && !pricingError

    /** the taxed price of a pre-tax amount: exact for a direct checkout, an estimate rounded to the cent for Lemon Squeezy */
    function taxed(amount: number, percent: number, direct: boolean | 'net') {
        if (direct === 'net') return getDirectPrice(amount, percent, undefined)
        if (direct) return getDirectPrice(amount, percent, countryCode)
        // Lemon Squeezy's batch prices are before tax. Round the whole bundle before dividing by slots.
        return applyPercent(Math.round(getPriceWithVAT(amount, countryCode) * 100) / 100, percent)
    }

    /** the product's prices with tax; `direct` when a Stripe or PayPal checkout bills it */
    function price(product: PurchaseableProduct, direct: boolean | 'net' = false) {
        if (!canUsePrices) return undefined
        const provider = getProvider(pricing || null, product.slug!, 'lemonsqueezy')
        if (!provider) return undefined
        return { ...provider, originalPrice: taxed(provider.originalPrice, 0, direct), discountedPrice: taxed(provider.discountedPrice, 0, direct) }
    }

    /** the product's price with tax after a discount code's percent; the creator code is already in the provider's discounted price */
    function priceWithCode(product: PurchaseableProduct, percent: number, direct: boolean | 'net') {
        if (!canUsePrices) return undefined
        const provider = getProvider(pricing || null, product.slug!, 'lemonsqueezy')
        if (!provider) return undefined
        return taxed(provider.discountedPrice ?? provider.originalPrice, percent, direct)
    }

    /** what a 13/52 week bundle continues at every 4 weeks: its 4-week sibling's price after the creator code and the code's renewal percent; undefined without a price */
    function renewalPrice(fourWeekProduct: PurchaseableProduct, discount: Parameters<typeof getRenewalPrice>[1], net = false) {
        if (!canUsePrices) return undefined
        const provider = getProvider(pricing || null, fourWeekProduct.slug!, 'lemonsqueezy')
        if (!provider) return undefined
        return getRenewalPrice(provider.discountedPrice ?? provider.originalPrice, discount, net ? undefined : countryCode) ?? undefined
    }

    /** percent the applied creator code takes off a product, null without one */
    function creatorPercent(product: PurchaseableProduct) {
        if (!canUsePrices || !creatorCode) return null
        return getDiscountPercent(pricing || null, product.slug!)
    }

    function applyCreatorCode(code: string) {
        setRejectedCreatorCode('')
        setCreatorCode(code.trim())
    }

    function retry() {
        void catalog.refetch()
    }

    return {
        products,
        loading: catalog.isFetching,
        catalogError: catalog.isError && !catalog.isFetching,
        pricingError,
        canUsePrices,
        price,
        priceWithCode,
        renewalPrice,
        creatorCode,
        /** the last creator code the prices could not be loaded with, empty otherwise */
        rejectedCreatorCode,
        applyCreatorCode,
        creatorPercent,
        retry,
        /** the buyer's country; while it is unknown subscription prices are not loaded */
        countryCode
    }
}

export type SlotCatalog = ReturnType<typeof useSlotCatalog>
