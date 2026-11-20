'use client'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { postApiPremiumSubscriptionExternalIdTerm } from '../api/_generated/skyApi'
import type { SubscriptionTermSwitchArgs } from '../api/_generated/skyApi.schemas'
import { useBackForwardRestore } from '../components/Premium/Checkout/useBackForwardRestore'
import { getSubscriptionDeclaration } from '../utils/SubscriptionCheckout'
import {
    getTermSwitchOutcome,
    type TermOption,
    type TermOptions,
    type TermSwitch,
    type TermSwitchError,
    type TermSwitchOutcome
} from '../utils/SubscriptionTermSwitch'
import { useCheckoutRequestId } from './useCheckoutRequestId'
import { usePurchaseDeclaration } from './usePurchaseDeclaration'
import { getTermOptionsKey } from './useTermSwitchOptions'

const NOT_LOGGED_IN: TermSwitchError = { kind: 'error', message: 'Please login to switch your subscription.' }
const REQUEST_FAILED: TermSwitchError = { kind: 'error', message: 'The switch could not be started. Please try again.' }

async function requestTermSwitch(externalId: string, body: SubscriptionTermSwitchArgs): Promise<TermSwitchOutcome> {
    const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
    if (!token) return NOT_LOGGED_IN
    try {
        const response = await postApiPremiumSubscriptionExternalIdTerm(externalId, body, { headers: { GoogleToken: token } })
        return getTermSwitchOutcome(response.status, response.data)
    } catch {
        return REQUEST_FAILED
    }
}

interface Options {
    /** tells the dialog whether it may be closed */
    onBusyChange(busy: boolean): void
    /** the new term is paid and granted */
    onSwitched(result: TermSwitch): void
    /** the list of subscriptions is out of date */
    onRefreshList(): void
}

/**
 * Switching one subscription to a longer term: the early start declaration of the order, its request id and the submit state.
 * A completed switch calls `onSwitched`, a payment or approval sends the browser to Stripe or PayPal, a processing one becomes the
 * pending switch of the options (which are then polled until it is done).
 */
export function useSubscriptionTermSwitch(subscription: PremiumSubscription, options: Options) {
    const declaration = usePurchaseDeclaration(true, `switch|${subscription.externalId}`)
    const requestId = useCheckoutRequestId()
    const queryClient = useQueryClient()
    const [busy, setBusyState] = useState(false)
    const [error, setError] = useState<TermSwitchError>()
    const optionsKey = getTermOptionsKey(subscription.externalId)

    function setBusy(value: boolean) {
        setBusyState(value)
        options.onBusyChange(value)
    }

    // back from Stripe or PayPal the cached page would still be waiting for the redirect
    useBackForwardRestore(() => setBusy(false))

    function refreshOptions(): Promise<void> {
        return queryClient.invalidateQueries({ queryKey: optionsKey })
    }

    async function showPending(result: TermSwitch) {
        // a fetch that started before the switch would overwrite the pending switch with the old options
        await queryClient.cancelQueries({ queryKey: optionsKey })
        queryClient.setQueryData<TermOptions>(optionsKey, current => ({ ...current, pending: result }))
    }

    /** the new options (e.g. the changed price) are loaded before the order button is usable again */
    async function handleFailure(outcome: TermSwitchError) {
        setError(outcome)
        if (outcome.refreshList) options.onRefreshList()
        if (outcome.declarationRefused) {
            requestId.renew()
            void declaration.reload()
        }
        if (outcome.refreshOptions) await refreshOptions()
    }

    async function handleOutcome(outcome: TermSwitchOutcome) {
        if (outcome.kind === 'error') return handleFailure(outcome)
        if (outcome.kind === 'redirect') return void window.open(outcome.url, '_self')
        if (outcome.kind === 'processing') return showPending(outcome.result)
        void refreshOptions()
        options.onSwitched(outcome.result)
    }

    function getBody(term: TermOption): SubscriptionTermSwitchArgs {
        const id = requestId.requestIdFor(`${subscription.externalId}|${term.weeks}`, 'switch')
        return {
            weeks: term.weeks,
            declaration: getSubscriptionDeclaration(declaration.declaration, declaration.confirmed, id),
            expectedChargedNow: term.chargedNow
        }
    }

    async function submit(term: TermOption) {
        if (busy || !declaration.confirmed) return
        setBusy(true)
        setError(undefined)
        const outcome = await requestTermSwitch(subscription.externalId, getBody(term))
        await handleOutcome(outcome)
        // a redirect leaves the page busy until the browser navigates away
        if (outcome.kind !== 'redirect') setBusy(false)
    }

    return { declaration, busy, error, submit }
}
