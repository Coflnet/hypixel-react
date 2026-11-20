'use client'
import { Card } from 'react-bootstrap'
import NavBar from '../NavBar/NavBar'
import { PromotionBanner } from '../Discounts/DiscountBanners'
import type { AutoDiscount } from '../../api/_generated/skyApi.schemas'
import PremiumFeatures from './PremiumFeatures/PremiumFeatures'
import styles from './Premium.module.css'
import { usePremiumAccount } from './usePremiumAccount'
import {
    CoflCoinsPurchaseBlock,
    ExtendPremiumSection,
    PremiumSignIn,
    PremiumStatusLine,
    PurchaseWizardSection,
    TermsAlerts
} from './PremiumAccountSections'

/** the current /premium page; the control of the premium page A/B test */
/** `likelyPromotion`: the promotion most visitors get, from the server; the sale banner reserves its space with it while loading */
function Premium({ likelyPromotion }: { likelyPromotion?: AutoDiscount | null }) {
    const account = usePremiumAccount()
    const { isLoggedIn, hasPremium } = account

    return (
        <div>
            <h2>
                <NavBar />
                Premium
            </h2>
            <hr />
            <PromotionBanner href="#plans" likelyPromotion={likelyPromotion} />
            <PremiumStatusLine account={account} />
            <hr />
            {/* the target of the sale banners' "/premium#plans", like the redesign's plans section */}
            <div id="plans">
                <PremiumSignIn account={account} />
                <TermsAlerts account={account} />
                <PurchaseWizardSection account={account} />
            </div>
            <ExtendPremiumSection account={account} showFriendsCard />
            {isLoggedIn ? (
                <div style={{ marginBottom: '20px' }}>
                    <hr />
                    <h2>CoflCoins</h2>
                    <CoflCoinsPurchaseBlock account={account} />
                </div>
            ) : null}
            <hr />
            <h2>Features</h2>
            <Card className={styles.premiumCard}>
                <Card.Header>
                    <Card.Title>
                        {hasPremium ? (
                            <p>
                                Thank you for your support. You have a Premium account. By buying another Premium plan you can extend your time. You can use the
                                following premium features:
                            </p>
                        ) : (
                            <p>Log in and buy Premium to support us and get access to these features</p>
                        )}
                    </Card.Title>
                </Card.Header>
                <div style={{ padding: '15px' }}>
                    <PremiumFeatures />
                </div>
            </Card>
        </div>
    )
}

export default Premium
