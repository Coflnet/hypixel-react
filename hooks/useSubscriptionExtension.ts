'use client'
import { useState } from 'react'
import { postApiPremiumSubscriptionExternalIdExtend } from '../api/_generated/skyApi'
import { useBackForwardRestore } from '../components/Premium/Checkout/useBackForwardRestore'
import { getSubscriptionDeclaration } from '../utils/SubscriptionCheckout'
import { getExtensionOutcome, type ExtensionOutcome } from '../utils/SubscriptionExtension'
import { useCheckoutRequestId } from './useCheckoutRequestId'
import { usePurchaseDeclaration } from './usePurchaseDeclaration'

type ErrorOutcome = Extract<ExtensionOutcome, { kind: 'error' }>

const NOT_LOGGED_IN: ErrorOutcome = { kind: 'error', message: 'Please login to renew your subscription.' }
const REQUEST_FAILED: ErrorOutcome = { kind: 'error', message: 'The renewal could not be started. Please try again.' }

async function requestExtension(externalId: string, body: Parameters<typeof postApiPremiumSubscriptionExternalIdExtend>[1]): Promise<ExtensionOutcome> {
    const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
    if (!token) return NOT_LOGGED_IN
    try {
        const response = await postApiPremiumSubscriptionExternalIdExtend(externalId, body, { headers: { GoogleToken: token } })
        return getExtensionOutcome(response.status, response.data)
    } catch {
        return REQUEST_FAILED
    }
}

interface Options {
    /** tells the dialog whether it may be closed */
    onBusyChange(busy: boolean): void
    /** Stripe extended the term at once */
    onExtended(): void
    /** the list of subscriptions is out of date (the extension failed after the request was accepted) */
    onRefresh(): void
}

/**
 * Renewing one subscription for another term: the early start declaration of the order, its request id and the
 * submit state. Stripe extends at once (`onExtended`), PayPal sends the browser to its approval page.
 */
export function useSubscriptionExtension(subscription: PremiumSubscription, options: Options) {
    const declaration = usePurchaseDeclaration(true, `extend|${subscription.externalId}`)
    const requestId = useCheckoutRequestId()
    const [busy, setBusyState] = useState(false)
    const [error, setError] = useState<ErrorOutcome>()

    function setBusy(value: boolean) {
        setBusyState(value)
        options.onBusyChange(value)
    }

    // back from PayPal the cached page would still be waiting for the redirect
    useBackForwardRestore(() => setBusy(false))

    function handleFailure(outcome: ErrorOutcome) {
        setError(outcome)
        if (outcome.refreshList) options.onRefresh()
        if (!outcome.declarationRefused) return
        requestId.renew()
        void declaration.reload()
    }

    function handleOutcome(outcome: ExtensionOutcome) {
        if (outcome.kind === 'error') return handleFailure(outcome)
        if (outcome.kind === 'redirect') return window.open(outcome.url, '_self')
        options.onExtended()
    }

    async function submit() {
        if (busy || !declaration.confirmed) return
        setBusy(true)
        setError(undefined)
        const body = getSubscriptionDeclaration(declaration.declaration, declaration.confirmed, requestId.requestIdFor(subscription.externalId, 'extend'))
        const outcome = await requestExtension(subscription.externalId, body)
        handleOutcome(outcome)
        // a redirect leaves the page busy until the browser navigates away
        if (outcome.kind !== 'redirect') setBusy(false)
    }

    return { declaration, busy, error, submit }
}
