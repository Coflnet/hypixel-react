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

    function checkGooglePlayAvailability() {
        // Check if we're in a TWA (Trusted Web Activity) or have Google Play Billing available
        // This checks for the Android interface injected by the TWA
        setIsGooglePlayAvailable(typeof (window as any).AndroidInterface !== 'undefined' || typeof (window as any).requestGooglePlayPurchase !== 'undefined')
    }

    function setupGooglePlayCallback() {
        // Set up callback for TWA Google Play billing response
        ;(window as any).onGooglePlayPurchaseComplete = async (purchaseToken: string, productId: string, packageName: string) => {
            const loadingKey = loadingId || productId
            try {
                const googleToken = sessionStorage.getItem('googleId')
                if (!googleToken) {
                    toast.error('Please login to complete the purchase')
                    setLoadingId('')
                    return
                }

                // Extract coin amount from loading ID if it's a custom amount
                let customAmount: number | undefined
                if (loadingKey.includes('_')) {
                    const parts = loadingKey.split('_')
                    customAmount = parseInt(parts[1])
                }

                // Call the generated API with GoogleToken header
                const response = await postApiTopupPlaystore(
                    {
                        productId,
                        purchaseToken,
                        packageName,
                        userId: googleToken,
                        customAmount
                    },
                    {
                        headers: {
                            GoogleToken: googleToken
                        }
                    }
                )

                if (response.status === 200) {
                    setLoadingId('')
                    toast.success('Purchase successful! Your CoflCoins have been added.')
                    // Refresh coflcoins balance
                    document.dispatchEvent(new CustomEvent('coflcoin-update'))
                } else {
                    throw new Error('Purchase verification failed')
                }
            } catch (error) {
                setLoadingId('')
                toast.error('Google Play purchase verification failed. Please contact support.')
                console.error('Google Play purchase error:', error)
            }
        }
    }

    useEffect(() => {
        loadDefaultCountry()
        checkGooglePlayAvailability()
        setupGooglePlayCallback()
    }, [])

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
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        
        // Check if we have a purchase token (from TWA callback) or need to trigger billing
        if (purchaseToken) {
            // Token provided directly (manual entry or already processed)
            const googleToken = sessionStorage.getItem('googleId')
            if (!googleToken) {
                toast.error('Please login to complete the purchase')
                setLoadingId('')
                return
            }

            postApiTopupPlaystore(
                {
                    productId,
                    purchaseToken,
                    packageName: 'com.coflnet.app',
                    userId: googleToken,
                    customAmount: coflCoins
                },
                {
                    headers: {
                        GoogleToken: googleToken
                    }
                }
            )
                .then(response => {
                    if (response.status === 200) {
                        setLoadingId('')
                        toast.success('Purchase successful! Your CoflCoins have been added.')
                        document.dispatchEvent(new CustomEvent('coflcoin-update'))
                    } else {
                        throw new Error('Purchase verification failed')
                    }
                })
                .catch(error => {
                    setLoadingId('')
                    toast.error('Google Play purchase failed. Please try again.')
                    console.error('Google Play purchase error:', error)
                })
        } else {
            // Trigger Google Play billing flow via TWA
            if (typeof (window as any).AndroidInterface !== 'undefined' && (window as any).AndroidInterface.requestGooglePlayPurchase) {
                ;(window as any).AndroidInterface.requestGooglePlayPurchase(productId)
            } else if (typeof (window as any).requestGooglePlayPurchase !== 'undefined') {
                ;(window as any).requestGooglePlayPurchase(productId)
            } else {
                toast.error('Google Play billing is not available')
                setLoadingId('')
            }
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
