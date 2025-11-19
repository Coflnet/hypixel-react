'use client'
import BuySubscription from '../../BuySubscription/BuySubscription'
import BuyPremium from '../../BuyPremium/BuyPremium'
import styles from './Steps.module.css'
import { Duration, PurchaseType, PremiumTier } from '../types'

interface Props {
    selectedTier: PremiumTier
    selectedType: PurchaseType
    selectedDuration: Duration | null
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
    creatorCode?: string
}

export default function PurchaseCompletionStep({
    selectedTier,
    selectedType,
    selectedDuration,
    activePremiumProduct,
    premiumSubscriptions,
    onNewActivePremiumProduct,
    creatorCode
}: Props) {
    return (
        <div className={styles.stepContent}>
            {selectedType === PurchaseType.SUBSCRIPTION && (
                <BuySubscription
                    activePremiumProduct={activePremiumProduct}
                    selectedTier={selectedTier}
                    selectedDuration={selectedDuration}
                    creatorCode={creatorCode}
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
    )
}
