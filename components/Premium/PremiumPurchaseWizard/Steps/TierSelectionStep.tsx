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
}
interface ActiveDiscount {
    description: string
    percentage: number
    code: string
}

export default function TierSelectionStep({ selectedTier, onTierSelect }: Props) {
    const [selectedCountry, setSelectedCountry] = useState<Country>()
    const [defaultCountry, setDefaultCountry] = useState<Country>()

    useEffect(() => {
        loadDefaultCountry()
    }, [])

    async function loadDefaultCountry() {
        let cachedCountryCode = localStorage.getItem(USER_COUNTRY_CODE)
        if (cachedCountryCode) {
            const country = getCountry(cachedCountryCode)
            setDefaultCountry(country)
            setSelectedCountry(country)
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
            localStorage.setItem(USER_COUNTRY_CODE, result.country)
        } else {
            let country = getCountryFromUserLanguage()
            setDefaultCountry(country)
            setSelectedCountry(country)
        }
    }

    // Calculate prices for each tier based on selected country
    const starterPricing = calculatePrice(PremiumTier.STARTER, selectedCountry?.value)
    const premiumPricing = calculatePrice(PremiumTier.PREMIUM, selectedCountry?.value)
    const premiumPlusPricing = calculatePrice(PremiumTier.PREMIUM_PLUS, selectedCountry?.value)
    const discountInfo : ActiveDiscount = {
        description: "Summer End Discount",
        percentage: 40,
        code: "NOMACRO"
    } 
    const premiumPlusDiscounted = calculatePrice(PremiumTier.PREMIUM_PLUS, selectedCountry?.value, discountInfo.percentage) // 10% discount

    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>Which premium tier would you like?</h4>
            <p className={styles.stepDescription}>
                Choose the tier that best fits your needs. Higher tiers include all features from lower tiers.
            </p>
            
            {/* Country Selection */}
            <div className={styles.countrySelection}>
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
            
            <div className={styles.optionsGrid}>
                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.STARTER ? styles.selected : ''}`}
                    onClick={() => onTierSelect(PremiumTier.STARTER)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>⭐</div>
                        <h5 className={styles.tierTitle}>Starter Premium</h5>
                        <div className={styles.tierPrice}>starts at {starterPricing.displayText}</div>
                        <p className={styles.tierDescription}>Essential features for casual players</p>
                        <ul className={styles.featureList}>
                            <li>Basic price alerts</li>
                            <li>Everything you need to start</li>
                            <li>Ad-free experience</li>
                        </ul>
                    </Card.Body>
                </Card>

                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.PREMIUM ? styles.selected : ''}`}
                    onClick={() => onTierSelect(PremiumTier.PREMIUM)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🌟</div>
                        <h5 className={`${styles.tierTitle} ${styles.tierPremium}`}>Premium</h5>
                        <div className={styles.tierPrice}>starts at {premiumPricing.displayText}</div>
                        <p className={styles.tierDescription}>All Starter features plus advanced tools</p>
                        <small className={styles.recommendation}>Most Popular</small>
                        <ul className={styles.featureList}>
                            <li>Optimized bazaar flips</li>
                            <li>1 year auction house searches</li>
                            <li>Lowball helper</li>
                        </ul>
                    </Card.Body>
                </Card>

                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.PREMIUM_PLUS ? styles.selected : ''}`}
                    onClick={() => onTierSelect(PremiumTier.PREMIUM_PLUS)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>🚀</div>
                        <h5 className={`${styles.tierTitle} ${styles.tierPremiumPlus}`}>Premium Plus</h5>
                        <div className={styles.tierPrice}>
                            {discountInfo && discountInfo.percentage > 0 ? (
                                <>
                                    (yearly) starts at <br/>
                                    <span style={{ textDecoration: 'line-through', marginRight: 8, opacity: 0.7 }}>
                                        {premiumPlusPricing.displayText}
                                    </span><br/>
                                    <span>{premiumPlusDiscounted.displayText}</span>
                                    <br />
                                    <small
                                        style={{ cursor: 'help' }} className="text-success"
                                        title={`Apply code ${discountInfo.code} at checkout to receive ${discountInfo.percentage}% off`}
                                    >
                                        -{discountInfo.percentage}% with code <strong>{discountInfo.code}</strong>
                                    </small>
                                </>
                            ) : (
                                <>{premiumPlusPricing.displayText}</>
                            )}
                        </div>
                       
                        <p className={styles.tierDescription}>All Premium features plus exclusive access to</p>
                        <ul className={styles.featureList}>
                            <li>Fastest auction flips</li>
                            <li>6 year data exports</li>
                            <li>Realtime market analysis</li>
                            <li>Access to advanced tools</li>
                            <li>Advanced money making methods (soon™️)</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>
            
            <div className={styles.tierNote}>
                <strong>Note:</strong> Higher tiers include all features from lower tiers plus additional benefits.<br/>
                Prices include applicable VAT/sales tax for your country where available. For the US and some other countries, VAT will be added at checkout.
            </div>
        </div>
    )
}
