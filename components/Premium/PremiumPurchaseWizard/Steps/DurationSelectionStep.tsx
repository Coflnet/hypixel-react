'use client'
import { Card } from 'react-bootstrap'
import { CheckCircle } from '@mui/icons-material'
import styles from './Steps.module.css'
import { Duration, PurchaseType, PremiumTier, getTierDisplayName, getDurationOptions } from '../types'
import { SUBSCRIPTION_PRICES } from '../../../../utils/pricingUtils'
import { VAT_RATES } from '../../../../utils/PricingUtils'

interface Props {
    selectedType: PurchaseType
    selectedTier: PremiumTier
    selectedDuration: Duration | null
    onDurationSelect: (duration: Duration) => void
    countryCode?: string
}

export default function DurationSelectionStep({ 
    selectedType, 
    selectedTier, 
    selectedDuration, 
    onDurationSelect,
    countryCode
}: Props) {
    const tierDisplayName = getTierDisplayName(selectedTier)
    const durationOptions = getDurationOptions(selectedTier, selectedType)

    // Get VAT rate for current country
    const getVATRate = (): number => {
        if (!countryCode) return 0
        const upperCode = countryCode.toUpperCase()
        return VAT_RATES[upperCode] ?? 0
    }

    // Check if VAT should be included in the price
    const shouldIncludeVATInPrice = (): boolean => {
        if (!countryCode) return false
        const upperCode = countryCode.toUpperCase()
        return upperCode !== 'US' && VAT_RATES[upperCode] !== undefined
    }

    // Calculate price with VAT
    const getPriceWithVAT = (basePrice: number): number => {
        const vatRate = getVATRate()
        return basePrice * (1 + vatRate)
    }

    // Get monthly equivalent price for a duration
    const getMonthlyPrice = (duration: Duration): number => {
        const tierKey = selectedTier === PremiumTier.PREMIUM ? 'premium' : 'premium_plus'
        const prices = SUBSCRIPTION_PRICES[tierKey] || { monthly: 0, quarterly: 0, yearly: 0 }

        let monthlyPrice = prices.monthly
        if (duration === Duration.QUARTER) {
            monthlyPrice = prices.quarterly / 3 // 3 months
        } else if (duration === Duration.YEARLY) {
            monthlyPrice = prices.yearly / 12 // 12 months
        }

        return getPriceWithVAT(monthlyPrice)
    }

        // Round up to next full cent
        const roundUpToCent = (value: number): number => {
            return Math.ceil(value * 100) / 100
        }

    if (selectedType === PurchaseType.COFLCOINS) {
        return (
            <div className={styles.stepContent}>
                <h4 className={styles.stepQuestion}>
                    How long would you like your{' '}
                    <span
                        className={`${selectedTier === PremiumTier.PREMIUM ? styles.tierPremium : ''} ${
                            selectedTier === PremiumTier.PREMIUM_PLUS ? styles.tierPremiumPlus : ''
                        }`}
                    >
                        {tierDisplayName}
                    </span>
                    ?
                </h4>
                <p className={styles.coflcoinsDescription}>
                    Choose your preferred duration for{' '}
                    <span
                        className={`${selectedTier === PremiumTier.PREMIUM ? styles.tierPremium : ''} ${
                            selectedTier === PremiumTier.PREMIUM_PLUS ? styles.tierPremiumPlus : ''
                        }`}
                    >
                        {tierDisplayName}
                    </span>
                    . Different durations may have different per-week pricing.
                </p>

                <div className={styles.optionsGrid}>
                    {durationOptions.map(opt => (
                        <Card
                            key={opt.label}
                            className={`${styles.optionCard} ${selectedDuration === opt.value ? styles.selected : ''}`}
                            onClick={() => onDurationSelect(opt.value)}
                        >
                            <Card.Body className={styles.optionBody}>
                                <div className={styles.optionIcon}>{opt.icon}</div>
                                <h5 className={styles.durationTitle}>{opt.label}</h5>
                                <p className={styles.durationDescription}>{opt.desc}</p>
                                {opt.badge ? (
                                    <small className={styles.recommendation}>{opt.badge}</small>
                                ) : opt.value === Duration.YEARLY ? (
                                    <small className={styles.recommendation}>Best Value</small>
                                ) : null}
                                <div className={styles.monthlyPrice}>
                                    <small>~€{roundUpToCent(getMonthlyPrice(opt.value)).toFixed(2)}/month</small>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>How long would you like your subscription?</h4>
            <p className={styles.stepDescription}>
                Choose your billing cycle. You can cancel anytime and will retain access until the end of your billing period.
            </p>

            <div className={styles.optionsGrid}>
                {durationOptions.map(opt => (
                    <Card
                        key={opt.label}
                        className={`${styles.optionCard} ${selectedDuration === opt.value ? styles.selected : ''}`}
                        onClick={() => onDurationSelect(opt.value)}
                    >
                        <Card.Body className={styles.optionBody}>
                            <div className={styles.optionIcon}>{opt.icon}</div>
                            <h5 className={styles.durationTitle}>{opt.label}</h5>
                            <p className={styles.durationDescription}>{opt.desc}</p>
                            {opt.badge ? (
                                <small className={styles.recommendation}>{opt.badge}</small>
                            ) : opt.value === Duration.YEARLY ? (
                                <small className={styles.recommendation}>Best Value</small>
                            ) : null}
                            <div className={styles.monthlyPrice}>
                                <small>~€{roundUpToCent(getMonthlyPrice(opt.value)).toFixed(2)}/month</small>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    )
}
