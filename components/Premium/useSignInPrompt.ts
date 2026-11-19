'use client'
import { useRef, useState } from 'react'
import { getSignInStep, PurchaseReadiness, SignInAction } from './purchaseTarget'
import type { PremiumAccount } from './usePremiumAccount'

/** the props PremiumSignIn hands to its GoogleSignIn, so an action can open the dialog and continue after the login */
export interface SignInDialogControl {
    showDialog: boolean
    onDialogClose(): void
    onLoginStart(): void
    onAfterLogin(): void
    onLoginFail(): void
}

/** signed in, but the account failed to load: the action goes to the step that blocks the purchase */
const ACCOUNT_NOT_LOADED: PurchaseReadiness = { isLoggedIn: true, isLoading: false, canPurchase: false }

interface SignInPromptHandlers {
    /** the dialog was opened for `action` */
    onPrompt(action: SignInAction): void
    /** carries out `action` for a signed in visitor; `account` is what the loaded account allows */
    onContinue(action: SignInAction, account: PurchaseReadiness): void
}

interface PendingAction {
    action: SignInAction
    /** onContinue of the render that saw the click */
    onContinue: SignInPromptHandlers['onContinue']
}

/**
 * Actions on /premium that need a signed in account. Signed out, a click opens the sign-in dialog right away
 * (no scrolling) and remembers the action; it continues by itself once the login completed and the account
 * has loaded. During a login that is already running (stored token, or after Google answered) the click only waits.
 *
 * GoogleSignIn calls its callbacks from closures of earlier renders, so the pending action lives in a ref and
 * the continuation works with what the login promise resolved with, not with the state of a render.
 */
export function useSignInPrompt(account: PremiumAccount, { onPrompt, onContinue }: SignInPromptHandlers) {
    const [isDialogShown, setIsDialogShown] = useState(false)
    const [isSigningIn, setIsSigningIn] = useState(false)
    const pending = useRef<PendingAction | null>(null)
    const step = getSignInStep({ isLoggedIn: account.isLoggedIn, isSigningIn })

    function takePending(): PendingAction | null {
        const action = pending.current
        pending.current = null
        return action
    }

    /** continues `action` now when signed in, otherwise after the sign-in */
    function runSignedIn(action: SignInAction) {
        if (step === 'run') {
            onContinue(action, account)
            return
        }
        pending.current = { action, onContinue }
        if (step === 'wait') return
        setIsDialogShown(true)
        onPrompt(action)
    }

    function onDialogClose() {
        pending.current = null
        setIsDialogShown(false)
    }

    function onLoginStart() {
        setIsDialogShown(false)
        setIsSigningIn(true)
    }

    function onLoginFail() {
        setIsSigningIn(false)
        account.onLoginFail()
        // the action still needs a sign-in: offer the dialog again instead of dropping the click
        if (!pending.current) return
        setIsDialogShown(true)
        onPrompt(pending.current.action)
    }

    function onAfterLogin() {
        account
            .onLogin()
            .then(loaded => {
                const pendingAction = takePending()
                if (pendingAction && loaded) pendingAction.onContinue(pendingAction.action, loaded)
            })
            .catch(() => {
                // the account did not load completely: show what blocks the purchase instead of nothing
                const pendingAction = takePending()
                pendingAction?.onContinue(pendingAction.action, ACCOUNT_NOT_LOADED)
            })
            .finally(() => setIsSigningIn(false))
    }

    const dialog: SignInDialogControl = { showDialog: isDialogShown, onDialogClose, onLoginStart, onAfterLogin, onLoginFail }
    return { runSignedIn, needsSignIn: step !== 'run', dialog }
}
