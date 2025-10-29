'use client'
import { useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { postApiTopupPlaystore } from '../../api/_generated/skyApi'
import { useCoflCoins } from '../../utils/Hooks'
import CoflCoinPurchaseWizard from './CoflCoinPurchaseWizard'
import PurchaseElement from './PurchaseElement'
import { Country, getCountry, getCountryFromUserLanguage } from '../../utils/CountryUtils'
import CountrySelect from '../CountrySelect/CountrySelect'
import { USER_COUNTRY_CODE } from '../../utils/SettingsUtils'
import styles from './CoflCoinsPurchase.module.css'

interface Props {
    cancellationRightLossConfirmed: boolean
    userCountry?: string
}

function Payment(props: Props) {
    let [loadingId, setLoadingId] = useState('')
    let [currentRedirectLink, setCurrentRedirectLink] = useState('')
    let [showAll, setShowAll] = useState(false)
    let [defaultCountry, setDefaultCountry] = useState<Country>()
    let [selectedCountry, setSelectedCountry] = useState<Country>()
    let [useWizard, setUseWizard] = useState(true)
    let [isGooglePlayAvailable, setIsGooglePlayAvailable] = useState(false)
    let coflCoins = useCoflCoins()
    let isDisabled = !props.cancellationRightLossConfirmed || !selectedCountry

    // Initialize billing on first render
    if (typeof window !== 'undefined' && !(window as any).__billingInitialized) {
        (window as any).__billingInitialized = true
        initializeBilling()
    }

    function initializeBilling() {
        // Check for billing errors in URL hash
        const hash = window.location.hash
        if (hash.startsWith('#billing_error_')) {
            const errorMatch = hash.match(/#billing_error_([^_]+)_(.+)/)
            if (errorMatch) {
                const errorId = errorMatch[1]
                const errorMessage = decodeURIComponent(errorMatch[2].replace(/\+/g, ' '))
                
                console.error('[Billing] Error from Android:', { errorId, errorMessage })
                
                // Show user-friendly error message
                let userMessage = 'Purchase failed: ' + errorMessage
                if (errorMessage === 'Server validation failed' || errorMessage === 'Product not found') {
                    userMessage += '. Please contact support if this issue persists.'
                }
                
                toast.error(userMessage, { autoClose: 10000 })
                
                // Clear the error from URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                
                // Clear loading state if it matches the error ID
                if (loadingId && loadingId.includes(errorId)) {
                    setLoadingId('')
                }
            }
        }
        
        // Load country
        loadDefaultCountry()
        
        // Check for Android Billing availability with a delay
        setTimeout(() => {
            checkGooglePlayAvailability()
        }, 500)
        
        // Also check when page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkGooglePlayAvailability()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        // Set up event listeners for Android Billing events (CustomEvents)
        const handleBillingSuccess = (event: Event) => {
            const customEvent = event as CustomEvent<{ productId: string; purchaseToken: string }>
            console.log('[Billing] androidBillingSuccess event received', customEvent.detail)
            
            setLoadingId('')
            toast.success('Purchase successful! Your CoflCoins have been added.')
            // Refresh coflcoins balance
            document.dispatchEvent(new CustomEvent('coflcoin-update'))
        }

        const handleBillingError = (event: Event) => {
            const customEvent = event as CustomEvent<{ error: string }>
            console.error('[Billing] androidBillingError event received', customEvent.detail)
            
            setLoadingId('')
            
            // Show user-friendly error message
            const error = customEvent.detail.error
            let userMessage = 'Purchase failed: ' + error
            if (error === 'Server validation failed' || error === 'Product not found') {
                userMessage += '. Please contact support if this issue persists.'
            }
            
            if (error === 'Purchase canceled by user') {
                toast.info('Purchase cancelled')
            } else {
                toast.error(userMessage, { autoClose: 10000 })
            }
        }

        window.addEventListener('androidBillingSuccess', handleBillingSuccess)
        window.addEventListener('androidBillingError', handleBillingError)
        
        // Also listen for postMessage from Android app
        const handleMessage = (event: MessageEvent) => {
            console.log('[Billing] Received postMessage:', event.data)
            
            if (event.data?.type === 'androidBillingSuccess') {
                const { productId, purchaseToken } = event.data
                console.log('[Billing] Purchase success via postMessage', { productId, purchaseToken })
                setLoadingId('')
                toast.success('Purchase successful! Your CoflCoins have been added.')
                document.dispatchEvent(new CustomEvent('coflcoin-update'))
            } else if (event.data?.type === 'androidBillingError') {
                const { error } = event.data
                console.error('[Billing] Purchase error via postMessage', error)
                setLoadingId('')
                
                // Show user-friendly error message
                let userMessage = 'Purchase failed: ' + error
                if (error === 'Server validation failed' || error === 'Product not found') {
                    userMessage += '. Please contact support if this issue persists.'
                }
                
                if (error === 'Purchase canceled by user') {
                    toast.info('Purchase cancelled')
                } else {
                    toast.error(userMessage, { autoClose: 10000 })
                }
            }
        }
        
        window.addEventListener('message', handleMessage)
    }

    function checkGooglePlayAvailability() {
        // Check if we're running in the Android app
        // The Android app is a TWA, so we check user agent and assume billing is available
        const isAndroid = /android/i.test(navigator.userAgent)
        const isTWA = document.referrer.includes('android-app://com.coflnet.sky')
        const available = isAndroid && (isTWA || window.matchMedia('(display-mode: standalone)').matches)
        
        console.log('[Billing] checkGooglePlayAvailability result:', available, {
            isAndroid,
            isTWA,
            isStandalone: window.matchMedia('(display-mode: standalone)').matches,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        })
        
        setIsGooglePlayAvailable(available)
    }

    async function loadDefaultCountry() {
        let cachedCountryCode = localStorage.getItem(USER_COUNTRY_CODE)
        if (cachedCountryCode) {
            setDefaultCountry(getCountry(cachedCountryCode))
            setSelectedCountry(getCountry(cachedCountryCode))
            return
        }

        let response: Response | null = null
        try {
            response = await fetch('https://api.country.is')
        } catch (error) {
            console.warn('Failed to fetch country from api.country.is:', error)
            // Fallback to country from browser language
            let country = getCountryFromUserLanguage()
            setDefaultCountry(country)
            setSelectedCountry(country)
            return
        }

        if (response && response.ok) {
            let result = await response.json()
            let country = getCountry(result.country) || getCountryFromUserLanguage()
            setDefaultCountry(country)
            setSelectedCountry(country)
            localStorage.setItem(USER_COUNTRY_CODE, result.country)
        } else {
            let country = getCountryFromUserLanguage()
            setDefaultCountry(country)
            setSelectedCountry(country)
        }
    }

    function onPayPaypal(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        setCurrentRedirectLink('')
        api.paypalPurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink, '_self')
            })
            .catch(onPaymentRedirectFail)
    }

    function onPayStripe(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        setCurrentRedirectLink('')
        api.stripePurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink, '_self')
            })
            .catch(onPaymentRedirectFail)
    }

    function onPayLemonSqueezy(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        setCurrentRedirectLink('')
        api.lemonsqueezyPurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink, '_self')
            })
            .catch(onPaymentRedirectFail)
    }

    function onPayGooglePlay(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        console.log('[Billing] onPayGooglePlay called', { productId, coflCoins })
        
        const googleToken = typeof window !== 'undefined' ? sessionStorage.getItem('googleId') : null
        const requestOptions: RequestInit | undefined = googleToken ? { headers: { GoogleToken: googleToken } } : undefined
        postApiTopupPlaystore(requestOptions)
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to get user ID from backend')
                }
                
                const userId = response.data.userId
                if (!userId) {
                    throw new Error('User ID not found in response')
                }
                
                // Trigger Google Play billing flow via deep link with userId
                const deepLink = `skycofl://billing/purchase?productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(userId)}`
                console.log('[Billing] Triggering purchase via deep link:', deepLink)
                
                navigateTo(deepLink)
                
                // Set a timeout to show error if nothing happens
                setTimeout(() => {
                    if (loadingId) {
                        console.warn('[Billing] Purchase timed out - no response from Android app')
                    }
                }, 30000)
            })
            .catch(error => {
                console.error('[Billing] Failed to get userId or trigger purchase:', error)
                toast.error('Failed to start purchase flow')
                setLoadingId('')
            })
    }

    function navigateTo(url: string) {
        // Enable mock by setting window.__mockDeepLink = true in the browser console
        if ((window as any).__mockDeepLink) {
            console.log('[Billing] MOCK navigate to', url)
            return
        }
        window.location.href = url
    }

    function onPaymentRedirectFail() {
        setCurrentRedirectLink('')
        setLoadingId('')
        toast.error('Something went wrong. Please try again.')
    }

    function getDisabledPaymentTooltip() {
        if (!props.cancellationRightLossConfirmed) {
            return <span>Please note the information regarding your cancellation right above.</span>
        }
        if (!selectedCountry) {
            return <span>Please select your country. This information is necessary for tax purposes.</span>
        }
        return undefined
    }

    let disabledTooltip = getDisabledPaymentTooltip()

    if (!props.cancellationRightLossConfirmed || !selectedCountry) {
        return (
            <div>
                {defaultCountry ? (
                    <CountrySelect key="country-select" isLoading={!defaultCountry} defaultCountry={defaultCountry} onCountryChange={setSelectedCountry} />
                ) : (
                    <CountrySelect key="loading-country-select" isLoading />
                )}

                {!props.cancellationRightLossConfirmed && (
                    <Alert variant="warning" style={{ marginTop: '20px' }}>
                        Please note the information regarding your cancellation right above.
                    </Alert>
                )}

                {!selectedCountry && (
                    <Alert variant="info" style={{ marginTop: '20px' }}>
                        Please select your country. This information is necessary for tax purposes.
                    </Alert>
                )}
            </div>
        )
    }

    if (useWizard) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        {defaultCountry ? (
                            <CountrySelect
                                key="country-select"
                                isLoading={!defaultCountry}
                                defaultCountry={defaultCountry}
                                onCountryChange={setSelectedCountry}
                            />
                        ) : (
                            <CountrySelect key="loading-country-select" isLoading />
                        )}
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={() => setUseWizard(false)}>
                        Switch to Classic View
                    </Button>
                </div>

                <CoflCoinPurchaseWizard
                    coflCoins={coflCoins}
                    countryCode={selectedCountry?.value}
                    onPayPalPay={onPayPaypal}
                    onStripePay={onPayStripe}
                    onLemonSqueezyPay={onPayLemonSqueezy}
                    onGooglePlayPay={onPayGooglePlay}
                    loadingProductId={loadingId}
                    isGooglePlayAvailable={isGooglePlayAvailable}
                />
            </div>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    {defaultCountry ? (
                        <CountrySelect key="country-select" isLoading={!defaultCountry} defaultCountry={defaultCountry} onCountryChange={setSelectedCountry} />
                    ) : (
                        <CountrySelect key="loading-country-select" isLoading />
                    )}
                </div>
                <Button variant="outline-primary" size="sm" onClick={() => setUseWizard(true)}>
                    Switch to New Wizard
                </Button>
            </div>

            <div className={styles.productGrid}>
                <PurchaseElement
                    coflCoinsToBuy={1800}
                    loadingProductId={loadingId}
                    redirectLink={currentRedirectLink}
                    paypalPrice={8.69}
                    stripePrice={8.42}
                    lemonsqueezyPrice={8.69}
                    googlePlayPrice={8.42}
                    disabledTooltip={disabledTooltip}
                    isDisabled={isDisabled}
                    onPayPalPay={onPayPaypal}
                    onStripePay={onPayStripe}
                    onLemonSqeezyPay={onPayLemonSqueezy}
                    onGooglePlayPay={onPayGooglePlay}
                    paypalProductId="p_cc_1800"
                    stripeProductId="s_cc_1800"
                    lemonsqueezyProductId="l_cc_1800"
                    googlePlayProductId="ps_1800"
                    countryCode={selectedCountry ? selectedCountry.value : undefined}
                    isGooglePlayAvailable={isGooglePlayAvailable}
                />
                <PurchaseElement
                    coflCoinsToBuy={5400}
                    loadingProductId={loadingId}
                    redirectLink={currentRedirectLink}
                    paypalPrice={22.99}
                    stripePrice={22.69}
                    lemonsqueezyPrice={22.69}
                    googlePlayPrice={22.69}
                    disabledTooltip={disabledTooltip}
                    isDisabled={isDisabled}
                    onPayPalPay={onPayPaypal}
                    onStripePay={onPayStripe}
                    onLemonSqeezyPay={onPayLemonSqueezy}
                    onGooglePlayPay={onPayGooglePlay}
                    paypalProductId="p_cc_5400"
                    stripeProductId="s_cc_5400"
                    lemonsqueezyProductId="l_cc_5400"
                    googlePlayProductId="ps_5400"
                    countryCode={selectedCountry ? selectedCountry.value : undefined}
                    isGooglePlayAvailable={isGooglePlayAvailable}
                />
                {!showAll ? (
                    <Button
                        style={{ width: '100%' }}
                        onClick={() => {
                            setShowAll(true)
                        }}
                    >
                        Show all CoflCoin Options
                    </Button>
                ) : null}
                {showAll ? (
                    <>
                        <PurchaseElement
                            coflCoinsToBuy={10800}
                            loadingProductId={loadingId}
                            redirectLink={currentRedirectLink}
                            paypalPrice={39.69}
                            stripePrice={38.99}
                            lemonsqueezyPrice={39.69}
                            googlePlayPrice={38.99}
                            disabledTooltip={disabledTooltip}
                            isDisabled={isDisabled}
                            onPayPalPay={onPayPaypal}
                            onStripePay={onPayStripe}
                            onLemonSqeezyPay={onPayLemonSqueezy}
                            onGooglePlayPay={onPayGooglePlay}
                            paypalProductId="p_cc_10800"
                            stripeProductId="s_cc_10800"
                            lemonsqueezyProductId="l_cc_10800"
                            googlePlayProductId="ps_10800"
                            countryCode={selectedCountry ? selectedCountry.value : undefined}
                            isGooglePlayAvailable={isGooglePlayAvailable}
                        />
                        <PurchaseElement
                            coflCoinsToBuy={21600}
                            loadingProductId={loadingId}
                            redirectLink={currentRedirectLink}
                            paypalPrice={78.69}
                            stripePrice={74.99}
                            lemonsqueezyPrice={78.69}
                            googlePlayPrice={74.99}
                            disabledTooltip={disabledTooltip}
                            isDisabled={isDisabled}
                            onPayPalPay={onPayPaypal}
                            onStripePay={onPayStripe}
                            onLemonSqeezyPay={onPayLemonSqueezy}
                            onGooglePlayPay={onPayGooglePlay}
                            paypalProductId="p_cc_21600"
                            stripeProductId="s_cc_21600"
                            lemonsqueezyProductId="l_cc_21600"
                            googlePlayProductId="ps_21600"
                            countryCode={selectedCountry ? selectedCountry.value : undefined}
                            isGooglePlayAvailable={isGooglePlayAvailable}
                        />
                        {coflCoins % 1800 != 0 ? (
                            <PurchaseElement
                                coflCoinsToBuy={1800 + (1800 - (coflCoins % 1800))}
                                loadingProductId={loadingId}
                                redirectLink={currentRedirectLink}
                                paypalPrice={(8.69 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                stripePrice={(8.42 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                lemonsqueezyPrice={(8.69 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                googlePlayPrice={(8.42 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                disabledTooltip={disabledTooltip}
                                isDisabled={isDisabled}
                                onPayPalPay={onPayPaypal}
                                onStripePay={onPayStripe}
                                onLemonSqeezyPay={onPayLemonSqueezy}
                                onGooglePlayPay={onPayGooglePlay}
                                isSpecial1800CoinsMultiplier
                                paypalProductId="p_cc_1800"
                                stripeProductId="s_cc_1800"
                                lemonsqueezyProductId="l_cc_1800"
                                googlePlayProductId="ps_1800"
                                countryCode={selectedCountry ? selectedCountry.value : undefined}
                                isGooglePlayAvailable={isGooglePlayAvailable}
                            />
                        ) : null}
                    </>
                ) : null}
            </div>
        </div>
    )
}

export default Payment
