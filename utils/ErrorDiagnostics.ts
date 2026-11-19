export interface ErrorDetails {
    name?: string
    message: string
    stack?: string
    digest?: string
    traceId?: string
    status?: number
    slug?: string
    cause?: ErrorDetails
}

export function serializeError(error: unknown, seen = new WeakSet<object>()): ErrorDetails {
    if (!error || typeof error !== 'object') return { message: String(error ?? 'Unknown error') }
    if (seen.has(error)) return { message: '[Circular error cause]' }
    seen.add(error)
    const value = error as Record<string, unknown>
    const string = (key: string) => (typeof value[key] === 'string' ? (value[key] as string) : undefined)
    return {
        name: string('name'),
        message: string('message') || 'Unknown error',
        stack: string('stack'),
        digest: string('digest'),
        traceId: string('traceId') || string('trace'),
        status: typeof value.status === 'number' ? value.status : undefined,
        slug: string('slug'),
        ...(value.cause !== undefined ? { cause: serializeError(value.cause, seen) } : {})
    }
}

export function errorJsonReplacer(_key: string, value: unknown) {
    return value instanceof Error ? serializeError(value) : value
}
