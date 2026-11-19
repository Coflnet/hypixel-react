'use client'
import { Card } from 'react-bootstrap'
import NavBar from '../NavBar/NavBar'
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
function Premium() {
    const account = usePremiumAccount()
    const { isLoggedIn, hasPremium } = account

    return (
        <div>
            <h2>
                <NavBar />
                Premium
            </h2>
            <hr />
            <PremiumStatusLine account={account} />
            <hr />
            <PremiumSignIn account={account} />
            <TermsAlerts account={account} />
            <PurchaseWizardSection account={account} />
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
