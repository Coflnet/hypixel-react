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

    useEffect(() => {
        setIsSSR(false)
        setCancellationRightLossConfirmed(localStorage.getItem(CANCELLATION_RIGHT_CONFIRMED) === 'true')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
        })
    }

    function loadPremiumSubscriptions(): Promise<void> {
        return api.getPremiumSubscriptions().then(subscriptions => {
            subscriptions = subscriptions.filter(subscription => subscription.endsAt.getTime() > new Date().getTime())
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
                <p style={{ color: '#00bc8c' }}>You have a Premium account. Thank you for your support.</p>
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
            {isLoggedIn ? (
                <div style={{ marginBottom: '20px' }}>
                    <BuyPremium activePremiumProduct={activePremiumProduct!} onNewActivePremiumProduct={loadPremiumProducts} />
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
                    <CoflCoinsPurchase cancellationRightLossConfirmed={cancellationRightLossConfirmed} />
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
