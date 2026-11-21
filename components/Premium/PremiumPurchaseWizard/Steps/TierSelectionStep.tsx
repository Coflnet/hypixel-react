import styles from './Steps.module.css'
import { PremiumTier, getTierDisplayName } from '../types'
import CountrySelect from '../../../CountrySelect/CountrySelect'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { canSelectTier } from '../wizardFlow'
import { Country } from '../../../../utils/CountryUtils'
import { NotePart, PlanBilling, PlanPrice, getPlanBilling, getPlanPrice, getPlanTaxNote } from '../../../PremiumLanding/content/planPricing'
import { PlanNote } from '../../../PremiumLanding/Plans/PlanNote'
import { useCheckoutOffer } from '../../../../hooks/useCheckoutOffer'
import { getTierHighlights, getTierIntro } from '../../../PremiumLanding/content/tierHighlights'
import { describePromotion } from '../../../../utils/SubscriptionCheckout'
import type { AutoDiscount } from '../../../../api/_generated/skyApi.schemas'

interface TierConfig {
    tier: PremiumTier
    title: string
    titleClass?: string
    description: string
    upgradeDescription?: string
}

const TIER_CONFIGS: TierConfig[] = [
    {
        tier: PremiumTier.STARTER,
        title: 'Starter',
        description: 'Essential features for casual players'
    },
    {
        tier: PremiumTier.PREMIUM,
        title: 'Premium',
        titleClass: styles.tierPremium,
        description: 'All Starter features plus advanced tools',
        upgradeDescription: 'Upgrade from Starter to unlock advanced features'
    },
    {
        tier: PremiumTier.PREMIUM_PLUS,
        title: 'Premium Plus',
        titleClass: styles.tierPremiumPlus,
        description: 'All Premium features plus exclusive access to',
        upgradeDescription: 'Upgrade to Premium Plus for the fastest experience'
    }
]

const SUGGESTED_FEATURES: Partial<Record<PremiumTier, string>> = {
    [PremiumTier.PREMIUM]: 'New: enhanced flip detection',
    [PremiumTier.PREMIUM_PLUS]: 'Advanced money making methods (soon™️)'
}

const EXTRA_BADGES: Partial<Record<PremiumTier, string>> = {
    [PremiumTier.PREMIUM]: 'Most popular'
}

function isCurrentTier(tier: PremiumTier, currentTier?: PremiumTier | null, isUpgrade?: boolean): boolean {
    return !!isUpgrade && tier === currentTier
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

interface Props {
    onTierSelect(tier: PremiumTier, advance: boolean): void
    selectedTier: PremiumTier | null
    forFriends?: boolean
    currentTier?: PremiumTier | null
    isUpgrade?: boolean
    suggestedTier?: PremiumTier | null
    activePremiumProduct?: PremiumProduct
    selectedCountry?: Country
    onCountryChange: (country: Country) => void
}

/** the unit under a tier's price; a sale price (its percent is the option's badge) says that no code is needed */
function getPriceUnit(price: PlanPrice) {
    if (!price.badge) return price.unit
    return (
        <>
            {price.unit}
            <br />
            <span className={styles.saving}>Sale price, applied automatically</span>
        </>
    )
}

function TierFeatures({ features, extra }: { features: string[]; extra?: string }) {
    return (
        <span className={styles.features}>
            {features.map(feature => (
                <span key={feature} className={styles.feature}>
                    {feature}
                </span>
            ))}
            {extra ? <span className={`${styles.feature} ${styles.newFeature}`}>{extra}</span> : null}
        </span>
    )
}

function TierDescription({ text, note }: { text: string; note: NotePart[] | null }) {
    if (!note) return <>{text}</>
    return (
        <>
            {text}
            <br />
            <span className={styles.priceNote}>
                <PlanNote note={note} />
            </span>
        </>
    )
}

function getTierBadge(tier: PremiumTier, isCurrent: boolean, isSuggested: boolean): string | undefined {
    if (isCurrent) return 'Current'
    if (isSuggested) return 'Recommended upgrade'
    return EXTRA_BADGES[tier]
}

function UpgradeIntro({ currentTier, activePremiumProduct }: { currentTier: PremiumTier; activePremiumProduct?: PremiumProduct }) {
    return (
        <div className={styles.inset}>
            <p>
                You currently have <strong>{getTierDisplayName(currentTier)}</strong> active until{' '}
                <strong>{activePremiumProduct ? formatExpiryDate(activePremiumProduct.expires) : 'Unknown'}</strong>.
            </p>
            <p>
                <strong>Upgrade protection:</strong> while the upgrade is active your {getTierDisplayName(currentTier)} is paused, not lost, and it resumes
                when the upgrade expires.
            </p>
        </div>
    )
}

function TierNote({ forFriends, countryCode, billing, promotion }: { forFriends?: boolean; countryCode?: string; billing: PlanBilling; promotion: AutoDiscount | null }) {
    if (forFriends) return null
    return (
        <p className={styles.note}>
            {getPlanTaxNote(countryCode, billing)}
            {promotion && (
                <>
                    <br />
                    <span data-testid="tier-promotion-note">{describePromotion(promotion)} Applied automatically at checkout.</span>
                </>
            )}
        </p>
    )
}

export default function TierSelectionStep({
    onTierSelect,
    selectedTier,
    forFriends,
    currentTier,
    isUpgrade,
    suggestedTier,
    activePremiumProduct,
    selectedCountry,
    onCountryChange
}: Props) {
    const countryCode = selectedCountry?.value
    const offer = useCheckoutOffer(forFriends ? undefined : countryCode)
    const billing = getPlanBilling(offer, countryCode)

    function toOption(config: TierConfig): WizardOption<PremiumTier> {
        const tier = config.tier
        const isSuggested = suggestedTier === tier
        const canSelect = canSelectTier(tier, currentTier, isUpgrade)
        // the plan card's price: a price that is charged (Premium and Premium Plus every 4 weeks, Starter for 52 weeks), with the promotion
        const price = getPlanPrice(tier, countryCode, billing, offer.promotion)
        return {
            value: tier,
            title: config.title,
            titleClassName: config.titleClass,
            badge: getTierBadge(tier, isCurrentTier(tier, currentTier, isUpgrade), isSuggested),
            description: canSelect ? (
                <TierDescription text={(isSuggested && config.upgradeDescription) || getTierIntro(tier) || config.description} note={forFriends ? null : price.note} />
            ) : (
                'Cannot downgrade'
            ),
            price: forFriends ? undefined : price.amount,
            originalPrice: forFriends ? undefined : (price.original ?? undefined),
            discountBadge: forFriends ? undefined : (price.badge ?? undefined),
            unit: forFriends ? undefined : getPriceUnit(price),
            footer: <TierFeatures features={getTierHighlights(tier)} extra={isSuggested ? SUGGESTED_FEATURES[tier] : undefined} />,
            disabled: !canSelect
        }
    }

    const options = TIER_CONFIGS.filter(config => !forFriends || config.tier !== PremiumTier.STARTER).map(toOption)
    // a downgrade request can leave a tier the visitor cannot buy in the state; it is never shown as chosen
    const selected = selectedTier && canSelectTier(selectedTier, currentTier, isUpgrade) ? selectedTier : null

    return (
        <div className={styles.stepContent}>
            {isUpgrade && currentTier ? <UpgradeIntro currentTier={currentTier} activePremiumProduct={activePremiumProduct} /> : null}
            {!forFriends && (
                <div className={styles.countrySelection}>
                    <CountrySelect onCountryChange={onCountryChange} />
                </div>
            )}
            <OptionGroup legend="Premium tier" options={options} selected={selected} onChoose={onTierSelect} />
            <TierNote forFriends={forFriends} countryCode={countryCode} billing={billing} promotion={billing.settled ? offer.promotion : null} />
        </div>
    )
}
