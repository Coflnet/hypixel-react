'use client'
import { useEffect, useState } from 'react'
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

    useEffect(() => {
        loadDefaultCountry()
        
        // Set up event listeners for Android Billing
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
            
            // Don't show error for user cancellation
            if (customEvent.detail.error === 'User canceled purchase') {
                toast.info('Purchase cancelled')
            } else {
                toast.error(`Purchase failed: ${customEvent.detail.error}`)
            }
        }

        window.addEventListener('androidBillingSuccess', handleBillingSuccess)
        window.addEventListener('androidBillingError', handleBillingError)
        
        // Check for Android Billing availability with a delay to allow TWA to inject
        const checkTimer = setTimeout(() => {
            checkGooglePlayAvailability()
        }, 500)
        
        // Also check when page becomes visible (TWA might inject after initial load)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkGooglePlayAvailability()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        // Listen for billing ready event
        const handleBillingReady = () => {
            console.log('[Billing] Android Billing is ready')
            checkGooglePlayAvailability()
        }
        window.addEventListener('androidBillingReady', handleBillingReady)
        
        return () => {
            clearTimeout(checkTimer)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('androidBillingReady', handleBillingReady)
            window.removeEventListener('androidBillingSuccess', handleBillingSuccess)
            window.removeEventListener('androidBillingError', handleBillingError)
        }
    }, [])

    function checkGooglePlayAvailability() {
        // Check if we're in the Android TWA with AndroidBilling bridge
        const hasAndroidBilling = !!(window as any).AndroidBilling
        const available = hasAndroidBilling && typeof (window as any).AndroidBilling.isAvailable === 'function'
            ? (window as any).AndroidBilling.isAvailable()
            : false
        
        console.log('[Billing] checkGooglePlayAvailability result:', available, {
            hasAndroidBilling,
            isAvailableMethod: typeof (window as any).AndroidBilling?.isAvailable,
            androidBillingKeys: hasAndroidBilling ? Object.keys((window as any).AndroidBilling || {}) : [],
            windowKeys: Object.keys(window)
                .filter(k => k.toLowerCase().includes('android') || k.toLowerCase().includes('billing'))
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

    function onPayGooglePlay(productId: string, purchaseToken: string, coflCoins?: number) {
        // Note: purchaseToken parameter is ignored - it's only for API compatibility
        // The Android app handles the purchase token and server validation
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        console.log('[Billing] onPayGooglePlay called', { productId, coflCoins })
        
        // Check if Android Billing is available
        if (!(window as any).AndroidBilling) {
            toast.error('Google Play billing is not available')
            setLoadingId('')
            return
        }

        // Trigger Google Play billing flow via AndroidBilling bridge
        console.log('[Billing] Calling AndroidBilling.purchaseProduct with product:', productId)
        
        try {
            ;(window as any).AndroidBilling.purchaseProduct(productId)
            // Note: The result will come through androidBillingSuccess or androidBillingError events
            // The Android app will automatically validate with the server
        } catch (error) {
            console.error('[Billing] Failed to trigger purchase:', error)
            toast.error('Failed to start purchase flow')
            setLoadingId('')
        }
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
