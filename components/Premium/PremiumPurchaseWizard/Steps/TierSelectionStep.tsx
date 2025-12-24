'use client'
import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import styles from './Steps.module.css'
import { PremiumTier } from '../types'
import { calculatePrice } from '../../../../utils/PricingUtils'
import { Country, getCountry, getCountryFromUserLanguage } from '../../../../utils/CountryUtils'
import CountrySelect from '../../../CountrySelect/CountrySelect'
import { USER_COUNTRY_CODE } from '../../../../utils/SettingsUtils'

interface Props {
    selectedTier: PremiumTier | null
    onTierSelect: (tier: PremiumTier) => void
    currentTier?: PremiumTier | null
    isUpgrade?: boolean
    suggestedTier?: PremiumTier | null
    activePremiumProduct?: PremiumProduct
    onCountryCodeChange?: (countryCode: string) => void
}
interface ActiveDiscount {
    description: string
    percentage: number
    code: string
}

export default function TierSelectionStep({ selectedTier, onTierSelect, currentTier, isUpgrade, suggestedTier, activePremiumProduct, onCountryCodeChange }: Props) {
    const [selectedCountry, setSelectedCountry] = useState<Country>()
    const [defaultCountry, setDefaultCountry] = useState<Country>()

    const handleCountryChange = (country: Country) => {
        setSelectedCountry(country)
        if (onCountryCodeChange && country.value) {
            onCountryCodeChange(country.value)
            localStorage.setItem('countryCode', country.value)
            localStorage.setItem(USER_COUNTRY_CODE, country.value)
        }
    }

    useEffect(() => {
        loadDefaultCountry()
    }, [])

    async function loadDefaultCountry() {
        let cachedCountryCode = localStorage.getItem(USER_COUNTRY_CODE)
        if (cachedCountryCode) {
            const country = getCountry(cachedCountryCode)
            setDefaultCountry(country)
            setSelectedCountry(country)
            // ensure both keys exist for other components
            try {
                localStorage.setItem('countryCode', cachedCountryCode)
            } catch {}
            return
        }

        let response: Response | null = null
        try {
            response = await fetch('https://api.country.is')
        } catch {
            console.error('Failed to fetch country from api.country.is')
        }

        if (response && response.ok) {
            let result = await response.json()
            let country = getCountry(result.country) || getCountryFromUserLanguage()
            setDefaultCountry(country)
            setSelectedCountry(country)
            if (onCountryCodeChange && country && country.value) {
                onCountryCodeChange(country.value)
                localStorage.setItem('countryCode', country.value)
                localStorage.setItem(USER_COUNTRY_CODE, country.value)
            } else {
                // still persist detected country
                try {
                    if (country && country.value) {
                        localStorage.setItem('countryCode', country.value)
                        localStorage.setItem(USER_COUNTRY_CODE, country.value)
                    } else {
                        localStorage.setItem(USER_COUNTRY_CODE, result.country)
                    }
                } catch {}
            }
        } else {
            let country = getCountryFromUserLanguage()
            setDefaultCountry(country)
            setSelectedCountry(country)
            if (onCountryCodeChange && country && country.value) {
                onCountryCodeChange(country.value)
                localStorage.setItem('countryCode', country.value)
                localStorage.setItem(USER_COUNTRY_CODE, country.value)
            } else {
                try {
                    if (country && country.value) {
                        localStorage.setItem('countryCode', country.value)
                        localStorage.setItem(USER_COUNTRY_CODE, country.value)
                    }
                } catch {}
            }
        }
    }

    // Calculate prices for each tier based on selected country
    const starterPricing = calculatePrice(PremiumTier.STARTER, selectedCountry?.value)
    const premiumPricing = calculatePrice(PremiumTier.PREMIUM, selectedCountry?.value)
    const premiumPlusPricing = calculatePrice(PremiumTier.PREMIUM_PLUS, selectedCountry?.value)
    const discountInfo: ActiveDiscount = {
        description: 'Summer End Discount',
        percentage: 0,
        code: 'NOMACRO'
    }
    const premiumPlusDiscounted = calculatePrice(PremiumTier.PREMIUM_PLUS, selectedCountry?.value, discountInfo.percentage) // 10% discount

    // Helper function to get tier rank for comparison
    const getTierRank = (tier: PremiumTier): number => {
        switch (tier) {
            case PremiumTier.STARTER:
                return 1
            case PremiumTier.PREMIUM:
                return 2
            case PremiumTier.PREMIUM_PLUS:
                return 3
            default:
                return 0
        }
    }

    // Helper function to check if tier can be selected (upgrade only)
    const canSelectTier = (tier: PremiumTier): boolean => {
        if (!isUpgrade || !currentTier) return true
        return getTierRank(tier) > getTierRank(currentTier)
    }

    // Helper function to check if tier should be highlighted as suggested
    const isSuggestedTier = (tier: PremiumTier): boolean => {
        return suggestedTier === tier
    }

    // Helper function to get tier display status
    const getTierStatus = (tier: PremiumTier): string => {
        if (!isUpgrade || !currentTier) return ''

        const currentRank = getTierRank(currentTier)
        const tierRank = getTierRank(tier)

        if (tierRank === currentRank) return 'current'
        if (tierRank < currentRank) return 'downgrade'
        if (tierRank === currentRank + 1) return 'upgrade'
        return 'higher-upgrade'
    }

    // Format expiry date
    const formatExpiryDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>{isUpgrade ? `Upgrade Your Premium` : 'Which premium tier would you like?'}</h4>
            <p className={styles.stepDescription}>
                {isUpgrade ? (
                    <>
                        You currently have{' '}
                        <strong>
                            {currentTier === PremiumTier.STARTER ? 'Starter Premium' : currentTier === PremiumTier.PREMIUM ? 'Premium' : 'Premium Plus'}
                        </strong>{' '}
                        active until <strong>{activePremiumProduct ? formatExpiryDate(activePremiumProduct.expires) : 'Unknown'}</strong>.
                        <br />
                        When you upgrade, your existing tier will be paused and you'll get the full benefits of the higher tier. Nothing will be lost - your
                        previous tier will resume when the upgrade expires.
                    </>
                ) : (
                    'Choose the tier that best fits your needs. Higher tiers include all features from lower tiers.'
                )}
            </p>

            {/* Upgrade Info Box */}
            {isUpgrade && (
                <div className={styles.infoBox}>
                    <div className={styles.checkIcon}>ℹ️</div>
                    <div>
                        <strong>Upgrade Protection:</strong> Your current{' '}
                        {currentTier === PremiumTier.STARTER ? 'Starter Premium' : currentTier === PremiumTier.PREMIUM ? 'Premium' : 'Premium Plus'}{' '}
                        subscription will be paused (not lost) while your upgrade is active. You'll automatically return to your previous tier when the upgrade
                        expires.
                    </div>
                </div>
            )}

            {/* Country Selection */}
            <div className={styles.countrySelection}>
                {defaultCountry ? (
                    <CountrySelect key="country-select" isLoading={!defaultCountry} defaultCountry={defaultCountry} onCountryChange={handleCountryChange} />
                ) : (
                    <CountrySelect key="loading-country-select" isLoading />
                )}
            </div>

            <div className={styles.optionsGrid}>
                {/* Starter Premium */}
                <Card
                    className={`${styles.optionCard} 
                        ${selectedTier === PremiumTier.STARTER ? styles.selected : ''} 
                        ${!canSelectTier(PremiumTier.STARTER) ? styles.disabled : ''}
                        ${getTierStatus(PremiumTier.STARTER) === 'current' ? styles.currentTier : ''}
                    `}
                    onClick={() => canSelectTier(PremiumTier.STARTER) && onTierSelect(PremiumTier.STARTER)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>⭐</div>
                        <h5 className={styles.tierTitle}>
                            Starter
                            {getTierStatus(PremiumTier.STARTER) === 'current' && <span className={styles.currentBadge}>Current</span>}
                        </h5>
                        <div className={styles.tierPrice}>starts at {starterPricing.displayText}</div>
                        <p className={styles.tierDescription}>Essential features for casual players</p>
                        {!canSelectTier(PremiumTier.STARTER) && (
                            <div className={styles.disabledOverlay}>
                                <small>Cannot downgrade</small>
                            </div>
                        )}
                        <ul className={styles.featureList}>
                            <li>Basic price alerts</li>
                            <li>Everything you need to start</li>
                            <li>Ad-free experience</li>
                        </ul>
                    </Card.Body>
                </Card>

                {/* Premium */}
                <Card
                    className={`${styles.optionCard} 
                        ${selectedTier === PremiumTier.PREMIUM ? styles.selected : ''} 
                        ${!canSelectTier(PremiumTier.PREMIUM) ? styles.disabled : ''}
                        ${getTierStatus(PremiumTier.PREMIUM) === 'current' ? styles.currentTier : ''}
                        ${isSuggestedTier(PremiumTier.PREMIUM) ? styles.suggested : ''}
                    `}
                    onClick={() => canSelectTier(PremiumTier.PREMIUM) && onTierSelect(PremiumTier.PREMIUM)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🌟</div>
                        <h5 className={`${styles.tierTitle} ${styles.tierPremium}`}>
                            Premium
                            {getTierStatus(PremiumTier.PREMIUM) === 'current' && <span className={styles.currentBadge}>Current</span>}
                            {isSuggestedTier(PremiumTier.PREMIUM) && <span className={styles.suggestedBadge}>Recommended Upgrade</span>}
                        </h5>
                        <div className={styles.tierPrice}>starts at {premiumPricing.displayText}</div>
                        <p className={styles.tierDescription}>
                            {isSuggestedTier(PremiumTier.PREMIUM)
                                ? 'Upgrade from Starter to unlock advanced features'
                                : 'All Starter features plus advanced tools'}
                        </p>
                        {!isSuggestedTier(PremiumTier.PREMIUM) && <small className={styles.recommendation}>Most Popular</small>}
                        {!canSelectTier(PremiumTier.PREMIUM) && (
                            <div className={styles.disabledOverlay}>
                                <small>Cannot downgrade</small>
                            </div>
                        )}
                        <ul className={styles.featureList}>
                            <li>Optimized bazaar flips</li>
                            <li>1 year auction house searches</li>
                            <li>Lowball helper</li>
                            {isSuggestedTier(PremiumTier.PREMIUM) && <li className={styles.newFeature}>🆕 Enhanced flip detection</li>}
                        </ul>
                    </Card.Body>
                </Card>

                {/* Premium Plus */}
                <Card
                    className={`${styles.optionCard} 
                        ${selectedTier === PremiumTier.PREMIUM_PLUS ? styles.selected : ''} 
                        ${!canSelectTier(PremiumTier.PREMIUM_PLUS) ? styles.disabled : ''}
                        ${getTierStatus(PremiumTier.PREMIUM_PLUS) === 'current' ? styles.currentTier : ''}
                        ${isSuggestedTier(PremiumTier.PREMIUM_PLUS) ? styles.suggested : ''}
                    `}
                    onClick={() => canSelectTier(PremiumTier.PREMIUM_PLUS) && onTierSelect(PremiumTier.PREMIUM_PLUS)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🚀</div>
                        <h5 className={`${styles.tierTitle} ${styles.tierPremiumPlus}`}>
                            Premium Plus
                            {getTierStatus(PremiumTier.PREMIUM_PLUS) === 'current' && <span className={styles.currentBadge}>Current</span>}
                            {isSuggestedTier(PremiumTier.PREMIUM_PLUS) && <span className={styles.suggestedBadge}>Recommended Upgrade</span>}
                        </h5>
                        <div className={styles.tierPrice}>
                            {discountInfo && discountInfo.percentage > 0 ? (
                                <>
                                    (yearly) starts at <br />
                                    <span style={{ textDecoration: 'line-through', marginRight: 8, opacity: 0.7 }}>{premiumPlusPricing.displayText}</span>
                                    <br />
                                    <span>{premiumPlusDiscounted.displayText}</span>
                                    <br />
                                    <small
                                        style={{ cursor: 'help' }}
                                        className="text-success"
                                        title={`Apply code ${discountInfo.code} at checkout to receive ${discountInfo.percentage}% off`}
                                    >
                                        -{discountInfo.percentage}% with code <strong>{discountInfo.code}</strong> *
                                    </small>
                                </>
                            ) : (
                                <>{premiumPlusPricing.displayText}</>
                            )}
                        </div>

                        <p className={styles.tierDescription}>
                            {isSuggestedTier(PremiumTier.PREMIUM_PLUS)
                                ? 'Upgrade to Premium Plus for the fastest experience'
                                : 'All Premium features plus exclusive access to'}
                        </p>
                        {!canSelectTier(PremiumTier.PREMIUM_PLUS) && (
                            <div className={styles.disabledOverlay}>
                                <small>Cannot downgrade</small>
                            </div>
                        )}
                        <ul className={styles.featureList}>
                            <li>Fastest auction flips</li>
                            <li>6 year data exports</li>
                            <li>Realtime market analysis</li>
                            <li>Access to advanced tools</li>
                            {isSuggestedTier(PremiumTier.PREMIUM_PLUS) && <li className={styles.newFeature}>Advanced money making methods (soon™️)</li>}
                        </ul>
                    </Card.Body>
                </Card>
            </div>

            <div className={styles.tierNote}>
                <strong>Note:</strong> Higher tiers include all features from lower tiers plus additional benefits.
                {isUpgrade && (
                    <>
                        <br />
                        <strong>Upgrade Protection:</strong> Your current subscription will be paused (not cancelled) while the upgrade is active.
                    </>
                )}
                <br />
                Prices include applicable VAT/sales tax for your country where available. For the US and some other countries, VAT will be added at checkout.
                <br />* Using discount codes NOMACRO or similar adds the condition that you won't use any automated software (macros) to interact with Hypixel
                otherwise you risk getting service revoked with no refund.
            </div>
        </div>
    )
}
