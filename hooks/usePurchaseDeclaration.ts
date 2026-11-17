'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/ApiHelper'
import type { LegalDeclaration } from '../api/_generated/skyApi.schemas'
import type { LegalLocale } from '../utils/LegalLinks'
import { useLegalLocale } from './useLegalLocale'

// The early start declaration of a Premium purchase (prepaid and subscriptions): the server's current, hash-verified text in
// the browser's legal locale. It starts unchecked for every order and has to be confirmed before payment.

export interface PurchaseDeclarationState {
    locale: LegalLocale
    /** the declaration to show, undefined while it loads or when it is unavailable */
    declaration?: LegalDeclaration
    /** the declaration could not be loaded: purchasing is unavailable */
    error: boolean
    /** the buyer ticked the declaration of this order */
    accepted: boolean
    /** accepted, loaded and not being reloaded: the purchase may start */
    confirmed: boolean
    setAccepted(accepted: boolean): void
    /** loads the current declaration again (e.g. after the server said it changed) and unticks it */
    reload(): Promise<void>
}

function getQueryKey(locale: LegalLocale) {
    return ['premiumPurchaseDeclaration', locale] as const
}

async function loadDeclaration(locale: LegalLocale, forceRefresh = false): Promise<LegalDeclaration> {
    const status = await api.getTermsStatus(locale, undefined, forceRefresh)
    if (!status.canStartNewContract || !status.premiumPurchaseDeclaration) throw new Error('Declaration unavailable')
    return status.premiumPurchaseDeclaration
}

/** a tick that belongs to one order: another `orderKey` (plan, product, an opened dialog) starts unticked again */
function useOrderAcceptance(orderKey: string): [boolean, (accepted: boolean) => void] {
    const [acceptance, setAcceptance] = useState({ orderKey, accepted: false })
    // adjusted while rendering (no effect), so the old tick is never shown for the new order
    if (acceptance.orderKey !== orderKey) setAcceptance({ orderKey, accepted: false })
    const accepted = acceptance.orderKey === orderKey && acceptance.accepted
    return [accepted, value => setAcceptance({ orderKey, accepted: value })]
}

/** the declaration for the order `orderKey`; it is only requested while `active` (a logged in buyer looks at the order) */
export function usePurchaseDeclaration(active: boolean, orderKey: string): PurchaseDeclarationState {
    const locale = useLegalLocale()
    const queryClient = useQueryClient()
    const query = useQuery({
        queryKey: getQueryKey(locale),
        queryFn: () => loadDeclaration(locale),
        enabled: active,
        retry: false,
        refetchOnWindowFocus: false
    })
    const declaration = query.isError ? undefined : query.data
    // a tick belongs to the text it was given for: another language or declaration version starts unticked
    const [accepted, setAccepted] = useOrderAcceptance(`${orderKey}|${locale}|${declaration?.version ?? ''}`)

    async function reload() {
        setAccepted(false)
        await queryClient.fetchQuery({ queryKey: getQueryKey(locale), queryFn: () => loadDeclaration(locale, true), staleTime: 0 }).catch(() => undefined)
    }

    return { locale, declaration, error: query.isError, accepted, confirmed: accepted && !!declaration && !query.isFetching, setAccepted, reload }
}
