'use client'
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { useQuery, type Query } from '@tanstack/react-query'
import { getApiPremiumTransactions } from '../../../api/_generated/skyApi'
import { useGoogleToken } from '../../../hooks/useGoogleToken'
import {
    RETURNED_AT_PARAM,
    SLOW_CONFIRMATION_MS,
    getCreditKeys,
    getPollDelay,
    getPurchaseReference,
    getPurchaseReturn,
    getServerNow,
    getServerReturnedAt,
    isPurchaseConfirmed
} from '../../../utils/PaymentConfirmation'
import { refreshPremiumProducts } from '../PaymentStatusRefresh'

// Watches the account after the buyer returned from a payment provider until Payments confirmed the purchase.

type LookupResult = 'waiting' | 'confirmed' | 'loggedOut'

export type PaymentConfirmationStatus = LookupResult

export interface PaymentConfirmation {
    status: PaymentConfirmationStatus
    /** no confirmation within SLOW_CONFIRMATION_MS of the page load */
    slow: boolean
    /** PayPal's id of the purchase from the return url, null without one */
    reference: string | null
    /** looks again right away, e.g. after a login */
    recheck(): void
}

interface LookupData {
    status: LookupResult
    /** the server time of the return, null when no lookup answered yet */
    returnedAt: number | null
}

/** what an account's first lookup found: later lookups only accept a credit that is not among its `keys` */
interface FirstLookup {
    token: string
    returnedAt: number
    keys: string[]
}

const subscribeToNothing = () => () => {}

/** false on the server and while hydrating, so the first render matches the server's */
function useHydrated(): boolean {
    return useSyncExternalStore(
        subscribeToNothing,
        () => true,
        () => false
    )
}

/** keeps the server time of the return in the url (not on the device), so a reload still recognises a credit booked before it */
function writeReturnedAt(returnedAt: number) {
    const url = new URL(window.location.href)
    if (url.searchParams.get(RETURNED_AT_PARAM) === String(returnedAt)) return
    url.searchParams.set(RETURNED_AT_PARAM, String(returnedAt))
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}

function useReturnedAtInUrl(returnedAt: number | null | undefined) {
    useEffect(() => {
        if (returnedAt) writeReturnedAt(returnedAt)
    }, [returnedAt])
}

/** when the page loaded on the device's clock; null on the server */
function useLoadedAt(): number | null {
    const [loadedAt] = useState(() => (typeof window === 'undefined' ? null : Date.now()))
    return loadedAt
}

/** whether `deadline` (ms) has passed; false while it is null */
function useHasPassed(deadline: number | null): boolean {
    const [passed, setPassed] = useState(false)
    useEffect(() => {
        if (deadline === null) return
        const timer = window.setTimeout(() => setPassed(true), Math.max(0, deadline - Date.now()))
        return () => window.clearTimeout(timer)
    }, [deadline])
    return passed
}

/** the server time of the return, read off the response's Date header (the API is same-origin) so a wrong device clock does not matter */
function getReturnedAt(headers: Headers, loadedAt: number): number {
    const deviceNow = Date.now()
    const serverNow = getServerNow(headers.get('date'), deviceNow)
    return getServerReturnedAt(new URLSearchParams(window.location.search).get(RETURNED_AT_PARAM), loadedAt, serverNow, deviceNow)
}

async function lookUpPurchase(token: string, loadedAt: number, first: RefObject<FirstLookup | null>, signal: AbortSignal): Promise<LookupData> {
    const response = await getApiPremiumTransactions({ headers: { GoogleToken: token }, signal })
    if (response.status === 401 || response.status === 403) return { status: 'loggedOut', returnedAt: null }
    if (response.status !== 200 || !Array.isArray(response.data)) return { status: 'waiting', returnedAt: null }
    const known = first.current?.token === token ? first.current : null
    const returnedAt = known?.returnedAt ?? getReturnedAt(response.headers, loadedAt)
    const purchase = getPurchaseReturn(window.location.search)
    const confirmed = isPurchaseConfirmed(response.data, { returnedAt, baseline: known?.keys ?? null, purchase })
    if (!known) first.current = { token, returnedAt, keys: getCreditKeys(response.data) }
    if (!confirmed) return { status: 'waiting', returnedAt }
    // the premium and account pages read the cached ownership; the buttons of the success state lead there
    await refreshPremiumProducts().catch(() => {})
    return { status: 'confirmed', returnedAt }
}

function isWaiting(query: Query<LookupData, Error, LookupData, readonly unknown[]>): boolean {
    return query.state.data?.status !== 'confirmed' && query.state.data?.status !== 'loggedOut'
}

/** polls the transactions with backoff while waiting; stops once confirmed, logged out or the page is left */
function usePurchaseLookup(token: string | null, loadedAt: number | null) {
    const first = useRef<FirstLookup | null>(null)
    return useQuery({
        queryKey: ['paymentConfirmation', token, loadedAt],
        queryFn: ({ signal }) => lookUpPurchase(token!, loadedAt!, first, signal),
        enabled: !!token && loadedAt !== null,
        staleTime: 0,
        retry: false,
        refetchInterval: query => (isWaiting(query) ? getPollDelay(Date.now() - loadedAt!) : false),
        refetchOnWindowFocus: query => isWaiting(query)
    })
}

function getStatus(hydrated: boolean, token: string | null, result: LookupResult | undefined): PaymentConfirmationStatus {
    if (!hydrated) return 'waiting'
    if (!token) return 'loggedOut'
    return result ?? 'waiting'
}

export function usePaymentConfirmation(): PaymentConfirmation {
    const hydrated = useHydrated()
    const token = useGoogleToken()
    const loadedAt = useLoadedAt()
    const lookup = usePurchaseLookup(token, loadedAt)
    useReturnedAtInUrl(lookup.data?.returnedAt)
    const status = getStatus(hydrated, token, lookup.data?.status)
    const slow = useHasPassed(loadedAt === null ? null : loadedAt + SLOW_CONFIRMATION_MS)
    const reference = hydrated ? getPurchaseReference(window.location.search) : null
    return { status, slow: slow && status === 'waiting', reference, recheck: () => void lookup.refetch() }
}
