'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { Discount, formatDiscountEndDate, getActiveCoinsDiscount } from '../../utils/DiscountUtils'
import { useVisitorPromotion } from '../../hooks/useCheckoutOffer'
import { describeBestAmount, describePromotionScope, formatPromotionEnd } from '../../utils/SubscriptionCheckout'
import type { AutoDiscount } from '../../api/_generated/skyApi.schemas'
import { PremiumTier, getTierDisplayName } from '../Premium/PremiumPurchaseWizard/types'
import { getNextTierUp } from '../../utils/PremiumUpgradeUtils'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { parsePremiumProducts } from '../../utils/Parser/APIResponseParser'
import { LAST_PREMIUM_PRODUCTS } from '../../utils/SettingsUtils'
import { getUpgradeHighlights } from '../PremiumLanding/content/tierHighlights'
import styles from './Discounts.module.css'

/**
 * Resolves whether the logged-in user already owns the top (Premium+) tier.
 * Starts at `false` (matching SSR and users we know nothing about) so hydration stays stable,
 * then upgrades to the cached and finally the freshly loaded answer after mount.
 */
function useHasPremiumPlus(): boolean {
    const [hasPremiumPlus, setHasPremiumPlus] = useState(false)

    useEffect(() => {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
        if (!token) {
            return
        }

        // Optimistic value from the last known products to avoid a flash for returning users.
        try {
            const cached = localStorage.getItem(LAST_PREMIUM_PRODUCTS)
            if (cached) {
                setHasPremiumPlus(hasHighEnoughPremium(parsePremiumProducts(JSON.parse(cached)), PREMIUM_RANK.PREMIUM_PLUS))
            }
        } catch {
            // ignore a malformed cache and rely on the refresh below
        }

        api.refreshLoadPremiumProducts(
            products => setHasPremiumPlus(hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM_PLUS)),
            () => {}
        )
    }, [])

    return hasPremiumPlus
}

/** where the sale banners send visitors: the plans of either /premium variant (both pages have the #plans anchor) */
export const PLANS_HREF = '/premium#plans'

/**
 * Full-width banner of the automatic promotion the visitor's country gets (GET /api/premium/discount/auto), e.g.
 * "Blackweek sale: up to 50% OFF your first payment — ends November 30, 11:59 PM GMT+1". Links to the plans; no code is needed.
 * Renders nothing on the server, while the country or providers load and when no promotion runs for them.
 * `href` is "#plans" on /premium itself, so the page (and its query, e.g. the QA variant override) stays.
 */
export function PromotionBanner({ href = PLANS_HREF }: { href?: string }) {
    const promotion = useVisitorPromotion()
    if (!promotion) return null
    const end = formatPromotionEnd(promotion.expiresAt)
    const name = promotion.name || 'Sale'
    return (
        <Link href={href} className={styles.salesBanner} data-testid="promotion-banner">
            <span className={styles.bannerTitle}>🎮 {name}:</span> <span className={styles.highlight}>{getPromotionHeadline(promotion)}</span>{' '}
            {describePromotionScope(promotion)}
            {end ? ` — ends ${end}` : ''}
            <span className={styles.bannerAction}>
                Applied automatically — <span className={styles.bannerLink}>See the plans →</span>
            </span>
        </Link>
    )
}

/** "up to 50% OFF" (or "€5.00 OFF" for a fixed amount) */
function getPromotionHeadline(promotion: AutoDiscount): string {
    return describeBestAmount(promotion).replace(/ off$/, ' OFF')
}

/**
 * Full-width promotional banner shown at the top of the start page.
 *
 * Advertises the running subscription promotion, except for users who already own the top (Premium+) tier — a subscription
 * discount is useless to them, so they instead see the CoflCoins sale (or nothing when no coins sale is running).
 */
export function SubscriptionSalesBanner() {
    const hasPremiumPlus = useHasPremiumPlus()
    const coinsDiscount = getActiveCoinsDiscount()

    if (!hasPremiumPlus) return <PromotionBanner />
    if (!coinsDiscount) return null
    return (
        <Link href="/premium" className={styles.salesBanner} role="button" aria-label={`${coinsDiscount.label} promo`}>
            <span style={{ fontSize: '1.1em' }}>🪙 {coinsDiscount.label}</span> Get <span className={styles.highlight}>{coinsDiscount.percentage}% OFF</span>{' '}
            CoflCoins with code <span className={styles.code}>{coinsDiscount.code}</span> until {formatDiscountEndDate(coinsDiscount.endsAt)} — Click to redeem!
        </Link>
    )
}

/**
 * Inline note advertising the currently running CoflCoins sale.
 * Rendered above the CoflCoins shop. Renders nothing while no coins discount is active.
 */
export function CoinsSaleNote() {
    const discount = getActiveCoinsDiscount()
    if (!discount) {
        return null
    }

    return (
        <div className={styles.saleNote} style={{ marginBottom: '20px' }}>
            🪙 <strong>{discount.label}:</strong> Get <strong>{discount.percentage}% off</strong> CoflCoins with code{' '}
            <code className={styles.code}>{discount.code}</code> at checkout — until {formatDiscountEndDate(discount.endsAt)}.
        </div>
    )
}

interface TierUpsellPanelProps {
    /** The tier the user is about to buy */
    currentTier: PremiumTier
    /** What the next tier costs for the same billing period and payment method, e.g. "€35.69 per 4 weeks"; null while unknown */
    price?: string | null
    /** What the applied discount code saves on the next tier, e.g. "With TEST90: ..."; null or missing hides the line */
    codeSavings?: string | null
    /** Called with the higher tier when the user chooses to upgrade in place */
    onUpgrade: (tier: PremiumTier) => void
}

/**
 * "What you could get" panel shown next to "What you'll get" in the purchase step, on every checkout below the top tier.
 * Advertises the next tier up with its price and what it adds (the features its /premium plan card lists), and what the applied
 * discount code saves on it. Clicking the button upgrades the selection in place (no going back).
 * Renders nothing when the user is already on the top tier.
 */
export function TierUpsellPanel({ currentTier, price, codeSavings, onUpgrade }: TierUpsellPanelProps) {
    const nextTier = getNextTierUp(currentTier)
    if (!nextTier) {
        return null
    }

    const nextTierName = getTierDisplayName(nextTier)
    const highlights = getUpgradeHighlights(currentTier)

    return (
        <div className={styles.upsellPanel}>
            <h6 className={styles.upsellHeading}>⬆️ What you could get</h6>
            <p className={styles.upsellTier}>
                Step up to <strong>{nextTierName}</strong>
            </p>
            {/* with a code the savings line states the price, so the full price is not repeated above it */}
            {price && !codeSavings ? <p data-testid="upsell-price">{price}</p> : null}
            {codeSavings && (
                <p className={styles.upsellSavings} data-testid="upsell-code-savings">
                    {codeSavings}
                </p>
            )}
            {highlights.length > 0 && (
                <ul className={styles.upsellFeatures}>
                    {highlights.map(feature => (
                        <li key={feature}>{feature}</li>
                    ))}
                </ul>
            )}
            <Button variant="warning" size="sm" className={styles.upsellButton} onClick={() => onUpgrade(nextTier)}>
                Upgrade to {nextTierName}
            </Button>
        </div>
    )
}

/**
 * Short line about the running promotion, appended to the premium note over locked flips.
 * Renders nothing while no promotion runs for the visitor.
 */
export function FlipListDiscountNote() {
    const promotion = useVisitorPromotion()
    if (!promotion) return null
    return (
        <span className={styles.flipNote} data-testid="flip-promotion-note">
            🎮 {promotion.name || 'Sale'}: {describeBestAmount(promotion)} {describePromotionScope(promotion)} of Premium, applied automatically
        </span>
    )
}

export type { Discount }
