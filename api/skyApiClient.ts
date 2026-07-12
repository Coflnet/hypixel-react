import {
  getDeleteApiLowballOfferOfferIdUrl,
  getGetApiLowballItemItemTagUrl,
  getGetApiLowballOwnUrl,
  type LowballOfferResponse,
} from './_generated/skyApi'
import { getProperty } from '../utils/PropertiesUtils'
import { isClientSideRendering } from '../utils/SSRUtils'

export class SkyApiClientError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

const generatedSkyApiOrigin = new URL(getGetApiLowballOwnUrl()).origin

function getSkyApiBaseUrl(): string {
    const configuredBaseUrl = isClientSideRendering()
        ? getProperty('apiEndpoint')
        : process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT || getProperty('apiEndpoint')

    return configuredBaseUrl || generatedSkyApiOrigin
}

function resolveSkyApiUrl(url: string): string {
    const parsed = new URL(url)
    return `${getSkyApiBaseUrl()}${parsed.pathname}${parsed.search}${parsed.hash}`
}

function getGoogleAuthHeaders(required: boolean): HeadersInit {
    const token = typeof window === 'undefined' ? null : sessionStorage.getItem('googleId')
    if (!token && required)
        throw new SkyApiClientError(401, 'Please sign in first.')

    return token
        ? {
              GoogleToken: token,
              'Content-Type': 'application/json',
          }
        : {}
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(resolveSkyApiUrl(url), init)
    const body = [204, 205, 304].includes(response.status) ? '' : await response.text()

    if (!response.ok) {
        throw new SkyApiClientError(response.status, body || `SkyApi request failed with status ${response.status}`)
    }

    if (!body)
        return undefined as T

    return JSON.parse(body) as T
}

export function getOwnLowballOffers(params?: { before?: string; limit?: number }) {
    return requestJson<LowballOfferResponse[]>(getGetApiLowballOwnUrl(params), {
        headers: getGoogleAuthHeaders(true),
    })
}

export function getItemLowballOffers(itemTag: string, params?: { before?: string; limit?: number }) {
    return requestJson<LowballOfferResponse[]>(getGetApiLowballItemItemTagUrl(itemTag, params))
}

export function deleteLowballOffer(offerId: string) {
    return requestJson<void>(getDeleteApiLowballOfferOfferIdUrl(offerId), {
        method: 'DELETE',
        headers: getGoogleAuthHeaders(true),
    })
}