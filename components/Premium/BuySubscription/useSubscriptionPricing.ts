'use client'
import { useEffect, useRef, useState } from 'react'
import { postApiTopupRates } from '../../../api/_generated/skyApi'
import { BatchProductPricingResponse } from '../../../api/_generated/skyApi.schemas'

const PRICING_ERROR = 'Failed to load pricing information'

export async function requestPricing(productSlug: string, countryCode: string, creatorCode: string): Promise<BatchProductPricingResponse> {
    const googleToken = sessionStorage.getItem('googleId')
    const response = await postApiTopupRates(
        { productSlugs: [productSlug], countryCode, creatorCode: creatorCode || null },
        { headers: googleToken ? { GoogleToken: googleToken } : {} }
    )
    if (response.status !== 200) throw new Error(PRICING_ERROR)
    return response.data
}

/**
 * The quoted price of one subscription product for the buyer's country, with the creator code applied.
 * Nothing is requested while the country is unknown: the checkout then shows the list price before tax.
 * A newer request (another product, country or code) wins over an older one still on its way.
 */
export function useSubscriptionPricing(productSlug: string, countryCode?: string) {
    const [pricingData, setPricingData] = useState<BatchProductPricingResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [appliedCreatorCode, setAppliedCreatorCode] = useState<string | null>(null)
    const latestRequest = useRef(0)

    async function load(creatorCode: string) {
        if (!countryCode) return
        const request = ++latestRequest.current
        setIsLoading(true)
        setError(null)
        try {
            const data = await requestPricing(productSlug, countryCode, creatorCode)
            if (request !== latestRequest.current) return
            setPricingData(data)
            setAppliedCreatorCode(creatorCode || null)
        } catch {
            if (request === latestRequest.current) setError(PRICING_ERROR)
        } finally {
            if (request === latestRequest.current) setIsLoading(false)
        }
    }

    // the yearly switch and the tier upgrade at the checkout change the product: it has its own price
    useEffect(() => {
        void load(appliedCreatorCode ?? '')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productSlug, countryCode])

    return { pricingData, isLoading, error, appliedCreatorCode, applyCreatorCode: (code: string) => void load(code) }
}
