import { ErrorDetails, serializeError } from './ErrorDiagnostics'

export interface ClientErrorRecord {
    id: string
    timestamp: string
    href: string
    source: string
    error: ErrorDetails
    filename?: string
    line?: number
    column?: number
    requestType?: string
}

const STORAGE_KEY = 'skycoflClientErrors'
const MAX_ERRORS = 20
let errorLog: ClientErrorRecord[] | undefined
const recordedErrors = new WeakMap<object, ClientErrorRecord>()

export function getClientErrorLog(): ClientErrorRecord[] {
    if (typeof window === 'undefined') return []
    if (!errorLog) {
        try {
            const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
            errorLog = Array.isArray(stored) ? stored.slice(-MAX_ERRORS) : []
        } catch {
            errorLog = []
        }
    }
    return errorLog!
}

export function recordClientError(error: unknown, source: string, context: Pick<ClientErrorRecord, 'filename' | 'line' | 'column' | 'requestType'> = {}) {
    if (typeof window === 'undefined') return
    if (error && typeof error === 'object' && recordedErrors.has(error)) return recordedErrors.get(error)!
    const record: ClientErrorRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        href: location.href,
        source,
        error: serializeError(error),
        ...context
    }
    if (error && typeof error === 'object') recordedErrors.set(error, record)
    const log = getClientErrorLog()
    log.push(record)
    log.splice(0, Math.max(0, log.length - MAX_ERRORS))
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(log))
    } catch {}
    return record
}
