import type { Instrumentation } from 'next'
import { serializeError } from './utils/ErrorDiagnostics'

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
    const details = serializeError(error)
    const traceparent = request.headers.traceparent
    const traceId = typeof traceparent === 'string' ? traceparent.match(/^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i)?.[1] : undefined
    console.error(
        JSON.stringify({
            event: 'web.request.error',
            timestamp: new Date().toISOString(),
            digest: details.digest,
            traceId: details.traceId || traceId,
            version: process.env.APP_VERSION,
            method: request.method,
            path: request.path.split('?')[0],
            ...context,
            error: details
        })
    )
}

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const internalApiBase = process.env.API_ENDPOINT?.replace(/\/api$/, '') || ''
        if (!internalApiBase) return

        const originalFetch = globalThis.fetch
        const externalDomains = ['https://sky.coflnet.com', 'https://sky-commands.coflnet.com']
        globalThis.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            if (typeof input === 'string') {
                for (const domain of externalDomains) {
                    if (input.startsWith(domain)) {
                        input = input.replace(domain, internalApiBase)
                        break
                    }
                }
            } else if (input instanceof URL) {
                for (const domain of externalDomains) {
                    if (input.origin === domain) {
                        input = new URL(input.pathname + input.search + input.hash, internalApiBase)
                        break
                    }
                }
            } else if (input instanceof Request) {
                for (const domain of externalDomains) {
                    if (input.url.startsWith(domain)) {
                        input = new Request(input.url.replace(domain, internalApiBase), input)
                        break
                    }
                }
            }
            return originalFetch(input, init)
        }
    }
}
