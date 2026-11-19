// A "stale chunk" happens when a tab keeps a webpack module map from before a deployment while
// Cloudflare / the service worker still serve (or briefly served a mix of) old and new static assets.
// __webpack_require__ then asks for a module id whose factory was never registered, which surfaces as a
// plain TypeError thrown from inside the webpack runtime rather than a ChunkLoadError. The fix is the
// same in both cases: clear caches and reload once to pick up a consistent build.
const STORAGE_KEY = 'chunkErrorReload'
const RELOAD_GUARD_WINDOW_MS = 60_000

const WEBPACK_RUNTIME_FRAME = /\/_next\/static\/chunks\/webpack-/
const CHUNK_LOAD_MESSAGE = /Loading (chunk|CSS chunk) .* failed/i

// Chrome, Firefox and Safari all word this differently, but they all mean the same thing: the webpack
// module factory was undefined when the runtime tried to call it.
const UNDEFINED_CALL_MESSAGES = [
    /Cannot read properties of undefined \(reading 'call'\)/,
    /can't access property "call", .* is undefined/,
    /undefined is not an object \(evaluating '.*\.call'\)/
]

export function isStaleChunkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const name = typeof (error as { name?: unknown }).name === 'string' ? ((error as { name: string }).name as string) : undefined
    const message = typeof (error as { message?: unknown }).message === 'string' ? ((error as { message: string }).message as string) : undefined
    const stack = typeof (error as { stack?: unknown }).stack === 'string' ? ((error as { stack: string }).stack as string) : undefined

    if (name === 'ChunkLoadError') {
        return true
    }

    if (message && CHUNK_LOAD_MESSAGE.test(message)) {
        return true
    }

    if (message && stack && WEBPACK_RUNTIME_FRAME.test(stack) && UNDEFINED_CALL_MESSAGES.some(pattern => pattern.test(message))) {
        return true
    }

    return false
}

/**
 * Clears the Cache Storage (filled by the service worker) and reloads the page, guarded so a
 * crash-loop can't reload forever.
 *
 * Returns true if a reload was triggered, false if the guard blocked it (recovery was already
 * attempted recently, so reloading again would most likely just loop).
 */
export function recoverFromStaleChunks(): boolean {
    try {
        let lastReload = window.localStorage.getItem(STORAGE_KEY)
        if (lastReload && parseInt(lastReload) + RELOAD_GUARD_WINDOW_MS > new Date().getTime()) {
            return false
        }
        window.localStorage.setItem(STORAGE_KEY, new Date().getTime().toString())
    } catch {
        // If we can't read/write the guard we can't reliably prevent a loop; better to not auto-reload.
        return false
    }

    if (typeof caches !== 'undefined') {
        caches
            .keys()
            .then(keys => {
                keys.forEach(key => {
                    caches.delete(key)
                })
            })
            .catch(() => {})
    }

    location.reload()
    return true
}
