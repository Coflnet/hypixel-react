import { ReactNode } from 'react'
import { Card } from 'react-bootstrap'
import styles from './Steps.module.css'
import { PremiumTier } from '../types'

export interface TierConfig {
    tier: PremiumTier
    icon: string
    title: string
    titleClass?: string
    features: string[]
    description: string
    upgradeDescription?: string
}

export type TierStatus = 'current' | 'downgrade' | 'upgrade' | 'higher-upgrade' | ''

interface TierCardProps {
    config: TierConfig
    pricing: ReactNode
    status: TierStatus
    isSuggested: boolean
    canSelect: boolean
    onSelect: (tier: PremiumTier) => void
    extraBadge?: string
    suggestedFeature?: string
}

export default function TierCard({ config, pricing, status, isSuggested, canSelect, onSelect, extraBadge, suggestedFeature }: TierCardProps) {
    const { tier, icon, title, titleClass, features, description, upgradeDescription } = config

    const cardClassName = [
        styles.optionCard,
        !canSelect && styles.disabled,
        status === 'current' && styles.currentTier,
        isSuggested && styles.suggested
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <Card className={cardClassName} onClick={() => canSelect && onSelect(tier)}>
            <Card.Body className={styles.optionBody}>
                <div className={styles.optionIcon}>{icon}</div>
                <h5 className={[styles.tierTitle, titleClass && styles[titleClass]].filter(Boolean).join(' ')}>
                    {title}
                    {status === 'current' && <span className={styles.currentBadge}>Current</span>}
                    {isSuggested && <span className={styles.suggestedBadge}>Recommended Upgrade</span>}
                </h5>
                <div className={styles.tierPrice}>{pricing}</div>
                <p className={styles.tierDescription}>{isSuggested && upgradeDescription ? upgradeDescription : description}</p>
                {extraBadge && !isSuggested && <small className={styles.recommendation}>{extraBadge}</small>}
                {!canSelect && (
                    <div className={styles.disabledOverlay}>
                        <small>Cannot downgrade</small>
                    </div>
                )}
                <ul className={styles.featureList}>
                    {features.map(feature => (
                        <li key={feature}>{feature}</li>
                    ))}
                    {suggestedFeature && isSuggested && <li className={styles.newFeature}>{suggestedFeature}</li>}
                </ul>
            </Card.Body>
        </Card>
    )
}
