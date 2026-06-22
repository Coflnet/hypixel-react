export interface GeneratedApiResponse<TData = unknown> {
    data?: TData
    status?: number | null
}

const PREMIUM_PLUS_SLUGS = new Set([
    'no_premium_plus',
    'premplus_required',
    'premium_plus_required'
])

const PREMIUM_SLUGS = new Set([
    'no_premium',
    'premium_required',
    'starter_premium_required',
    'no_premium_plus',
    'premplus_required',
    'premium_plus_required'
])

export function getGeneratedApiSlug(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
        return null
    }

    if ('slug' in data && typeof data.slug === 'string') {
        const trimmed = data.slug.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    return null
}

export function getGeneratedApiMessage(data: unknown): string | null {
    if (typeof data === 'string') {
        const trimmed = data.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    if (!data || typeof data !== 'object') {
        return null
    }

    if ('message' in data && typeof data.message === 'string') {
        const trimmed = data.message.trim()
        if (trimmed.length > 0) {
            return trimmed
        }
    }

    return null
}

export function getGeneratedApiPremiumUrl(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
        return null
    }

    if ('premiumUrl' in data && typeof data.premiumUrl === 'string') {
        const trimmed = data.premiumUrl.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    return null
}

export function isGeneratedPremiumPlusRequired(data: unknown): boolean {
    const slug = getGeneratedApiSlug(data)
    if (slug && PREMIUM_PLUS_SLUGS.has(slug)) {
        return true
    }

    const message = getGeneratedApiMessage(data)?.toLowerCase()
    return !!message && message.includes('premium plus')
}

export function isGeneratedPremiumRequired(data: unknown): boolean {
    const slug = getGeneratedApiSlug(data)
    if (slug && PREMIUM_SLUGS.has(slug)) {
        return true
    }

    const message = getGeneratedApiMessage(data)?.toLowerCase()
    return !!message && message.includes('premium')
}

export function getGeneratedApiErrorMessage(
    response: GeneratedApiResponse | null | undefined,
    error: unknown,
    fallbackMessage: string
): string | null {
    const responseMessage = getGeneratedApiMessage(response?.data)
    if (responseMessage) {
        return responseMessage
    }

    if (error instanceof Error) {
        const trimmed = error.message.trim()
        if (trimmed.length > 0) {
            return trimmed
        }
    }

    if (response?.status && response.status !== 200) {
        return `${fallbackMessage} (status ${response.status}).`
    }

    return null
}

export function hasSuccessfulArrayResponse<T>(response: GeneratedApiResponse<unknown> | null | undefined): response is GeneratedApiResponse<T[]> & { status: 200; data: T[] } {
    return response?.status === 200 && Array.isArray(response.data)
}
