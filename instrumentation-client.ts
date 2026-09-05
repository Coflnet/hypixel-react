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
