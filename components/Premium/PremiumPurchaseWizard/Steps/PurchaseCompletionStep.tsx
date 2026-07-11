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
    initialDiscountCode?: string | null
    countryCode?: string
    onSelectTier?: (tier: PremiumTier) => void
}

export default function PurchaseCompletionStep({
    selectedTier,
    selectedType,
    selectedDuration,
    activePremiumProduct,
    premiumSubscriptions,
    onNewActivePremiumProduct,
    initialDiscountCode
    , countryCode
    , onSelectTier
}: Props) {
    return (
        <div className={styles.stepContent}>
            {selectedType === PurchaseType.SUBSCRIPTION && (
                <BuySubscription
                    key={selectedTier}
                    activePremiumProduct={activePremiumProduct}
                    selectedTier={selectedTier}
                    selectedDuration={selectedDuration}
                    initialDiscountCode={initialDiscountCode}
                    countryCode={countryCode}
                    onUpgradeTier={onSelectTier}
                />
            )}
            {selectedType === PurchaseType.COFLCOINS && (
                <BuyPremium
                    activePremiumProduct={activePremiumProduct}
                    premiumSubscriptions={premiumSubscriptions}
                    onNewActivePremiumProduct={onNewActivePremiumProduct}
                    selectedTier={selectedTier}
                    selectedDuration={selectedDuration}
                    initialDiscountCode={initialDiscountCode}
                    onUpgradeTier={onSelectTier}
                />
            )}
        </div>
    )
}
