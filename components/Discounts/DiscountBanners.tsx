'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import {
    Discount,
    formatDiscountEndDate,
    getActiveCoinsDiscount,
    getActiveSubscriptionDiscount
} from '../../utils/DiscountUtils'
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

/**
 * Full-width promotional banner shown at the top of the start page.
 *
 * Advertises the running subscription sale, except for users who already own the top (Premium+)
 * tier — a subscription discount is useless to them, so they instead see the CoflCoins sale (or
 * nothing when no coins sale is running). Renders nothing while no relevant discount is active.
 */
export function SubscriptionSalesBanner() {
    const hasPremiumPlus = useHasPremiumPlus()
    const subscriptionDiscount = getActiveSubscriptionDiscount()
    const coinsDiscount = getActiveCoinsDiscount()

    if (hasPremiumPlus) {
        if (!coinsDiscount) {
            return null
        }
        return (
            <Link href="/premium" className={styles.salesBanner} role="button" aria-label={`${coinsDiscount.label} promo`}>
                <span style={{ fontSize: '1.1em' }}>🪙 {coinsDiscount.label}</span> Get{' '}
                <span className={styles.highlight}>{coinsDiscount.percentage}% OFF</span> CoflCoins with code{' '}
                <span className={styles.code}>{coinsDiscount.code}</span> until {formatDiscountEndDate(coinsDiscount.endsAt)} — Click to redeem!
            </Link>
        )
    }

    if (!subscriptionDiscount) {
        return null
    }

    return (
        <Link href={`/premium?code=${subscriptionDiscount.code}`} className={styles.salesBanner} role="button" aria-label={`${subscriptionDiscount.label} promo`}>
            <span style={{ fontSize: '1.1em' }}>☀️ {subscriptionDiscount.label}</span> Get{' '}
            <span className={styles.highlight}>{subscriptionDiscount.percentage}% OFF</span> any subscription with code{' '}
            <span className={styles.code}>{subscriptionDiscount.code}</span> until {formatDiscountEndDate(subscriptionDiscount.endsAt)} — Click to redeem!
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
            {price ? <p data-testid="upsell-price">{price}</p> : null}
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
 * Short discount line appended to the premium note over locked flips.
 * Renders nothing while no subscription discount is active.
 */
export function FlipListDiscountNote() {
    const discount = getActiveSubscriptionDiscount()
    if (!discount) {
        return null
    }

    return (
        <span className={styles.flipNote}>
            ☀️ {discount.label}: {discount.percentage}% off with code {discount.code}
        </span>
    )
}

export type { Discount }
