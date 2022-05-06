import React, { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { getLoadingElement } from '../../utils/LoadingUtils'
import api from '../../api/ApiHelper'
import styles from './Payment.module.css'
import Tooltip from '../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'
import { useCoflCoins } from '../../utils/Hooks'
import { numberWithThousandsSeperators } from '../../utils/Formatter'

function Payment() {
    let [isLoadingId, setLoadingId] = useState('')
    let [currentRedirectLink, setCurrentRedirectLink] = useState('')
    let [showAll, setShowAll] = useState(false)
    let coflCoins = useCoflCoins()

    function onPayPaypal(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        api.paypalPurchase(productId, coflCoins).then(data => {
            setCurrentRedirectLink(data.directLink)
            window.open(data.directLink)
        })
    }

    function onPayStripe(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        api.stripePurchase(productId, coflCoins).then(data => {
            setCurrentRedirectLink(data.directLink)
            window.open(data.directLink)
        })
    }

    function getPaymentElement(title: JSX.Element, stripePrice: number, stripeProductId: string, paypalPrice: number, payPalProductId: string) {
        return (
            <Card className={styles.premiumPlanCard}>
                <Card.Header>
                    <Card.Title>{title}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p className={styles.paymentOption}>
                        <div style={{ width: '50%' }}>
                            Buy with Paypal{' '}
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Higher price than with credit card due to higher fees</p>}
                            />
                        </div>
                        <Button
                            variant="success"
                            onClick={() => {
                                onPayPaypal(payPalProductId)
                            }}
                            style={{ width: '40%' }}
                        >
                            {payPalProductId === isLoadingId ? (
                                <p className={styles.manualRedirectLink}>
                                    Redirecting to PayPal...
                                    <br /> Not working?{' '}
                                    <a href={currentRedirectLink} target="_blank">
                                        Click here
                                    </a>
                                </p>
                            ) : (
                                `${numberWithThousandsSeperators(Math.round(paypalPrice * 100) / 100)} Euro`
                            )}
                        </Button>
                    </p>
                    <p className={styles.paymentOption}>
                        <div style={{ width: '50%' }}>Buy with Stripe</div>
                        <Button
                            variant="success"
                            onClick={() => {
                                onPayStripe(stripeProductId)
                            }}
                            style={{ width: '40%' }}
                        >
                            {stripeProductId === isLoadingId ? (
                                <p className={styles.manualRedirectLink}>
                                    Redirecting to Stripe...
                                    <br />
                                    Not working?{' '}
                                    <a href={currentRedirectLink} target="_blank">
                                        Click here
                                    </a>
                                </p>
                            ) : (
                                `${numberWithThousandsSeperators(Math.round(stripePrice * 100) / 100)} Euro`
                            )}
                        </Button>
                    </p>
                </Card.Body>
            </Card>
        )
    }

    function getNextTo1800PaymentElement() {
        let coflCoinsToBuy = 1800 + (1800 - (coflCoins % 1800))
        let payPalProductId = 'p_cc_1800'
        let stripeProductId = 's_cc_1800'

        return (
            <Card className={styles.premiumPlanCard} style={{ width: '100%' }}>
                <Card.Header>
                    <Card.Title>{numberWithThousandsSeperators(coflCoinsToBuy)} CoflCoins</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>
                        We noticed that your CoflCoins are not a multiple of 1.800 and therefore you would not be able to use all of them to buy premium. Here
                        you can purchase {numberWithThousandsSeperators(coflCoinsToBuy)} CoflCoins to again be able to do that.
                    </p>
                    <p>Due to the fees we have to pay to our payment providers we sadly can't provide purchases of less than 1.800 CoflCoins at once.</p>
                    <hr />
                    <p className={styles.paymentOption}>
                        <div style={{ width: '50%' }}>
                            Buy with Paypal{' '}
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Higher price than with credit card due to higher fees</p>}
                            />
                        </div>
                        <Button
                            variant="success"
                            onClick={() => {
                                onPayPaypal(payPalProductId, coflCoinsToBuy)
                            }}
                            style={{ width: '40%' }}
                        >
                            {`${payPalProductId}_${coflCoinsToBuy}` === isLoadingId
                                ? getLoadingElement(<p>Redirecting to checkout...</p>)
                                : `${((6.99 / 1800) * coflCoinsToBuy).toFixed(2)} Euro`}
                        </Button>
                    </p>
                    <p className={styles.paymentOption}>
                        <div style={{ width: '50%' }}>Buy with Stripe</div>
                        <Button
                            variant="success"
                            onClick={() => {
                                onPayStripe(stripeProductId, coflCoinsToBuy)
                            }}
                            style={{ width: '40%' }}
                        >
                            {`${stripeProductId}_${coflCoinsToBuy}` === isLoadingId
                                ? getLoadingElement(<p>Redirecting to checkout...</p>)
                                : `${((6.69 / 1800) * coflCoinsToBuy).toFixed(2)} Euro`}
                        </Button>
                    </p>
                </Card.Body>
            </Card>
        )
    }

    return (
        <div>
            <div>
                <div className={styles.productGrid}>
                    {getPaymentElement(<span>{numberWithThousandsSeperators(1800)} CoflCoins</span>, 6.69, 's_cc_1800', 6.99, 'p_cc_1800')}
                    {getPaymentElement(
                        <span>
                            {numberWithThousandsSeperators(5400)} CoflCoins <span className={styles.discount}>~4% off</span>
                        </span>,
                        19.69,
                        's_cc_5400',
                        19.99,
                        'p_cc_5400'
                    )}
                    {!showAll ? (
                        <Button
                            style={{ width: '100%' }}
                            onClick={() => {
                                setShowAll(true)
                            }}
                        >
                            Show all CoflCoin Options
                        </Button>
                    ) : null}
                    {showAll ? (
                        <>
                            {getPaymentElement(
                                <span>
                                    {numberWithThousandsSeperators(10800)} CoflCoins <span className={styles.discount}>~5% off</span>
                                </span>,
                                38.99,
                                's_cc_10800',
                                39.69,
                                'p_cc_10800'
                            )}
                            {getPaymentElement(
                                <span>
                                    {numberWithThousandsSeperators(21600)} CoflCoins <span className={styles.discount}>~6% off</span>
                                </span>,
                                74.99,
                                's_cc_21600',
                                78.69,
                                'p_cc_21600'
                            )}
                            {coflCoins % 1800 != 0 ? getNextTo1800PaymentElement() : null}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default Payment
