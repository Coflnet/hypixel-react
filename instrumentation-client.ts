import { recordClientError } from './utils/ClientErrorUtils'

window.addEventListener('error', event => {
    recordClientError(event.error ?? event.message, 'window.error', {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
    })
})

window.addEventListener('unhandledrejection', event => {
    recordClientError(event.reason, 'unhandledrejection')
})

export function onRouterTransitionStart(url: string, navigationType: 'push' | 'replace' | 'traverse') {
    if (navigationType === 'traverse') return
    // Next Link prevents the native click before it reaches the document listener.
    window.dispatchEvent(new CustomEvent('next-route-start', { detail: url }))
}
