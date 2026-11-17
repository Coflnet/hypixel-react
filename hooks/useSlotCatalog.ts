import { useEffect, useState } from 'react'
import { getApiPremiumSlotsProducts, postApiTopupRates } from '../api/_generated/skyApi'
import type { BatchProductPricingResponse, PurchaseableProduct } from '../api/_generated/skyApi.schemas'
import { getDiscountPercent, getProvider, getPriceWithVAT, shouldIncludeVAT } from '../utils/PricingUtils'

export default function useSlotCatalog(countryCode?: string) {
    const [products, setProducts] = useState<PurchaseableProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [catalogError, setCatalogError] = useState(false)
    const [pricing, setPricing] = useState<BatchProductPricingResponse>()
    const [pricingKey, setPricingKey] = useState('')
    const [creatorCode, setCreatorCode] = useState('')
    const [rejectedCreatorCode, setRejectedCreatorCode] = useState('')
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

    function price(product: PurchaseableProduct) {
        if (!canUsePrices) return undefined
        const provider = getProvider(pricing || null, product.slug!, 'lemonsqueezy')
        if (!provider) return undefined
        // Lemon Squeezy's batch prices are before tax. Round the whole bundle before dividing by slots.
        const withTax = (amount: number) => Math.round(getPriceWithVAT(amount, countryCode) * 100) / 100
        return { ...provider, originalPrice: withTax(provider.originalPrice), discountedPrice: withTax(provider.discountedPrice) }
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
        setReload(value => value + 1)
    }

    return {
        products,
        loading,
        catalogError,
        pricingError,
        canUsePrices,
        price,
        creatorCode,
        /** the last creator code the prices could not be loaded with, empty otherwise */
        rejectedCreatorCode,
        applyCreatorCode,
        creatorPercent,
        retry,
        taxLabel: shouldIncludeVAT(countryCode) ? 'Includes estimated tax' : 'Tax calculated at checkout'
    }
}

export type SlotCatalog = ReturnType<typeof useSlotCatalog>
