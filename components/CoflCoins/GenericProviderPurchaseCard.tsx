import { Button } from 'react-bootstrap'
import Tooltip from '../Tooltip/Tooltip'
import styles from './CoflCoinsPurchase.module.css'
import HelpIcon from '@mui/icons-material/Help'
import Number from '../Number/Number'
import type { JSX } from 'react'

interface Props {
    type: 'PayPal' | 'Stripe' | 'LemonSqueezy' | 'Google Play'
    price: number
    disabledTooltip: JSX.Element | undefined
    onPay()
    isDisabled: boolean
    isRedirecting: boolean
    redirectLink?: string
    discount?: number
    currencyCode?: string
}

export default function GenericProviderPurchaseCard(props: Props) {
    function getRoundedPrice(price: number) {
        return Math.round(price * 100) / 100
    }

    const getCurrencySymbol = (code?: string): string => {
        const currencyMap: Record<string, string> = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'INR': '₹',
            'JPY': '¥',
            'CNY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
        }
        return code ? (currencyMap[code] || code) : '€'
    }

    const currencySymbol = getCurrencySymbol(props.currencyCode)

    return (
        <div className={styles.paymentOption}>
            <div className={styles.paymentLabel}>
                {props.type === 'PayPal' ? (
                    <Tooltip
                        content={
                            <span>
                                Buy with {props.type}{' '}
                                <span style={{ marginLeft: '5px' }}>
                                    <HelpIcon />
                                </span>
                            </span>
                        }
                        type="hover"
                        tooltipContent={<p>Higher price than with credit card due to higher fees</p>}
                    />
                ) : null}
                {props.type === 'Stripe' && <span>Buy with other payment methods</span>}
                {props.type === 'LemonSqueezy' && <span>Continue to payment</span>}
                {props.type === 'Google Play' && <span>Buy with Google Play</span>}
            </div>
            <Tooltip
                type="hover"
                tooltipContent={props.disabledTooltip}
                content={
                    <div className={styles.paymentButtonWrapper}>
                        <Button
                            variant="success"
                            onClick={() => {
                                props.onPay()
                            }}
                            className={styles.paymentButton}
                            disabled={props.isDisabled}
                        >
                            {props.isRedirecting ? (
                                <p className={styles.manualRedirectLink}>
                                    {props.type === 'Google Play' ? (
                                        <span>Opening Google Play...</span>
                                    ) : props.redirectLink ? (
                                        <>
                                            Redirecting to PayPal...
                                            <br /> Not working?{' '}
                                            <a
                                                href={props.redirectLink}
                                                onClick={e => {
                                                    e.stopPropagation()
                                                }}
                                                target="_blank"
                                            >
                                                Click here
                                            </a>
                                        </>
                                    ) : (
                                        <span>Contacting payment provider...</span>
                                    )}
                                </p>
                            ) : (
                                <span>
                                    <Number number={getRoundedPrice(props.discount ? props.price * props.discount : props.price)} /> {currencySymbol}
                                    {props.discount ? (
                                        <span style={{ color: 'red', fontWeight: 'bold', paddingLeft: '20px' }}>
                                            {Math.round((1 - props.discount) * 100)}% OFF
                                        </span>
                                    ) : null}
                                    {props.discount ? (
                                        <p style={{ fontSize: 'x-small', margin: 0, padding: 0 }}>Original price: {getRoundedPrice(props.price)} {currencySymbol}</p>
                                    ) : null}
                                </span>
                            )}
                        </Button>
                    </div>
                }
            />
        </div>
    )
}
