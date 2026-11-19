'use client'
import BuySubscription from '../../BuySubscription/BuySubscription'
import BuyPremium from '../../BuyPremium/BuyPremium'
import styles from './Steps.module.css'
import { CheckoutCodes, Duration, PurchaseType, PremiumTier } from '../types'

interface Props {
    selectedTier: PremiumTier
    selectedType: PurchaseType
    selectedDuration: Duration | null
    activePremiumProduct: PremiumProduct
    premiumSubscriptions: PremiumSubscription[]
    onNewActivePremiumProduct: () => void
    initialDiscountCode?: string | null
    /** the creator code of the checkout this one was upgraded from */
    initialCreatorCode?: string | null
    countryCode?: string
    onSelectTier?: (tier: PremiumTier, codes?: CheckoutCodes) => void
    /** switches the billing period from the checkout, e.g. to the yearly billing a code needs */
    onSelectDuration?: (duration: Duration) => void
}

export default function PurchaseCompletionStep({
    selectedTier,
    selectedType,
    selectedDuration,
    activePremiumProduct,
    premiumSubscriptions,
    onNewActivePremiumProduct,
    initialDiscountCode
    , initialCreatorCode
    , countryCode
    , onSelectTier
    , onSelectDuration
}: Props) {
    return (
        <div className={styles.stepContent}>
            {selectedType === PurchaseType.SUBSCRIPTION && (
                <BuySubscription
                    key={selectedTier}
                    selectedTier={selectedTier}
                    selectedDuration={selectedDuration}
                    initialDiscountCode={initialDiscountCode}
                    initialCreatorCode={initialCreatorCode}
                    countryCode={countryCode}
                    onUpgradeTier={onSelectTier}
                    onSelectDuration={onSelectDuration}
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
