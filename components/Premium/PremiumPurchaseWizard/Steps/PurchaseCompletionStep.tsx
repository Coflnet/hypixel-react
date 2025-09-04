'use client'
import BuySubscription from '../../BuySubscription/BuySubscription'
import BuyPremium from '../../BuyPremium/BuyPremium'
import styles from './Steps.module.css'
import { Duration, PurchaseType, PremiumTier, getTierDisplayName, getDurationDisplayName } from '../types'

interface Props {
    selectedTier: PremiumTier
    selectedType: PurchaseType
    selectedDuration: Duration | null
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
}

export default function PurchaseCompletionStep({ 
    selectedTier,
    selectedType,
    selectedDuration,
    activePremiumProduct,
    premiumSubscriptions,
    onNewActivePremiumProduct
}: Props) {
    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>Complete your purchase</h4>
            
            <div className={styles.summaryBox}>
                <h6 className={styles.summaryTitle}>Your Selection:</h6>
                <div className={styles.summaryDetails}>
                    <p><strong>Tier:</strong> <span className={`${styles.summaryValue} ${selectedTier === PremiumTier.PREMIUM ? styles.tierPremium : ''} ${selectedTier === PremiumTier.PREMIUM_PLUS ? styles.tierPremiumPlus : ''}`}>{getTierDisplayName(selectedTier)}</span></p>
                    <p><strong>Payment Method:</strong> <span className={styles.summaryValue}>{selectedType === PurchaseType.SUBSCRIPTION ? 'Subscription' : 'CoflCoins'}</span></p>
                    {selectedDuration && (
                        <p><strong>Billing:</strong> <span className={styles.summaryValue}>{getDurationDisplayName(selectedDuration)}</span></p>
                    )}
                </div>
            </div>
            
            <div className={styles.purchaseComponent}>
                {selectedType === PurchaseType.SUBSCRIPTION && (
                    <BuySubscription 
                        activePremiumProduct={activePremiumProduct} 
                        selectedTier={selectedTier}
                        selectedDuration={selectedDuration}
                    />
                )}
                {selectedType === PurchaseType.COFLCOINS && (
                    <BuyPremium 
                        activePremiumProduct={activePremiumProduct}
                        premiumSubscriptions={premiumSubscriptions}
                        onNewActivePremiumProduct={onNewActivePremiumProduct}
                        selectedTier={selectedTier}
                        selectedDuration={selectedDuration}
                    />
                )}
            </div>
        </div>
    )
}
