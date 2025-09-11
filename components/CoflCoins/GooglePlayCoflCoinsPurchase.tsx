'use client'
import { useState, useEffect } from 'react'
import { Alert } from 'react-bootstrap'
import { useCoflCoins } from '../../utils/Hooks'
import { isGooglePlayStorePWA, isGooglePlayBillingAvailable } from '../../utils/PlatformUtils'
import { GOOGLE_PLAY_PRODUCT_PRICES } from '../../utils/GooglePlayBilling'
import GooglePlayPurchaseElement from './GooglePlayPurchaseElement'
import CountrySelect from '../CountrySelect/CountrySelect'
import { Country, getCountry, getCountryFromUserLanguage } from '../../utils/CountryUtils'
import { USER_COUNTRY_CODE } from '../../utils/SettingsUtils'
import styles from './CoflCoinsPurchase.module.css'

interface Props {
    cancellationRightLossConfirmed: boolean
    userCountry?: string
}

function GooglePlayCoflCoinsPurchase(props: Props) {
    const [defaultCountry, setDefaultCountry] = useState<Country>()
    const [selectedCountry, setSelectedCountry] = useState<Country>()
    const [isGooglePlayAvailable, setIsGooglePlayAvailable] = useState(false)
    const coflCoins = useCoflCoins()

    useEffect(() => {
        loadDefaultCountry()
        checkGooglePlayAvailability()
    }, [])

    const checkGooglePlayAvailability = () => {
        const isAvailable = isGooglePlayBillingAvailable()
        setIsGooglePlayAvailable(isAvailable)
        
        if (!isAvailable) {
            console.warn('Google Play Billing is not available in this environment')
        }
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

    const onPurchaseComplete = () => {
        // Refresh the page or update the UI to reflect the new CoflCoins balance
        window.location.reload()
    }

    if (!isGooglePlayAvailable) {
        return (
            <Alert variant="warning">
                <Alert.Heading>Google Play Payments Not Available</Alert.Heading>
                <p>
                    Google Play Store payments are only available when using the app from the Google Play Store.
                    Please download the app from the Play Store to use this payment method.
                </p>
            </Alert>
        )
    }

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

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                {defaultCountry ? (
                    <CountrySelect key="country-select" isLoading={!defaultCountry} defaultCountry={defaultCountry} onCountryChange={setSelectedCountry} />
                ) : (
                    <CountrySelect key="loading-country-select" isLoading />
                )}
            </div>

            <Alert variant="info" style={{ marginBottom: '20px' }}>
                <Alert.Heading>🎮 Google Play Store Exclusive</Alert.Heading>
                <p>
                    You're using the Google Play Store version of SkyCofl! 
                    Enjoy secure payments through Google Play with these special bundle offers.
                </p>
            </Alert>

            <div className={styles.productGrid}>
                <GooglePlayPurchaseElement
                    coflCoinAmount={1800}
                    price={GOOGLE_PLAY_PRODUCT_PRICES['com.coflnet.skyblock.coflcoins.1800']}
                    onPurchaseComplete={onPurchaseComplete}
                />
                
                <GooglePlayPurchaseElement
                    coflCoinAmount={5400}
                    price={GOOGLE_PLAY_PRODUCT_PRICES['com.coflnet.skyblock.coflcoins.5400']}
                    onPurchaseComplete={onPurchaseComplete}
                />
            </div>

            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h5>Why Google Play Store Payments?</h5>
                <ul style={{ marginBottom: 0 }}>
                    <li>Secure payments through Google's trusted infrastructure</li>
                    <li>Automatic purchase protection and refund policies</li>
                    <li>Seamless integration with your Google account</li>
                    <li>No need to enter payment details manually</li>
                </ul>
            </div>
        </div>
    )
}

export default GooglePlayCoflCoinsPurchase
