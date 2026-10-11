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

export function unwrapGeneratedApiArrayResponse<T>(response: GeneratedApiResponse, fallbackMessage: string): T[] {
    if (response?.status && response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        return response.data as T[]
    }

    const data = response?.data as any
    const error = new Error(getGeneratedApiMessage(data) || fallbackMessage) as Error & { slug?: string; traceId?: string }
    error.slug = getGeneratedApiSlug(data) ?? undefined
    error.traceId = data?.traceId || data?.trace || undefined
    throw error
}

export function hasSuccessfulArrayResponse<T>(response: GeneratedApiResponse<unknown> | null | undefined): response is GeneratedApiResponse<T[]> & { status: 200; data: T[] } {
    return response?.status === 200 && Array.isArray(response.data)
}

/**
 * The name endpoint answers 200 with an empty body for uuids without a known name, which the generated client
 * turns into `{}`. Resolve every successful response to a string ('' = no known name) and throw for failures.
 * The client JSON-parses text first, so names like 12345 or true arrive as number/boolean and are stringified back;
 * the literal name "null" arrives as null and cannot be told apart from an empty result.
 */
export function unwrapGeneratedApiPlayerNameResponse(response: GeneratedApiResponse, fallbackMessage: string): string {
    if (response?.status && response.status >= 200 && response.status < 300) {
        const data = response.data
        if (typeof data === 'string') {
            return data.trim()
        }
        return typeof data === 'number' || typeof data === 'boolean' ? String(data) : ''
    }

    const error = new Error(getGeneratedApiMessage(response?.data) || fallbackMessage) as Error & { slug?: string; status?: number; traceId?: string }
    const data = response?.data as { traceId?: string; trace?: string } | null | undefined
    error.slug = getGeneratedApiSlug(response?.data) ?? undefined
    error.status = response?.status ?? undefined
    error.traceId = data?.traceId || data?.trace || undefined
    throw error
}

/** True when a failed player name lookup definitely means the uuid does not exist (as opposed to a backend failure). */
export function isDefinitePlayerMiss(error: unknown): boolean {
    const { status, slug } = (error || {}) as { status?: number; slug?: string }
    return status === 400 || status === 404 || slug === 'invalid_uuid'
}
