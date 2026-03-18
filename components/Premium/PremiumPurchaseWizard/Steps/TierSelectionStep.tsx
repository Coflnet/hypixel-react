import styles from './Steps.module.css'
import { PremiumTier, getTierDisplayName } from '../types'
import { calculatePrice } from '../../../../utils/PricingUtils'
import CountrySelect from '../../../CountrySelect/CountrySelect'
import TierCard, { TierConfig, TierStatus } from './TierCard'
import { Country } from '../../../../utils/CountryUtils'

interface ActiveDiscount {
    description: string
    percentage: number
    code: string
}

const TIER_CONFIGS: TierConfig[] = [
    {
        tier: PremiumTier.STARTER,
        icon: '⭐',
        title: 'Starter',
        features: ['Basic price alerts', 'Everything you need to start', 'Ad-free experience'],
        description: 'Essential features for casual players'
    },
    {
        tier: PremiumTier.PREMIUM,
        icon: '🌟',
        title: 'Premium',
        titleClass: 'tierPremium',
        features: ['Optimized bazaar flips', '1 year auction house searches', 'Lowball helper'],
        description: 'All Starter features plus advanced tools',
        upgradeDescription: 'Upgrade from Starter to unlock advanced features'
    },
    {
        tier: PremiumTier.PREMIUM_PLUS,
        icon: '🚀',
        title: 'Premium Plus',
        titleClass: 'tierPremiumPlus',
        features: ['Fastest auction flips', '6 year data exports', 'Realtime market analysis', 'Access to BazaarPro'],
        description: 'All Premium features plus exclusive access to',
        upgradeDescription: 'Upgrade to Premium Plus for the fastest experience'
    }
]

const TIER_RANKS: Record<PremiumTier, number> = {
    [PremiumTier.STARTER]: 1,
    [PremiumTier.PREMIUM]: 2,
    [PremiumTier.PREMIUM_PLUS]: 3
}

function getTierRank(tier: PremiumTier): number {
    return TIER_RANKS[tier] ?? 0
}

function canSelectTier(tier: PremiumTier, currentTier?: PremiumTier | null, isUpgrade?: boolean): boolean {
    if (!isUpgrade || !currentTier) return true
    return getTierRank(tier) > getTierRank(currentTier)
}

function getTierStatus(tier: PremiumTier, currentTier?: PremiumTier | null, isUpgrade?: boolean): TierStatus {
    if (!isUpgrade || !currentTier) return ''
    const currentRank = getTierRank(currentTier)
    const tierRank = getTierRank(tier)

    if (tierRank === currentRank) return 'current'
    if (tierRank < currentRank) return 'downgrade'
    if (tierRank === currentRank + 1) return 'upgrade'
    return 'higher-upgrade'
}

interface Props {
    onTierSelect(tier: PremiumTier): void
    currentTier?: PremiumTier | null
    isUpgrade?: boolean
    suggestedTier?: PremiumTier | null
    activePremiumProduct?: PremiumProduct
    selectedCountry?: Country
    onCountryChange: (country: Country) => void
}

const DISCOUNT: ActiveDiscount = {
    description: 'Summer End Discount',
    percentage: 0,
    code: 'NOMACRO'
}

const SUGGESTED_FEATURES: Partial<Record<PremiumTier, string>> = {
    [PremiumTier.PREMIUM]: '🆕 Enhanced flip detection',
    [PremiumTier.PREMIUM_PLUS]: 'Advanced money making methods (soon™️)'
}

const EXTRA_BADGES: Partial<Record<PremiumTier, string>> = {
    [PremiumTier.PREMIUM]: 'Most Popular'
}

function formatExpiryDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function DiscountedPrice({ tier, countryCode, discount }: { tier: PremiumTier; countryCode?: string; discount: ActiveDiscount }) {
    const basePrice = calculatePrice(tier, countryCode)
    const discountedPrice = calculatePrice(tier, countryCode, discount.percentage)

    if (discount.percentage <= 0) {
        return <>{basePrice.displayText}</>
    }

    return (
        <>
            (yearly) starts at <br />
            <span style={{ textDecoration: 'line-through', marginRight: 8, opacity: 0.7 }}>{basePrice.displayText}</span>
            <br />
            <span>{discountedPrice.displayText}</span>
            <br />
            <small style={{ cursor: 'help' }} className="text-success" title={`Apply code ${discount.code} at checkout to receive ${discount.percentage}% off`}>
                -{discount.percentage}% with code <strong>{discount.code}</strong> *
            </small>
        </>
    )
}

export default function TierSelectionStep({ onTierSelect, currentTier, isUpgrade, suggestedTier, activePremiumProduct, selectedCountry, onCountryChange }: Props) {

    const tierDisplayName = currentTier ? getTierDisplayName(currentTier) : ''

    return (
        <div className={styles.stepContent}>
            <h4 className={styles.stepQuestion}>{isUpgrade ? 'Upgrade Your Premium' : 'Which premium tier would you like?'}</h4>
            <p className={styles.stepDescription}>
                {isUpgrade ? (
                    <>
                        You currently have <strong>{tierDisplayName}</strong> active until{' '}
                        <strong>{activePremiumProduct ? formatExpiryDate(activePremiumProduct.expires) : 'Unknown'}</strong>.
                        <br />
                        When you upgrade, your existing tier will be paused and you'll get the full benefits of the higher tier. Nothing will be lost - your
                        previous tier will resume when the upgrade expires.
                    </>
                ) : (
                    'Choose the tier that best fits your needs. Higher tiers include all features from lower tiers.'
                )}
            </p>

            {isUpgrade && (
                <div className={styles.infoBox}>
                    <div className={styles.checkIcon}>ℹ️</div>
                    <div>
                        <strong>Upgrade Protection:</strong> Your current {tierDisplayName} subscription will be paused (not lost) while your upgrade is active.
                        You'll automatically return to your previous tier when the upgrade expires.
                    </div>
                </div>
            )}

            <div className={styles.countrySelection}>
                <CountrySelect onCountryChange={onCountryChange} />
            </div>

            <div className={styles.optionsGrid}>
                {TIER_CONFIGS.map(config => {
                    const tier = config.tier
                    const isSuggested = suggestedTier === tier
                    const pricing =
                        tier === PremiumTier.PREMIUM_PLUS ? (
                            <DiscountedPrice tier={tier} countryCode={selectedCountry?.value} discount={DISCOUNT} />
                        ) : (
                            <>starts at {calculatePrice(tier, selectedCountry?.value).displayText}</>
                        )

                    return (
                        <TierCard
                            key={tier}
                            config={config}
                            pricing={pricing}
                            status={getTierStatus(tier, currentTier, isUpgrade)}
                            isSuggested={isSuggested}
                            canSelect={canSelectTier(tier, currentTier, isUpgrade)}
                            onSelect={onTierSelect}
                            extraBadge={EXTRA_BADGES[tier]}
                            suggestedFeature={SUGGESTED_FEATURES[tier]}
                        />
                    )
                })}
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
