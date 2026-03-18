'use client'
import { useEffect, useState } from 'react'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { Button, Card, Form, Modal } from 'react-bootstrap'
import NavBar from '../NavBar/NavBar'
import PremiumFeatures from './PremiumFeatures/PremiumFeatures'
import api from '../../api/ApiHelper'
import styles from './Premium.module.css'
import CoflCoinsPurchase from '../CoflCoins/CoflCoinsPurchase'
import BuyPremium from './BuyPremium/BuyPremium'
import TransferCoflCoins from '../TransferCoflCoins/TransferCoflCoins'
import { CANCELLATION_RIGHT_CONFIRMED } from '../../utils/SettingsUtils'
import { getHighestPriorityPremiumProduct } from '../../utils/PremiumTypeUtils'
import PremiumStatus from './PremiumStatus/PremiumStatus'
import { toast } from 'react-toastify'
import BuySubscription from './BuySubscription/BuySubscription'
import PremiumPurchaseWizard from './PremiumPurchaseWizard/PremiumPurchaseWizard'
import { parseTierFromUrl } from '../../utils/PremiumUpgradeUtils'

function Premium() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState<boolean>()
    let [activePremiumProduct, setActivePremiumProduct] = useState<PremiumProduct>()
    let [products, setProducts] = useState<PremiumProduct[]>([])
    let [premiumSubscriptions, setPremiumSubscriptions] = useState<PremiumSubscription[]>([])
    let [isLoading, setIsLoading] = useState(false)
    let [showSendCoflCoins, setShowSendCoflCoins] = useState(false)
    let [cancellationRightLossConfirmed, setCancellationRightLossConfirmed] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let [showUpgradeWizard, setShowUpgradeWizard] = useState(false)

    useEffect(() => {
        setIsSSR(false)
        setCancellationRightLossConfirmed(localStorage.getItem(CANCELLATION_RIGHT_CONFIRMED) === 'true')

        // Check for tier parameter to show upgrade wizard
        checkForUpgradeRequest()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Check if user is requesting an upgrade via URL parameter
    function checkForUpgradeRequest() {
        if (typeof window === 'undefined') return

        const urlParams = new URLSearchParams(window.location.search)
        const tierParam = urlParams.get('tier')
        const upgradeParam = urlParams.get('upgrade')

        // Show upgrade wizard if tier parameter is present or upgrade=true
        if (tierParam && parseTierFromUrl(tierParam)) {
            setShowUpgradeWizard(true)
        } else if (upgradeParam === 'true') {
            setShowUpgradeWizard(true)
        }
    }

    function loadPremiumProducts(): Promise<void> {
        return api.refreshLoadPremiumProducts(products => {
            products = products.filter(product => product.expires.getTime() > new Date().getTime())
            setProducts(products)
            let activePremiumProduct = getHighestPriorityPremiumProduct(products)

            if (!activePremiumProduct) {
                setHasPremium(false)
            } else {
                setHasPremium(true)
                setActivePremiumProduct(activePremiumProduct)
            }

            // Check for upgrade request after loading premium status
            checkForUpgradeRequest()
        })
    }

    function loadPremiumSubscriptions(): Promise<void> {
        return api.getPremiumSubscriptions().then(subscriptions => {
            subscriptions = subscriptions.filter(subscription => !subscription.endsAt || subscription.endsAt.getTime() > new Date().getTime())
            setPremiumSubscriptions(subscriptions)
        })
    }

    function onSubscriptionCancel(subscription: PremiumSubscription) {
        api.cancelPremiumSubscription(subscription.externalId).then(() => {
            loadPremiumSubscriptions()
            toast.success('Subscription cancelled')
        })
    }

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoading(true)
            setIsLoggedIn(true)
            Promise.all([loadPremiumProducts(), loadPremiumSubscriptions()]).then(() => {
                setIsLoading(false)
            })
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        setHasPremium(false)
    }

    return (
        <div>
            <h2>
                <NavBar />
                Premium
            </h2>
            <hr />
            {isLoading ? (
                getLoadingElement()
            ) : !isLoggedIn ? (
                <div>
                    <p style={{ color: 'yellow', margin: 0 }}>To use Premium please login with Google.</p>
                </div>
            ) : hasPremium ? (
                <p className="text-success">You have a Premium account. Thank you for your support.</p>
            ) : (
                <div>
                    <p style={{ color: 'red', margin: 0 }}>You do not have a Premium account.</p>
                </div>
            )}
            {isLoggedIn && !hasPremium ? (
                <p>
                    <a href="#buyPremium">I want Premium!</a>
                </p>
            ) : null}
            <hr />
            <div style={{ marginBottom: '20px' }}>
                {isLoggedIn ? <PremiumStatus products={products} subscriptions={premiumSubscriptions} onSubscriptionCancel={onSubscriptionCancel} /> : null}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
                <div>{isLoading ? getLoadingElement() : ''}</div>
            </div>
            {isLoggedIn && (!hasPremium || showUpgradeWizard) ? (
                <div style={{ marginBottom: '40px' }}>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>{hasPremium && showUpgradeWizard ? 'Upgrade Premium' : 'Get Premium'}</h2>
                        {hasPremium && showUpgradeWizard && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setShowUpgradeWizard(false)
                                    // Remove URL parameters
                                    const url = new URL(window.location.href)
                                    url.searchParams.delete('tier')
                                    url.searchParams.delete('upgrade')
                                    window.history.replaceState({}, '', url.pathname)
                                }}
                            >
                                ← Back to Premium Management
                            </Button>
                        )}
                    </div>
                    <PremiumPurchaseWizard
                        activePremiumProduct={activePremiumProduct!}
                        premiumSubscriptions={premiumSubscriptions}
                        onNewActivePremiumProduct={loadPremiumProducts}
                        cancellationRightLossConfirmed={cancellationRightLossConfirmed}
                    />
                </div>
            ) : null}
            {isLoggedIn && hasPremium && !showUpgradeWizard ? (
                <div style={{ marginBottom: '20px' }}>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Extend Premium</h2>
                        <Button variant="success" onClick={() => setShowUpgradeWizard(true)}>
                            🚀 Upgrade to Higher Tier
                        </Button>
                    </div>
                    <p style={{ marginBottom: '30px' }} className="text-muted">
                        Already have premium? You can extend your subscription, add more time, or upgrade to a higher tier.
                    </p>
                    <details>
                        <summary style={{ cursor: 'pointer', marginBottom: '20px' }}>
                            <strong>Advanced Options</strong>
                        </summary>
                        <div style={{ marginLeft: '20px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <h4>Subscriptions</h4>
                                <BuySubscription activePremiumProduct={activePremiumProduct!} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <h4>Prepaid</h4>
                                <BuyPremium
                                    activePremiumProduct={activePremiumProduct!}
                                    premiumSubscriptions={premiumSubscriptions}
                                    onNewActivePremiumProduct={loadPremiumProducts}
                                />
                            </div>
                        </div>
                    </details>
                </div>
            ) : null}
            {isLoggedIn ? (
                <div style={{ marginBottom: '20px' }}>
                    <hr />
                    <h2>
                        CoflCoins
                        <Button
                            className={styles.sendCoflCoinsButton}
                            onClick={() => {
                                setShowSendCoflCoins(true)
                            }}
                        >
                            Send CoflCoins
                        </Button>
                        <Modal
                            size={'lg'}
                            show={showSendCoflCoins}
                            onHide={() => {
                                setShowSendCoflCoins(false)
                            }}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Send CoflCoins</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <TransferCoflCoins
                                    onFinish={() => {
                                        setShowSendCoflCoins(false)
                                    }}
                                />
                            </Modal.Body>
                        </Modal>
                    </h2>
                    {!cancellationRightLossConfirmed ? (
                        <div style={{ paddingBottom: '15px' }}>
                            <Form.Check
                                id={'cancellationRightCheckbox'}
                                className={styles.cancellationRightCheckbox}
                                defaultChecked={isSSR ? false : localStorage.getItem(CANCELLATION_RIGHT_CONFIRMED) === 'true'}
                                onChange={e => {
                                    localStorage.setItem(CANCELLATION_RIGHT_CONFIRMED, e.target.checked.toString())
                                    setCancellationRightLossConfirmed(e.target.checked)
                                }}
                                inline
                            />
                            <label htmlFor={'cancellationRightCheckbox'}>
                                By buying one of the following products, you confirm the immediate execution of the contract, hereby losing your cancellation
                                right.
                            </label>
                        </div>
                    ) : null}
                    <div id="coflcoins-purchase">
                        <CoflCoinsPurchase cancellationRightLossConfirmed={cancellationRightLossConfirmed} />
                    </div>
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
