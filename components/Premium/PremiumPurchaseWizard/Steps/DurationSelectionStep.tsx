'use client'
import { Card } from 'react-bootstrap'
import { CheckCircle } from '@mui/icons-material'
import styles from './Steps.module.css'
import { Duration, PurchaseType, PremiumTier, getTierDisplayName, getDurationOptions } from '../types'

interface Props {
    selectedType: PurchaseType
    selectedTier: PremiumTier
    selectedDuration: Duration | null
    onDurationSelect: (duration: Duration) => void
}

export default function DurationSelectionStep({ selectedType, selectedTier, selectedDuration, onDurationSelect }: Props) {
    const tierDisplayName = getTierDisplayName(selectedTier)
    const durationOptions = getDurationOptions(selectedTier, selectedType)

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
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    )
}
