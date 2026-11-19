export const SIGN_IN_TARGET = 'premium-sign-in'
export const TERMS_TARGET = 'terms-acceptance'
export const WIZARD_TARGET = 'buyPremium'
export const COFLCOINS_TARGET = 'coflcoins-purchase'

export interface PurchaseReadiness {
    isLoggedIn: boolean
    isLoading: boolean
    canPurchase: boolean
}

/** where a plan or CoflCoins button scrolls to: the purchase itself, or the step that blocks it */
export function getPurchaseTarget(account: PurchaseReadiness, purchaseTarget: string): string {
    if (!account.isLoggedIn || account.isLoading) return SIGN_IN_TARGET
    return account.canPurchase ? purchaseTarget : TERMS_TARGET
}

/** an action on /premium that needs a signed in account; also the `source` of the sign-in prompt event */
export type SignInAction = 'plan' | 'coflcoins' | 'slots'

const SIGN_IN_ACTION_TARGET: Record<SignInAction, string> = {
    plan: WIZARD_TARGET,
    coflcoins: COFLCOINS_TARGET,
    slots: WIZARD_TARGET
}

/** where an action continues once the visitor is signed in: its purchase block, or the step that blocks it */
export function getSignInActionTarget(action: SignInAction, account: PurchaseReadiness): string {
    return getPurchaseTarget(account, SIGN_IN_ACTION_TARGET[action])
}

/** run: signed in, go ahead; wait: a sign-in is in progress, continue after it; prompt: open the sign-in dialog */
export type SignInStep = 'run' | 'wait' | 'prompt'

export interface SignInState {
    isLoggedIn: boolean
    /** a login started (stored token or Google credential) and the account has not finished loading */
    isSigningIn: boolean
}

export function getSignInStep(state: SignInState): SignInStep {
    if (state.isSigningIn) return 'wait'
    return state.isLoggedIn ? 'run' : 'prompt'
}
