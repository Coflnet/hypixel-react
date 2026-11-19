'use client'
import { MouseEvent, ReactNode, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, Button, Card } from 'react-bootstrap'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import CoflCoinsPurchase from '../CoflCoins/CoflCoinsPurchase'
import BuyPremium from './BuyPremium/BuyPremium'
import { getPremiumLabelForSubscription } from '../../utils/PremiumTypeUtils'
import { getLocalDateAndTime } from '../../utils/Formatter'
import PremiumStatus from './PremiumStatus/PremiumStatus'
import PremiumPurchaseWizard from './PremiumPurchaseWizard/PremiumPurchaseWizard'
import { CoinsSaleNote } from '../Discounts/DiscountBanners'
import AgreementDocumentList from '../Legal/AgreementDocumentList'
import UpgradeSubscription from './UpgradeSubscription/UpgradeSubscription'
import { PremiumAccount } from './usePremiumAccount'
import { usePremiumVariant } from './PremiumVariantContext'
import { trackPremiumFunnelEvent } from '../../utils/PremiumTracking'
import { SIGN_IN_TARGET, WIZARD_TARGET } from './purchaseTarget'
import { PremiumTier, getTierDisplayName } from './PremiumPurchaseWizard/types'
import { getPurchaseHeading } from './PremiumPurchaseWizard/wizardFlow'
import { findRenewingSubscription, getTierOfProduct, getTierOfSubscription } from '../../utils/PremiumUpgradeUtils'
import type { SignInDialogControl } from './useSignInPrompt'
import { PREMIUM_VARIANT_QUERY, withVariantOverride } from '../../utils/PremiumExperiment'
import { useScrollToHashTarget } from '../../hooks/useScrollToHashTarget'
import { getScrollBehavior } from '../../hooks/useScrollToAfterRender'
import sectionStyles from './PremiumAccountSections.module.css'

// Account and purchase building blocks of /premium, shared by both A/B variants so behaviour stays identical.

export const SLOTS_URL = '/premium?slots=true#buyPremium'

interface AccountProps {
    account: PremiumAccount
}

export function PremiumStatusLine({ account }: AccountProps) {
    const { isLoading, isLoggedIn, hasPremium, canPurchase } = account
    return (
        <>
            {isLoading ? (
                getLoadingElement()
            ) : !isLoggedIn ? (
                <div>
                    <p style={{ color: 'yellow', margin: 0 }}>To use Premium please login with Google.</p>
                </div>
            ) : hasPremium ? (
                <p className="text-success">You have a Premium account. Thank you for your support.</p>
            ) : (
                <div>
                    <p style={{ color: 'red', margin: 0 }}>You do not have a Premium account.</p>
                </div>
            )}
            {isLoggedIn && !hasPremium ? (
                <p>
                    <a href={canPurchase ? '#buyPremium' : '#terms-acceptance'}>I want Premium!</a>
                </p>
            ) : null}
        </>
    )
}

/**
 * Owns the page's GoogleSignIn, so it stays mounted through the whole login. `dialog` (useSignInPrompt) lets actions
 * open the sign-in dialog and continue after the login; without it the inline "Sign in" is the only entry point.
 */
export function PremiumSignIn({ account, dialog }: AccountProps & { dialog?: SignInDialogControl }) {
    const { isLoggedIn, isLoading, products, premiumSubscriptions, onSubscriptionCancel, hasSubscriptionLoadingError, onLogin, onLoginFail } = account
    return (
        <div id={SIGN_IN_TARGET} style={{ marginBottom: '20px' }}>
            {isLoggedIn ? (
                <PremiumStatus
                    products={products}
                    subscriptions={premiumSubscriptions}
                    onSubscriptionCancel={onSubscriptionCancel}
                    hasSubscriptionLoadingError={hasSubscriptionLoadingError}
                />
            ) : null}
            {dialog ? <GoogleSignIn {...dialog} /> : <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />}
            <div>{isLoading ? getLoadingElement() : ''}</div>
        </div>
    )
}

export function TermsAlerts({ account }: AccountProps) {
    const { isLoggedIn, isLoading, termsStatus, legalLocale, acceptTerms } = account
    if (!isLoggedIn) return null
    if (termsStatus?.required) {
        return (
            <Alert id="terms-acceptance" variant="warning">
                <p>
                    {legalLocale === 'de'
                        ? 'Bitte prüfen Sie vor einem neuen Kauf das vollständige SkyCofl-Vertragspaket:'
                        : 'Before starting a new purchase, please review the complete SkyCofl agreement package:'}
                </p>
                <AgreementDocumentList documents={termsStatus.documents} locale={legalLocale} />
                <p>
                    <a href={termsStatus.agreementUrl} target="_blank" rel="noreferrer">
                        {legalLocale === 'de' ? 'Unveränderliche Vertragsbeschreibung anzeigen' : 'View the immutable agreement descriptor'}
                    </a>
                </p>
                <Button disabled={isLoading} onClick={acceptTerms}>
                    {legalLocale === 'de' ? 'SkyCofl-Vertragspaket annehmen' : 'Accept the SkyCofl agreement package'}
                </Button>
            </Alert>
        )
    }
    if (isLoading || termsStatus) return null
    return (
        <Alert id="terms-acceptance" variant="danger">
            {legalLocale === 'de'
                ? 'Die Vertragsprüfung ist derzeit nicht verfügbar. Neue Käufe sind deaktiviert.'
                : 'The agreement check is currently unavailable. New purchases are disabled.'}
        </Alert>
    )
}

/** "Extend Premium" while an owner buys their own tier again, "Upgrade Premium" for a higher one (`wizardTier`: the wizard's choice) */
function getPurchaseTitle(account: PremiumAccount, wizardTier: PremiumTier | null | undefined): string {
    const { showSlots, hasPremium, showUpgradeWizard, requestedTier, activePremiumProduct } = account
    return getPurchaseHeading({
        forFriends: showSlots,
        hasPremium: !!hasPremium,
        isOwnerPurchase: showUpgradeWizard,
        currentTier: getTierOfProduct(activePremiumProduct),
        tier: wizardTier === undefined ? (requestedTier?.tier ?? null) : wizardTier
    })
}

export function PurchaseWizardSection({ account }: AccountProps) {
    if (!account.isWizardShown) return null
    // opening slots (or leaving them) starts the wizard over: choices made for a personal plan do not carry into the slot flow
    return <PurchaseWizardPanel key={account.showSlots ? 'slots' : 'own'} account={account} />
}

/** mounted while the wizard is shown, so the tier it reported is forgotten when it closes */
function PurchaseWizardPanel({ account }: AccountProps) {
    const { showSlots, hasPremium, showUpgradeWizard, activePremiumProduct, premiumSubscriptions, requestedTier } = account
    // undefined until the wizard chose a tier: the requested tier names the heading meanwhile
    const [wizardTier, setWizardTier] = useState<PremiumTier | null>()
    // the current page separates its sections with rules; the redesign nests the wizard in its plans section
    const isRedesign = usePremiumVariant() === 'new'
    const scrollOnArrival = useScrollToHashTarget(WIZARD_TARGET)
    return (
        <div id={WIZARD_TARGET} ref={scrollOnArrival} className={`${sectionStyles.purchaseSection} ${isRedesign ? sectionStyles.purchaseSectionNew : ''}`}>
            {isRedesign ? null : <hr />}
            <div className={sectionStyles.purchaseHead}>
                <h2 className={sectionStyles.purchaseTitle}>{getPurchaseTitle(account, wizardTier)}</h2>
                {hasPremium && showUpgradeWizard && (
                    <Button variant="secondary" size="sm" onClick={account.returnToPremiumManagement}>
                        ← Back to Premium Management
                    </Button>
                )}
            </div>
            <PremiumPurchaseWizard
                showSlots={showSlots}
                activePremiumProduct={activePremiumProduct!}
                premiumSubscriptions={premiumSubscriptions}
                requestedTier={requestedTier}
                onTierChange={setWizardTier}
                onNewActivePremiumProduct={() => {
                    account.returnToPremiumManagement()
                    void account.loadPremiumProducts()
                }}
            />
        </div>
    )
}

function isModifiedClick(event: MouseEvent): boolean {
    return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

interface SlotsLinkProps {
    children: ReactNode
    className?: string
    variant?: string
    /** when set, the click stays on the page and this runs instead of the navigation (to sign in first, or to open the wizard without a reload) */
    onSignInNeeded?(): void
}

/** link to the slot and bundle purchase; tracked as a funnel step in both variants */
export function SlotsLink({ children, className, variant = 'success', onSignInNeeded }: SlotsLinkProps) {
    const pageVariant = usePremiumVariant()
    // the link reloads /premium: a QA visitor keeps the variant forced with ?premiumVariant=
    const queryOverride = useSearchParams()?.get(PREMIUM_VARIANT_QUERY)

    function onClick(event: MouseEvent) {
        trackPremiumFunnelEvent('slots click', pageVariant, { source: 'link' })
        // a modified click (new tab or window) keeps working as a link
        if (!onSignInNeeded || isModifiedClick(event)) return
        event.preventDefault()
        onSignInNeeded()
    }

    return (
        <Button as="a" href={withVariantOverride(SLOTS_URL, queryOverride)} variant={variant} className={className} onClick={onClick}>
            {children}
        </Button>
    )
}

function ExtendHeaderActions({ account }: AccountProps) {
    const { hasSubscriptionLoadingError, activeSubscriptions } = account
    if (!hasSubscriptionLoadingError && activeSubscriptions.length > 0) {
        // a subscription whose plan cannot change (e.g. PayPal) gets no upgrade button
        const upgradable = activeSubscriptions.filter(subscription => subscription.canChangePlan !== false)
        return (
            <div>
                {upgradable.map(subscription => (
                    <div key={subscription.externalId}>
                        {activeSubscriptions.length > 1 && (
                            <span>
                                {getPremiumLabelForSubscription(subscription)} — renews {getLocalDateAndTime(subscription.renewsAt)}{' '}
                            </span>
                        )}
                        <UpgradeSubscription subscription={subscription} upgradeOnly />
                    </div>
                ))}
            </div>
        )
    }
    return (
        <Button variant="success" disabled={hasSubscriptionLoadingError} onClick={() => account.setShowUpgradeWizard(true)}>
            🚀 Upgrade to Higher Tier
        </Button>
    )
}

function scrollToWizard() {
    // the click renders the wizard; it is in the page once the frame after it is drawn
    window.requestAnimationFrame(() => document.getElementById(WIZARD_TARGET)?.scrollIntoView({ block: 'start', behavior: getScrollBehavior() }))
}

/** the slot purchase for a visitor already on /premium: no reload, the wizard opens and scrolls into view */
function openSlotsInPage(account: PremiumAccount) {
    account.requestSlots()
    scrollToWizard()
}

interface RenewingNoticeProps {
    subscription: PremiumSubscription
    confirming: boolean
    onConfirm(): void
    onCancel(): void
}

/** an owner whose subscription of this tier still renews: another one would be billed in addition, so they confirm it first */
function RenewingSubscriptionNotice({ subscription, confirming, onConfirm, onCancel }: RenewingNoticeProps) {
    return (
        <Alert variant="warning" data-testid="renewing-subscription-notice">
            <p>
                You already have a renewing {getTierDisplayName(getTierOfSubscription(subscription)!)} subscription. It renews on{' '}
                <strong>{getLocalDateAndTime(subscription.renewsAt)}</strong>. A new subscription is billed in addition to it; it does not replace it.
            </p>
            {confirming ? (
                <div className="d-flex gap-2 flex-wrap">
                    <Button variant="warning" onClick={onConfirm}>
                        Yes, start another subscription
                    </Button>
                    <Button variant="secondary" onClick={onCancel}>
                        Keep only my current subscription
                    </Button>
                </div>
            ) : null}
        </Alert>
    )
}

/** a new subscription goes through the purchase wizard (prices for the buyer's country, all payment providers, the promotion) */
function ExtendWithSubscription({ account }: AccountProps) {
    const tier = getTierOfProduct(account.activePremiumProduct) ?? PremiumTier.PREMIUM
    const renewing = findRenewingSubscription(account.activeSubscriptions, tier)
    const [confirming, setConfirming] = useState(false)

    function openWizard() {
        setConfirming(false)
        account.requestTier(tier)
        scrollToWizard()
    }

    // a renewing subscription of the same tier: the first click asks for the confirmation
    function onExtendClick() {
        if (!renewing) {
            openWizard()
            return
        }
        setConfirming(true)
    }

    return (
        <div style={{ marginBottom: '20px' }}>
            <h4>Subscriptions</h4>
            <p>Start a subscription for your current tier or a higher one. You choose the billing period and the payment method in the next steps.</p>
            {renewing ? <RenewingSubscriptionNotice subscription={renewing} confirming={confirming} onConfirm={openWizard} onCancel={() => setConfirming(false)} /> : null}
            <Button variant="success" disabled={account.hasSubscriptionLoadingError || confirming} onClick={onExtendClick}>
                Extend with a subscription
            </Button>
        </div>
    )
}

export function ExtendPremiumSection({ account, showFriendsCard }: AccountProps & { showFriendsCard: boolean }) {
    const { isLoggedIn, isLoading, canPurchase, hasPremium, showUpgradeWizard, activePremiumProduct, premiumSubscriptions } = account
    if (!isLoggedIn || isLoading || !canPurchase || !hasPremium || showUpgradeWizard) return null
    return (
        <div id="extendPremium" style={{ marginBottom: '20px' }}>
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Extend Premium</h2>
                <ExtendHeaderActions account={account} />
            </div>
            <p style={{ marginBottom: '30px' }} className="text-muted">
                Already have premium? You can extend your subscription, add more time, or upgrade to a higher tier.
            </p>
            <ExtendWithSubscription account={account} />
            {showFriendsCard ? (
                <Card className="mb-4">
                    <Card.Body>
                        <h4>Premium for friends</h4>
                        <p>Give your friends Premium access with a single slot or a four-slot bundle.</p>
                        <SlotsLink onSignInNeeded={() => openSlotsInPage(account)}>Explore slots & bundles</SlotsLink>
                    </Card.Body>
                </Card>
            ) : null}
            <details>
                <summary style={{ cursor: 'pointer', marginBottom: '20px' }}>
                    <strong>Advanced Options</strong>
                </summary>
                <div style={{ marginLeft: '20px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Prepaid</h4>
                        <BuyPremium
                            activePremiumProduct={activePremiumProduct!}
                            premiumSubscriptions={premiumSubscriptions}
                            onNewActivePremiumProduct={account.loadPremiumProducts}
                        />
                    </div>
                </div>
            </details>
        </div>
    )
}

/** the CoflCoins top-up at #coflcoins-purchase, only for logged in visitors who may start a purchase */
export function CoflCoinsPurchaseBlock({ account }: AccountProps) {
    if (!account.isLoggedIn || !account.canPurchase) return null
    return (
        <div id="coflcoins-purchase">
            <CoinsSaleNote />
            <CoflCoinsPurchase />
        </div>
    )
}
