import properties from '../properties'

export interface AttributeFlipModifier {
    key?: string | null
    value?: string | null
}

export interface AttributeFlipEnchant {
    type?: string | null
    lvl: number
}

export interface AttributeFlipAuctionKey {
    reforge?: string | null
    tier?: string | null
    enchants?: AttributeFlipEnchant[] | null
    modifiers?: AttributeFlipModifier[] | null
    count: number
}

export interface AttributeFlipIngredient {
    itemId?: string | null
    attributeName?: string | null
    amount: number
    price: number
}

export interface AttributeFlip {
    tag?: string | null
    itemName?: string | null
    auctionToBuy?: string | null
    auctionPrice: number
    ingredients?: AttributeFlipIngredient[] | null
    startingKey?: AttributeFlipAuctionKey
    endingKey?: AttributeFlipAuctionKey
    target: number
    estimatedCraftingCost: number
    foundAt: string
    volume: number
}

export interface AttributeFlipApiError {
    message?: string
}

export type AttributeFlipApiData = AttributeFlip[] | AttributeFlipApiError | string | null

export interface AttributeFlipApiResponse {
    status: number
    data: AttributeFlipApiData
}

export interface AttributeFlipQueryParams {
    sort?: string
}

export const ATTRIBUTE_FLIP_DEFAULT_QUERY: AttributeFlipQueryParams = {}

const ATTRIBUTE_FLIP_ENDPOINT = `${properties.apiEndpoint}/flip/attribute`

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) {
        return {}
    }

    if (headers instanceof Headers) {
        const normalized: Record<string, string> = {}
        headers.forEach((value, key) => {
            normalized[key] = value
        })
        return normalized
    }

    if (Array.isArray(headers)) {
        return headers.reduce<Record<string, string>>((accumulator, [key, value]) => {
            accumulator[key] = value
            return accumulator
        }, {})
    }

    return Object.entries(headers).reduce<Record<string, string>>((accumulator, [key, value]) => {
        accumulator[key] = String(value)
        return accumulator
    }, {})
}

function getGoogleToken(): string | null {
    if (typeof window === 'undefined') {
        return null
    }

    try {
        return window.sessionStorage.getItem('googleId')
    } catch {
        return null
    }
}

function buildUrl(params?: AttributeFlipQueryParams): string {
    if (!params || Object.keys(params).length === 0) {
        return ATTRIBUTE_FLIP_ENDPOINT
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value))
        }
    })

    const query = searchParams.toString()
    return query ? `${ATTRIBUTE_FLIP_ENDPOINT}?${query}` : ATTRIBUTE_FLIP_ENDPOINT
}

export async function fetchAttributeFlips(
    params: AttributeFlipQueryParams = ATTRIBUTE_FLIP_DEFAULT_QUERY,
    init?: RequestInit
): Promise<AttributeFlipApiResponse> {
    const url = buildUrl(params)
    const headers = normalizeHeaders(init?.headers)
    const googleToken = getGoogleToken()

    if (googleToken) {
        headers.GoogleToken = googleToken
    }

    const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        ...init,
        headers
    })

    const text = [204, 205, 304].includes(response.status) ? '' : await response.text()
    let data: AttributeFlipApiData = null

    if (text) {
        try {
            data = JSON.parse(text)
        } catch {
            data = text
        }
    }

    return {
        status: response.status,
        data
    }
}
