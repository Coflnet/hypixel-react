import { useEffect, useState } from 'react'
import { getApiPremiumSlotsProducts, postApiTopupRates } from '../api/_generated/skyApi'
import type { BatchProductPricingResponse, PurchaseableProduct } from '../api/_generated/skyApi.schemas'
import { getProvider, getPriceWithVAT, shouldIncludeVAT } from '../utils/PricingUtils'

export default function useSlotCatalog(countryCode?: string) {
    const [products, setProducts] = useState<PurchaseableProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [catalogError, setCatalogError] = useState(false)
    const [pricing, setPricing] = useState<BatchProductPricingResponse>()
    const [pricingCountry, setPricingCountry] = useState('')
    const [pricingError, setPricingError] = useState(false)
    const [reload, setReload] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setCatalogError(false)
        getApiPremiumSlotsProducts({ signal: controller.signal, cache: 'no-store' })
            .then(response => {
                if (response.status !== 200 || !Array.isArray(response.data)) throw new Error()
                setProducts(
                    response.data.filter(
                        product =>
                            product.slug &&
                            [1, 4].includes(product.slotCount || 0) &&
                            ['premium', 'premium_plus'].includes(product.slotTier || '') &&
                            (product.ownershipSeconds || 0) > 0
                    )
                )
            })
            .catch(() => {
                if (!controller.signal.aborted) setCatalogError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [reload])

    useEffect(() => {
        const subscriptions = products.filter(product => product.slug?.startsWith('l_'))
        if (!countryCode || !subscriptions.length) return
        const controller = new AbortController()
        setPricingError(false)
        setPricingCountry('')
        postApiTopupRates(
            { productSlugs: subscriptions.map(product => product.slug!), countryCode },
            {
                signal: controller.signal,
                headers: { GoogleToken: sessionStorage.getItem('googleId') || '' }
            }
        )
            .then(response => {
                if (response.status !== 200 || !response.data.products) throw new Error()
                if (controller.signal.aborted) return
                setPricing(response.data)
                setPricingCountry(countryCode)
            })
            .catch(() => {
                if (!controller.signal.aborted) setPricingError(true)
            })
        return () => controller.abort()
    }, [products, countryCode])

    const canUsePrices = !!countryCode && pricingCountry === countryCode && !pricingError

    function price(product: PurchaseableProduct) {
        if (!canUsePrices) return undefined
        const provider = getProvider(pricing || null, product.slug!, 'lemonsqueezy')
        if (!provider) return undefined
        // Lemon Squeezy's batch prices are before tax. Round the whole bundle before dividing by slots.
        const withTax = (amount: number) => Math.round(getPriceWithVAT(amount, countryCode) * 100) / 100
        return { ...provider, originalPrice: withTax(provider.originalPrice), discountedPrice: withTax(provider.discountedPrice) }
    }

    function retry() {
        setReload(value => value + 1)
    }

    return {
        products,
        loading,
        catalogError,
        pricingError,
        canUsePrices,
        price,
        retry,
        taxLabel: shouldIncludeVAT(countryCode) ? 'Includes estimated tax' : 'Tax calculated at checkout'
    }
}

export type SlotCatalog = ReturnType<typeof useSlotCatalog>
