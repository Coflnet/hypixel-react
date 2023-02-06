import  { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { getLoadingElement } from '../../utils/LoadingUtils'
import api from '../../api/ApiHelper'
import styles from './CoflCoinsPurchase.module.css'
import Tooltip from '../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'
import { useCoflCoins } from '../../utils/Hooks'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import { toast } from 'react-toastify'
import Countdown from 'react-countdown'

interface Props {
    cancellationRightLossConfirmed: boolean
}

function Payment(props: Props) {
    let [isLoadingId, setLoadingId] = useState('')
    let [currentRedirectLink, setCurrentRedirectLink] = useState('')
    let [showAll, setShowAll] = useState(false)
    let coflCoins = useCoflCoins()

    function onPayPaypal(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        api.paypalPurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink)
            })
            .catch(onPaymentRedirectFail)
    }

    function onPayStripe(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        api.stripePurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink)
            })
            .catch(onPaymentRedirectFail)
    }

    function onPaymentRedirectFail() {
        setCurrentRedirectLink('')
        setLoadingId('')
        toast.error('Something went wrong. Please try again.')
    }

    function getDisabledPaymentTooltip() {
        return !props.cancellationRightLossConfirmed ? <span>Please note the information regarding your cancellation right above.</span> : null
    }

    function getRoundedPrice(price: number) {
        return Math.round(price * 100) / 100
    }

    let paypalHigherPricesTooltip = (
        <Tooltip
            content={
                <span style={{ marginLeft: '5px' }}>
                    <HelpIcon />
                </span>
            }
            type="hover"
            tooltipContent={<p>Higher price than with credit card due to higher fees</p>}
        />
    )

    function getPaymentElement(
        title: JSX.Element,
        stripePrice: number,
        stripeProductId: string,
        paypalPrice: number,
        payPalProductId: string,
        discount?: number
    ) {
        return (
            <Card className={styles.premiumPlanCard}>
                <Card.Header>
                    <Card.Title>{title}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p className={styles.paymentOption}>
                        <div className={styles.paymentLabel}>Buy with Paypal {paypalHigherPricesTooltip}</div>
                        <Tooltip
                            type="hover"
                            tooltipContent={getDisabledPaymentTooltip()}
                            content={
                                <div className={styles.paymentButtonWrapper}>
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            onPayPaypal(payPalProductId)
                                        }}
                                        className={styles.paymentButton}
                                        disabled={!props.cancellationRightLossConfirmed}
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
                                            <span>
                                                {`${numberWithThousandsSeperators(getRoundedPrice(discount ? paypalPrice * discount : paypalPrice))} Euro`}
                                                {discount ? (
                                                    <span style={{ color: 'red', fontWeight: 'bold', paddingLeft: '20px' }}>
                                                        {Math.round((1 - discount) * 100)}% OFF
                                                    </span>
                                                ) : null}
                                                {discount ? (
                                                    <p style={{ fontSize: 'x-small', margin: 0, padding: 0 }}>Original price: {getRoundedPrice(paypalPrice)}</p>
                                                ) : null}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            }
                        />
                    </p>
                    <p className={styles.paymentOption}>
                        <div className={styles.paymentLabel}>
                            Buy with Stripe <span style={{ color: 'red' }}>(currently not available)</span>
                        </div>
                        <Tooltip
                            type="hover"
                            tooltipContent={<span>Stripe is currently not available as we experience problems with this payment provider.</span>}
                            content={
                                <div className={styles.paymentButtonWrapper}>
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            onPayStripe(stripeProductId)
                                        }}
                                        className={styles.paymentButton}
                                        disabled={true || !props.cancellationRightLossConfirmed}
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
                                            <span>
                                                {`${numberWithThousandsSeperators(getRoundedPrice(discount ? stripePrice * discount : stripePrice))} Euro`}
                                                {discount ? (
                                                    <span style={{ color: 'red', fontWeight: 'bold', paddingLeft: '20px' }}>
                                                        {Math.round((1 - discount) * 100)}% OFF
                                                    </span>
                                                ) : null}
                                                {discount ? (
                                                    <p style={{ fontSize: 'x-small', margin: 0, padding: 0 }}>Original price: {getRoundedPrice(stripePrice)}</p>
                                                ) : null}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            }
                        />
                    </p>
                </Card.Body>
            </Card>
        )
    }

    function getNextTo1800PaymentElement() {
        let coflCoinsToBuy = 1800 + (1800 - (coflCoins % 1800))
        let stripePrice = ((6.69 / 1800) * coflCoinsToBuy).toFixed(2)
        let paypalPrice = ((6.99 / 1800) * coflCoinsToBuy).toFixed(2)
        let payPalProductId = 'p_cc_1800'
        let stripeProductId = 's_cc_1800'

        return (
            <Card className={styles.premiumPlanCard} style={{ width: '100%' }}>
                <Card.Header>
                    <Card.Title>{numberWithThousandsSeperators(coflCoinsToBuy)} CoflCoins</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>
                        We noticed that your CoflCoins are not a multiple of {numberWithThousandsSeperators(1800)} and therefore you would not be able to use
                        all of them to buy premium. Here you can purchase {numberWithThousandsSeperators(coflCoinsToBuy)} CoflCoins to again be able to do that.
                    </p>
                    <p>
                        Due to the fees we have to pay to our payment providers we sadly can't provide purchases of less than{' '}
                        {numberWithThousandsSeperators(1800)} CoflCoins at once.
                    </p>
                    <hr />
                    <p className={styles.paymentOption}>
                        <div className={styles.paymentLabel}>Buy with Paypal {paypalHigherPricesTooltip}</div>
                        <Tooltip
                            type="hover"
                            tooltipContent={getDisabledPaymentTooltip()}
                            content={
                                <div className={styles.paymentButtonWrapper}>
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            onPayPaypal(payPalProductId, coflCoinsToBuy)
                                        }}
                                        className={styles.paymentButton}
                                        disabled={!props.cancellationRightLossConfirmed}
                                    >
                                        {`${payPalProductId}_${coflCoinsToBuy}` === isLoadingId
                                            ? getLoadingElement(<p>Redirecting to checkout...</p>)
                                            : `${paypalPrice} Euro`}
                                    </Button>
                                </div>
                            }
                        />
                    </p>
                    <p className={styles.paymentOption}>
                        <div className={styles.paymentLabel}>
                            Buy with Stripe <span style={{ color: 'red' }}>(currently not available)</span>
                        </div>
                        <Tooltip
                            type="hover"
                            tooltipContent={<span>Stripe is currently not available as we experience problems with this payment provider.</span>}
                            content={
                                <div className={styles.paymentButtonWrapper}>
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            onPayStripe(stripeProductId, coflCoinsToBuy)
                                        }}
                                        className={styles.paymentButton}
                                        disabled={true || !props.cancellationRightLossConfirmed}
                                    >
                                        {`${stripeProductId}_${coflCoinsToBuy}` === isLoadingId
                                            ? getLoadingElement(<p>Redirecting to checkout...</p>)
                                            : `${stripePrice} Euro`}
                                    </Button>
                                </div>
                            }
                        />
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
                    {getPaymentElement(<span>{numberWithThousandsSeperators(5400)} CoflCoins </span>, 19.69, 's_cc_5400', 19.99, 'p_cc_5400')}
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
                            {getPaymentElement(<span>{numberWithThousandsSeperators(10800)} CoflCoins </span>, 38.99, 's_cc_10800', 39.69, 'p_cc_10800')}
                            {getPaymentElement(<span>{numberWithThousandsSeperators(21600)} CoflCoins </span>, 74.99, 's_cc_21600', 78.69, 'p_cc_21600')}
                            {coflCoins % 1800 != 0 ? getNextTo1800PaymentElement() : null}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default Payment
