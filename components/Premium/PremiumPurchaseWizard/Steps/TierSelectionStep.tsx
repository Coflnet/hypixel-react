'use client'
import { Card } from 'react-bootstrap'
import styles from './Steps.module.css'
import { PremiumTier } from '../types'

interface Props {
    selectedTier: PremiumTier | null
    onTierSelect: (tier: PremiumTier) => void
}

export default function TierSelectionStep({ selectedTier, onTierSelect }: Props) {
    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>Which premium tier would you like?</h4>
            <p className={styles.stepDescription}>
                Choose the tier that best fits your needs. Higher tiers include all features from lower tiers.
            </p>
            
            <div className={styles.optionsGrid}>
                <Card 
                    className={`${styles.optionCard} ${selectedTier === PremiumTier.STARTER ? styles.selected : ''}`}
                    onClick={() => onTierSelect(PremiumTier.STARTER)}
                >
                    <Card.Body className={styles.optionBody}>
                        <div className={styles.optionIcon}>⭐</div>
                        <h5 className={styles.tierTitle}>Starter Premium</h5>
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
                        <p className={styles.tierDescription}>All Premium features plus exclusive access</p>
                        <ul className={styles.featureList}>
                            <li>Fastest auction flips</li>
                            <li>Data export & API access</li>
                            <li>Advanced market analysis</li>
                            <li>Advanced money making methods (soon™️)</li>
                        </ul>
                    </Card.Body>
                </Card>
            </div>
            
            <div className={styles.tierNote}>
                <strong>Note:</strong> Higher tiers include all features from lower tiers plus additional benefits.
            </div>
        </div>
    )
}
