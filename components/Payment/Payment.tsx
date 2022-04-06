import React, { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { getLoadingElement } from '../../utils/LoadingUtils'
import api from '../../api/ApiHelper'
import styles from './Payment.module.css'
import Tooltip from '../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'

function Payment() {
    let [isLoadingId, setLoadingId] = useState('')

    function onPayPaypal(productId: string) {
        setLoadingId(productId)
        api.paypalPurchase(productId).then(data => {
            window.open(data.directLink)
            setLoadingId('')
        })
    }

    function onPayStripe(productId: string) {
        setLoadingId(productId)
        api.stripePurchase(productId).then(data => {
            window.open(data.directLink)
            setLoadingId('')
        })
    }

    function getPaymentElement(title: string, stripePrice: number, stripeProductId: string, paypalPrice: number, payPalProductId: string) {
        return (
            <Card className={styles.premiumPlanCard}>
                <Card.Header>
                    <h3 className={styles.premiumProductLabel}>{title}</h3>
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
                            {payPalProductId === isLoadingId ? getLoadingElement(<p>Redirecting to checkout...</p>) : `${paypalPrice.toFixed(2)} Euro`}
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
                            {stripeProductId === isLoadingId ? getLoadingElement(<p>Redirecting to checkout...</p>) : `${stripePrice.toFixed(2)} Euro`}
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
                    {getPaymentElement('1.800 CoflCoins', 6.69, 's_cc_1800', 6.99, 'p_cc_1800')}
                    {getPaymentElement('5.400 CoflCoins', 19.69, 's_cc_5400', 19.99, 'p_cc_5400')}
                    {getPaymentElement('10.800 CoflCoins', 38.99, 's_cc_10800', 39.69, 'p_cc_10800')}
                    {getPaymentElement('21.600 CoflCoins', 74.99, 's_cc_21600', 78.69, 'p_cc_21600')}
                </div>
            </div>
        </div>
    )
}

export default Payment
