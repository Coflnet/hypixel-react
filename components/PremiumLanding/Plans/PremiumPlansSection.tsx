'use client'
import { ReactNode } from 'react'
import { useCountryDetection } from '../../../hooks/useCountryDetection'
import { useScrollToAfterRender } from '../../../hooks/useScrollToAfterRender'
import { trackPremiumPageEvent } from '../../../utils/PremiumTracking'
import { usePremiumVariant } from '../../Premium/PremiumVariantContext'
import { PremiumAccount, usePremiumAccount } from '../../Premium/usePremiumAccount'
import {
    CoflCoinsPurchaseBlock,
    ExtendPremiumSection,
    PremiumSignIn,
    PremiumStatusLine,
    PurchaseWizardSection,
    SlotsLink,
    TermsAlerts
} from '../../Premium/PremiumAccountSections'
import { PremiumTier } from '../../Premium/PremiumPurchaseWizard/types'
import { PLAN_BUTTON_LABEL, PLAN_CARDS, PlanCard } from '../content/plans'
import { getPlanPrice } from '../content/planPricing'
import page from '../PremiumLanding.module.css'
import { COFLCOINS_TARGET, getSignInActionTarget, PurchaseReadiness, SIGN_IN_TARGET, SignInAction } from '../../Premium/purchaseTarget'
import { useSignInPrompt } from '../../Premium/useSignInPrompt'
import styles from './PremiumPlansSection.module.css'

const CARD_STYLE: Record<PremiumTier, { card?: string; title?: string; button: string }> = {
    [PremiumTier.STARTER]: { button: styles.buttonStarter },
    [PremiumTier.PREMIUM]: { card: styles.cardPremium, title: page.tierPremium, button: styles.buttonPremium },
    [PremiumTier.PREMIUM_PLUS]: { title: page.tierPremiumPlus, button: styles.buttonPremiumPlus }
}

function CheckIcon() {
    return (
        <svg className={styles.check} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5l3.5 3.5L13 5" />
        </svg>
    )
}

function PlanPrice({ tier, countryCode }: { tier: PremiumTier; countryCode?: string }) {
    const price = getPlanPrice(tier, countryCode)
    return (
        <div className={styles.price}>
            <div className={styles.priceLine}>
                <span className={styles.amount}>{price.amount}</span>
                <span className={page.muted}>{price.unit}</span>
            </div>
            <span className={styles.small}>{price.note}</span>
        </div>
    )
}

function PlanCardView({ plan, countryCode, onSelect }: { plan: PlanCard; countryCode?: string; onSelect(tier: PremiumTier): void }) {
    const style = CARD_STYLE[plan.tier]
    return (
        <div className={`${page.card} ${styles.plan} ${style.card ?? ''}`} data-testid={`plan-${plan.tier}`}>
            <div className={styles.planHead}>
                <div className={styles.planTitleRow}>
                    <h3 className={`${styles.planTitle} ${style.title ?? ''}`}>{plan.title}</h3>
                    {plan.badge ? <span className={styles.popular}>{plan.badge}</span> : null}
                </div>
                <p className={page.muted}>{plan.description}</p>
            </div>
            <PlanPrice tier={plan.tier} countryCode={countryCode} />
            <div className={styles.stats}>
                {plan.stats.map(stat => (
                    <div key={stat.label} className={styles.stat}>
                        <span className={styles.statValue}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                    </div>
                ))}
            </div>
            <ul className={styles.bullets}>
                {plan.bullets.map(bullet => (
                    <li key={bullet}>
                        <CheckIcon />
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>
            <button type="button" className={`${styles.planButton} ${style.button}`} onClick={() => onSelect(plan.tier)}>
                {PLAN_BUTTON_LABEL[plan.tier]}
            </button>
        </div>
    )
}

interface ExtrasCardsProps {
    account: PremiumAccount
    onBuyCoflCoins(): void
    /** set while the slots need a sign-in first; the link then stays on the page */
    onSlotsNeedSignIn?(): void
}

function ExtrasCards({ account, onBuyCoflCoins, onSlotsNeedSignIn }: ExtrasCardsProps) {
    const canBuyHere = account.isLoggedIn && account.canPurchase
    return (
        <div className={styles.extras}>
            <div className={`${page.card} ${styles.extra}`}>
                <h3 className={styles.extraTitle}>Premium for Friends</h3>
                <p className={page.muted}>Give your friends Premium access with a single slot or a four-slot bundle.</p>
                <SlotsLink variant="secondary" className={styles.extraButton} onSignInNeeded={onSlotsNeedSignIn}>
                    Explore Slots and Bundles
                </SlotsLink>
            </div>
            <div className={`${page.card} ${styles.extra}`}>
                <h3 className={styles.extraTitle}>CoflCoins</h3>
                <p className={page.muted}>Pay for any plan with CoflCoins instead of a subscription.</p>
                {canBuyHere ? (
                    <a href={`#${COFLCOINS_TARGET}`} className={`btn btn-secondary ${styles.extraButton}`}>
                        Buy CoflCoins
                    </a>
                ) : (
                    <button type="button" className={`btn btn-secondary ${styles.extraButton}`} onClick={onBuyCoflCoins}>
                        Buy CoflCoins
                    </button>
                )}
            </div>
        </div>
    )
}

/** `communityQuotes` is rendered by the server page (no client JS) and placed under the plan cards */
export default function PremiumPlansSection({ communityQuotes }: { communityQuotes?: ReactNode }) {
    const variant = usePremiumVariant()
    const account = usePremiumAccount()
    const { selectedCountry } = useCountryDetection()
    const scrollTo = useScrollToAfterRender(SIGN_IN_TARGET)
    const signIn = useSignInPrompt(account, {
        onPrompt: action => trackPremiumPageEvent('sign in prompt', variant, { source: action }),
        onContinue: continueAction
    })

    /** brings the action's purchase block into view, or the step that still blocks it */
    function continueAction(action: SignInAction, ready: PurchaseReadiness) {
        if (action === 'slots') account.requestSlots()
        scrollTo(getSignInActionTarget(action, ready))
    }

    function selectPlan(tier: PremiumTier) {
        trackPremiumPageEvent('plan button', variant, { tier })
        account.requestTier(tier)
        signIn.runSignedIn('plan')
    }

    return (
        <section id="plans" className={page.section}>
            <div className={page.sectionInner}>
                <div className={page.sectionHead}>
                    <h2 className={page.sectionTitle}>Choose Your Plan</h2>
                    <p className={page.muted}>Higher tiers include all features from lower tiers plus additional benefits.</p>
                </div>
                <div className={styles.plans}>
                    {PLAN_CARDS.map(plan => (
                        <PlanCardView key={plan.tier} plan={plan} countryCode={selectedCountry?.value} onSelect={selectPlan} />
                    ))}
                </div>
                <p className={styles.small}>
                    Prices include applicable VAT or sales tax for your country where available. For the US and some other countries, VAT is added at
                    checkout. Profit figures are the median realized profit per user per day compared to free users, measured over 24 hours on 2026-11-04.
                </p>
                {communityQuotes}
                <div className={styles.account}>
                    <PremiumStatusLine account={account} />
                    <PremiumSignIn account={account} dialog={signIn.dialog} />
                    <TermsAlerts account={account} />
                    <PurchaseWizardSection account={account} />
                    <ExtendPremiumSection account={account} showFriendsCard={false} />
                </div>
                <ExtrasCards
                    account={account}
                    onBuyCoflCoins={() => signIn.runSignedIn('coflcoins')}
                    onSlotsNeedSignIn={signIn.needsSignIn ? () => signIn.runSignedIn('slots') : undefined}
                />
                <CoflCoinsPurchaseBlock account={account} />
            </div>
        </section>
    )
}
