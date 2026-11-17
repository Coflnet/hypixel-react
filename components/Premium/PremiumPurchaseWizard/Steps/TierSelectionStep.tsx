import styles from './Steps.module.css'
import { PremiumTier, getTierDisplayName } from '../types'
import { calculatePrice } from '../../../../utils/PricingUtils'
import CountrySelect from '../../../CountrySelect/CountrySelect'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { canSelectTier } from '../wizardFlow'
import { Country } from '../../../../utils/CountryUtils'
import { Discount, formatDiscountEndDate, getActiveSubscriptionDiscount } from '../../../../utils/DiscountUtils'
import { getPlanPrice } from '../../../PremiumLanding/content/planPricing'

interface TierConfig {
    tier: PremiumTier
    title: string
    titleClass?: string
    features: string[]
    description: string
    upgradeDescription?: string
}

const TIER_CONFIGS: TierConfig[] = [
    {
        tier: PremiumTier.STARTER,
        title: 'Starter',
        features: ['Basic price alerts', 'Everything you need to start', 'Ad-free experience'],
        description: 'Essential features for casual players'
    },
    {
        tier: PremiumTier.PREMIUM,
        title: 'Premium',
        titleClass: styles.tierPremium,
        features: ['Optimized bazaar flips', '1 year auction house searches', 'Lowball helper'],
        description: 'All Starter features plus advanced tools',
        upgradeDescription: 'Upgrade from Starter to unlock advanced features'
    },
    {
        tier: PremiumTier.PREMIUM_PLUS,
        title: 'Premium Plus',
        titleClass: styles.tierPremiumPlus,
        features: ['Fastest auction flips', '6 year data exports', 'Realtime market analysis', 'Access to BazaarPro'],
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

function TierPrice({ tier, countryCode, discount }: { tier: PremiumTier; countryCode?: string; discount: Discount | null }) {
    const base = getPlanPrice(tier, countryCode)
    if (!discount || discount.percentage <= 0) return <>{base.amount}</>
    const discounted = calculatePrice(tier, countryCode, discount.percentage)
    return (
        <>
            <s className={styles.struck}>{base.amount}</s> €{discounted.totalPrice.toFixed(2)}
        </>
    )
}

function getPriceUnit(tier: PremiumTier, countryCode: string | undefined, discount: Discount | null) {
    const base = getPlanPrice(tier, countryCode)
    const period = `${base.plusVat ? '+ VAT ' : ''}${base.period}`
    if (!discount || discount.percentage <= 0) return period
    return (
        <>
            {period}
            <br />
            <span className={styles.saving} title={`Apply code ${discount.code} at checkout to receive ${discount.percentage}% off`}>
                -{discount.percentage}% with code <strong>{discount.code}</strong>
            </span>
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

function TierDescription({ text, note }: { text: string; note: string | null }) {
    if (!note) return <>{text}</>
    return (
        <>
            {text}
            <br />
            <span className={styles.priceNote}>{note}</span>
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

function TierNote({ forFriends }: { forFriends?: boolean }) {
    const discount = getActiveSubscriptionDiscount()
    if (forFriends) return null
    return (
        <p className={styles.note}>
            Prices include applicable VAT/sales tax for your country where available. For the US and some other countries, VAT will be added at checkout.
            {discount && (
                <>
                    <br />
                    <strong>{discount.label}:</strong> Apply code <code>{discount.code}</code> at checkout for {discount.percentage}% off any subscription
                    until {formatDiscountEndDate(discount.endsAt)}.
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
    const discount = getActiveSubscriptionDiscount()
    const countryCode = selectedCountry?.value

    function toOption(config: TierConfig): WizardOption<PremiumTier> {
        const tier = config.tier
        const isSuggested = suggestedTier === tier
        const canSelect = canSelectTier(tier, currentTier, isUpgrade)
        // the amount is the lowest monthly equivalent (Premium Plus: billed yearly), as on the plan cards
        const priceNote = forFriends ? null : getPlanPrice(tier, countryCode).note
        return {
            value: tier,
            title: config.title,
            titleClassName: config.titleClass,
            badge: getTierBadge(tier, isCurrentTier(tier, currentTier, isUpgrade), isSuggested),
            description: canSelect ? <TierDescription text={(isSuggested && config.upgradeDescription) || config.description} note={priceNote} /> : 'Cannot downgrade',
            price: forFriends ? undefined : <TierPrice tier={tier} countryCode={countryCode} discount={discount} />,
            unit: forFriends ? undefined : getPriceUnit(tier, countryCode, discount),
            footer: <TierFeatures features={config.features} extra={isSuggested ? SUGGESTED_FEATURES[tier] : undefined} />,
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
            <TierNote forFriends={forFriends} />
        </div>
    )
}
