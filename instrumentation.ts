export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const internalApiBase = process.env.API_ENDPOINT?.replace(/\/api$/, '') || ''
        if (!internalApiBase) return

        const originalFetch = globalThis.fetch
        globalThis.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            if (typeof input === 'string' && input.startsWith('https://sky.coflnet.com')) {
                input = input.replace('https://sky.coflnet.com', internalApiBase)
            } else if (input instanceof URL && input.origin === 'https://sky.coflnet.com') {
                input = new URL(input.pathname + input.search + input.hash, internalApiBase)
            } else if (input instanceof Request && input.url.startsWith('https://sky.coflnet.com')) {
                input = new Request(input.url.replace('https://sky.coflnet.com', internalApiBase), input)
            }
            return originalFetch(input, init)
        }
    }
}
