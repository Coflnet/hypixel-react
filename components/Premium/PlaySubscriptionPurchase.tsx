'use client'
import { useState, type ChangeEvent, type MouseEvent } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import { getApiUserTerms, postApiPremiumSubscriptionProductSlugPlaystore } from '../../api/_generated/skyApi'
import type { PlaySubscriptionCheckout } from '../../api/_generated/skyApi.schemas'
import { useScrollToAfterRender } from '../../hooks/useScrollToAfterRender'
import { useScrollToHashTarget } from '../../hooks/useScrollToHashTarget'
import { usePlaySubscriptionResult } from '../../hooks/usePlaySubscriptionResult'
import {
    buildPlaySubscriptionIntent,
    getInitialPlayPlan,
    getPlayCheckoutError,
    getPlaySubscriptionLabel,
    isPlayCheckoutExpired,
    PLAY_CHECKOUT_UNAVAILABLE,
    PLAY_SUBSCRIPTION_SLUGS,
    type PlaySubscriptionSlug
} from '../../utils/PlaySubscriptions'
import GooglePlayBillingNotice, { PREMIUM_WEBSITE_URL } from '../CoflCoins/GooglePlayBillingNotice'
import { CoflCoinsPurchaseBlock, PremiumSignIn, PremiumStatusLine, TermsAlerts } from './PremiumAccountSections'
import PremiumFeatures from './PremiumFeatures/PremiumFeatures'
import type { PremiumTier } from './PremiumPurchaseWizard/types'
import { SIGN_IN_TARGET, WIZARD_TARGET } from './purchaseTarget'
import { usePremiumAccount } from './usePremiumAccount'

const CHECKOUT_EXPIRED = 'This Google Play link expired. Please try again.'

export default function PlaySubscriptionPurchase({ requestedTier, forFriends }: { requestedTier: PremiumTier | null; forFriends: boolean }) {
    const account = usePremiumAccount()
    const [slug, setSlug] = useState<PlaySubscriptionSlug | ''>(() => getInitialPlayPlan(requestedTier, forFriends))
    const [pendingRequest, setPendingRequest] = useState<AbortController>()
    const [checkout, setCheckout] = useState<PlaySubscriptionCheckout>()
    const [message, setMessage] = useState('')
    const [showSignIn, setShowSignIn] = useState(false)
    const [token, setToken] = useState<string>()
    const scrollTo = useScrollToAfterRender(SIGN_IN_TARGET)
    const scrollOnArrival = useScrollToHashTarget(WIZARD_TARGET)
    const failedPurchase = usePlaySubscriptionResult(true)
    const expired = checkout && isPlayCheckoutExpired(checkout.expiresAt)
    const notice = message || (expired ? CHECKOUT_EXPIRED : '')

    async function refreshTerms(headers: HeadersInit, signal: AbortSignal) {
        const response = await getApiUserTerms({ locale: account.legalLocale }, { headers, signal, cache: 'no-store' })
        if (signal.aborted) return
        if (response.status !== 200) {
            setMessage('The agreement could not be loaded. Please try again later.')
            return
        }
        account.setTermsStatus(response.data)
        if (response.data.required) scrollTo('terms-acceptance')
        else setMessage('Please try your purchase again.')
    }

    async function subscribe() {
        if (!slug || pendingRequest) return
        if (!token || !account.isLoggedIn) {
            setShowSignIn(true)
            return
        }

        const headers = { GoogleToken: token }
        const controller = new AbortController()
        const { signal } = controller
        setPendingRequest(controller)
        setCheckout(undefined)
        setMessage('')
        try {
            const response = await postApiPremiumSubscriptionProductSlugPlaystore(slug, { headers, signal })
            if (signal.aborted) return
            if (response.status === 200) {
                setCheckout(response.data)
                return
            }

            const failure = getPlayCheckoutError(response.status, response.data)
            if (failure.kind === 'terms') {
                await refreshTerms(headers, signal)
                return
            }
            setMessage(failure.message)
            if (failure.kind === 'signIn') {
                setToken(undefined)
                setShowSignIn(true)
            }
        } catch {
            if (!signal.aborted) setMessage(PLAY_CHECKOUT_UNAVAILABLE)
        } finally {
            if (!signal.aborted) setPendingRequest(undefined)
        }
    }

    function changePlan(event: ChangeEvent<HTMLSelectElement>) {
        pendingRequest?.abort()
        setPendingRequest(undefined)
        setCheckout(undefined)
        setMessage('')
        setSlug(event.target.value as PlaySubscriptionSlug | '')
    }

    function guardCheckoutLink(event: MouseEvent<HTMLAnchorElement>) {
        if (checkout && !isPlayCheckoutExpired(checkout.expiresAt)) return
        event.preventDefault()
        setCheckout(undefined)
        setMessage(CHECKOUT_EXPIRED)
    }

    function closeSignIn() {
        setShowSignIn(false)
    }

    return (
        <>
            <PremiumStatusLine account={account} />
            <PremiumSignIn
                account={account}
                onAuthenticated={token => {
                    setToken(token)
                    setMessage('')
                    closeSignIn()
                }}
                dialog={{
                    showDialog: showSignIn,
                    onDialogClose: closeSignIn,
                    onLoginStart: closeSignIn,
                    onAfterLogin: account.onLogin,
                    onLoginFail: account.onLoginFail
                }}
            />
            <TermsAlerts account={account} />
            <section id="plans">
                {failedPurchase ? (
                    <Alert variant="warning">
                        Your {getPlaySubscriptionLabel(failedPurchase.slug)} subscription purchase could not be completed. {failedPurchase.error}
                    </Alert>
                ) : null}
                <GooglePlayBillingNotice />
                <p>
                    Starter, 13- and 52-week plans, creator and discount codes, slots, and Premium for friends are available on the{' '}
                    <a href={PREMIUM_WEBSITE_URL} target="_blank" rel="noreferrer">website</a>.
                </p>
                <Card id={WIZARD_TARGET} ref={scrollOnArrival} className="mb-4">
                    <Card.Body>
                        <h2>Subscribe with Google Play</h2>
                        <p>Subscriptions renew every 4 weeks. Google Play shows the final price before you pay.</p>
                        <Form.Group controlId="play-subscription-tier" className="mb-3">
                            <Form.Label>Plan</Form.Label>
                            <Form.Select value={slug} onChange={changePlan}>
                                <option value="" disabled>Choose a plan</option>
                                {PLAY_SUBSCRIPTION_SLUGS.map(slug => (
                                    <option key={slug} value={slug}>{getPlaySubscriptionLabel(slug)}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {notice ? <Alert variant="warning">{notice}</Alert> : null}
                        {slug && checkout && !expired ? (
                            <>
                                <p>Purchasing for {checkout.accountLabel}</p>
                                <a className="btn btn-primary matomo_ignore" href={buildPlaySubscriptionIntent(slug, checkout)} onClick={guardCheckoutLink}>
                                    Continue to Google Play
                                </a>
                            </>
                        ) : (
                            <Button disabled={!slug || !!pendingRequest || account.isLoading || (account.isLoggedIn && !account.canPurchase)} onClick={() => void subscribe()}>
                                {pendingRequest ? 'Preparing Google Play checkout…' : 'Buy with Google Play'}
                            </Button>
                        )}
                    </Card.Body>
                </Card>
            </section>
            <CoflCoinsPurchaseBlock account={account} />
            <hr />
            <h2>Features</h2>
            <PremiumFeatures />
        </>
    )
}
