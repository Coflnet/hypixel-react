'use client'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { getHighestPriorityPremiumProduct } from '../../utils/PremiumTypeUtils'
import { parseTierFromUrl } from '../../utils/PremiumUpgradeUtils'
import usePremiumRefresh from '../../hooks/usePremiumRefresh'
import { PremiumTier } from './PremiumPurchaseWizard/types'
import type { TierRequest } from './PremiumPurchaseWizard/PremiumPurchaseWizard'
import type { PurchaseReadiness } from './purchaseTarget'
import { getLegalLocale } from '../../utils/LegalLinks'

/** reads ?tier=, ?upgrade= and ?slots= once after mount */
function useUpgradeRequestFromUrl(onSlots: () => void, onUpgrade: () => void) {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const tierParam = urlParams.get('tier')
        const slots = urlParams.get('slots') === 'true'
        if (slots) onSlots()
        if ((tierParam && parseTierFromUrl(tierParam)) || urlParams.get('upgrade') === 'true' || slots) onUpgrade()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}

function replaceUrl(url: URL) {
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
}

function setTierInUrl(tier: PremiumTier) {
    const url = new URL(window.location.href)
    url.searchParams.set('tier', tier)
    replaceUrl(url)
}

/** the url of the slot purchase (SLOTS_URL) without a reload; the wizard would preselect a ?tier= */
function setSlotsInUrl() {
    const url = new URL(window.location.href)
    url.searchParams.delete('tier')
    url.searchParams.set('slots', 'true')
    replaceUrl(url)
}

/** account, ownership and terms state of the /premium page; shared by both A/B variants */
export function usePremiumAccount() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [hasPremium, setHasPremium] = useState<boolean>()
    const [activePremiumProduct, setActivePremiumProduct] = useState<PremiumProduct>()
    const [products, setProducts] = useState<PremiumProduct[]>([])
    const [premiumSubscriptions, setPremiumSubscriptions] = useState<PremiumSubscription[]>([])
    const [hasSubscriptionLoadingError, setHasSubscriptionLoadingError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showUpgradeWizard, setShowUpgradeWizard] = useState(false)
    const [showSlots, setShowSlots] = useState(false)
    const [requestedTier, setRequestedTier] = useState<TierRequest | null>(null)
    const [termsStatus, setTermsStatus] = useState<TermsStatus>()
    const legalLocale = getLegalLocale()

    usePremiumRefresh(isLoggedIn, () => Promise.allSettled([loadPremiumProducts(), loadPremiumSubscriptions()]))
    useUpgradeRequestFromUrl(
        () => setShowSlots(true),
        () => setShowUpgradeWizard(true)
    )

    function returnToPremiumManagement() {
        setShowUpgradeWizard(false)
        setShowSlots(false)
        setRequestedTier(null)
        const url = new URL(window.location.href)
        url.searchParams.delete('tier')
        url.searchParams.delete('upgrade')
        url.searchParams.delete('slots')
        // other parameters stay, e.g. the QA override ?premiumVariant=, so a reload keeps the variant
        window.history.replaceState({}, '', url.pathname + url.search)
    }

    /** a plan card was picked: open the purchase wizard on that tier (same as /premium?tier=...) */
    function requestTier(tier: PremiumTier) {
        setTierInUrl(tier)
        setShowSlots(false)
        // a new object per click, so picking the same plan again re-selects it after the visitor moved on in the wizard
        setRequestedTier({ tier })
        setShowUpgradeWizard(true)
    }

    /** open the purchase wizard for slots and bundles (same as /premium?slots=true, without the reload) */
    function requestSlots() {
        setSlotsInUrl()
        setShowSlots(true)
        setRequestedTier(null)
        setShowUpgradeWizard(true)
    }

    function loadPremiumProducts(): Promise<void> {
        return api.getPremiumProducts(true).then(products => {
            products = products.filter(product => product.expires.getTime() > new Date().getTime())
            setProducts(products)
            const activePremiumProduct = getHighestPriorityPremiumProduct(products)

            setHasPremium(!!activePremiumProduct)
            // Keep unchanged status stable so polling does not reset the purchase wizard.
            setActivePremiumProduct(current => (JSON.stringify(current) === JSON.stringify(activePremiumProduct) ? current : activePremiumProduct))
        })
    }

    function loadPremiumSubscriptions(): Promise<void> {
        return api
            .getPremiumSubscriptions()
            .then(subscriptions => {
                setHasSubscriptionLoadingError(false)
                subscriptions = subscriptions.filter(subscription => !subscription.endsAt || subscription.endsAt.getTime() > new Date().getTime())
                setPremiumSubscriptions(subscriptions)
            })
            .catch(() => setHasSubscriptionLoadingError(true))
    }

    function loadTermsStatus(): Promise<TermsStatus | undefined> {
        return api
            .getTermsStatus(legalLocale)
            .then(status => {
                setTermsStatus(status)
                return status
            })
            .catch(() => {
                setTermsStatus(undefined)
                toast.error(
                    legalLocale === 'de'
                        ? 'Das aktuelle SkyCofl-Vertragspaket konnte nicht geladen werden.'
                        : 'The current SkyCofl agreement package could not be loaded.'
                )
                return undefined
            })
    }

    function acceptTerms() {
        if (!termsStatus) return
        setIsLoading(true)
        api.acceptTerms(termsStatus.version, termsStatus.agreementHash, `web-premium-${legalLocale}`, legalLocale)
            .then(setTermsStatus)
            .catch(() =>
                toast.error(
                    legalLocale === 'de' ? 'Das SkyCofl-Vertragspaket konnte nicht angenommen werden.' : 'The SkyCofl agreement package could not be accepted.'
                )
            )
            .finally(() => setIsLoading(false))
    }

    function onSubscriptionCancel(subscription: PremiumSubscription) {
        return api.cancelPremiumSubscription(subscription.externalId).then(() => {
            toast.success('Subscription cancelled')
            return loadPremiumSubscriptions()
        })
    }

    /**
     * GoogleSignIn completed the login: loads the account. Resolves once everything has loaded, with what the
     * loaded data allows (the state of this render would be stale by then); undefined without a session token.
     */
    function onLogin(): Promise<PurchaseReadiness | undefined> {
        const googleId = sessionStorage.getItem('googleId')
        if (!googleId) return Promise.resolve(undefined)
        setIsLoading(true)
        setIsLoggedIn(true)
        return Promise.all([loadPremiumProducts(), loadPremiumSubscriptions(), loadTermsStatus()])
            .then(([, , terms]) => ({ isLoggedIn: true, isLoading: false, canPurchase: terms?.canStartNewContract === true }))
            .finally(() => setIsLoading(false))
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        setHasPremium(false)
        setTermsStatus(undefined)
    }

    const canPurchase = termsStatus?.canStartNewContract === true

    return {
        isLoggedIn,
        hasPremium,
        activePremiumProduct,
        products,
        premiumSubscriptions,
        activeSubscriptions: premiumSubscriptions.filter(subscription => !subscription.endsAt),
        hasSubscriptionLoadingError,
        isLoading,
        showUpgradeWizard,
        setShowUpgradeWizard,
        showSlots,
        requestedTier,
        termsStatus,
        legalLocale,
        canPurchase,
        /** the purchase wizard is rendered at #buyPremium */
        isWizardShown: isLoggedIn && canPurchase && (!hasPremium || showUpgradeWizard),
        returnToPremiumManagement,
        requestTier,
        requestSlots,
        loadPremiumProducts,
        loadPremiumSubscriptions,
        acceptTerms,
        onSubscriptionCancel,
        onLogin,
        onLoginFail
    }
}

export type PremiumAccount = ReturnType<typeof usePremiumAccount>
