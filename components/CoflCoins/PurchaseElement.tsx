'use client'
import { Card } from 'react-bootstrap'
import styles from './CoflCoinsPurchase.module.css'
import Number from '../Number/Number'
import GenericProviderPurchaseCard from './GenericProviderPurchaseCard'

interface Props {
    coflCoinsToBuy: number
    stripeProductId: string
    stripePrice: number
    paypalProductId: string
    paypalPrice: number
    lemonsqueezyPrice: number
    lemonsqueezyProductId: string
    disabledTooltip: JSX.Element | undefined
    loadingProductId: string
    onPayPalPay(prodcutId: string, coflCoins?: number)
    onStripePay(producctId: string, coflCoins?: number)
    onLemonSqeezyPay(productId: string, coflCoins?: number)
    isDisabled: boolean
    redirectLink?: string
    countryCode?: string
    discount?: number
    isSpecial1800CoinsMultiplier?: boolean
}

// prettier-ignore
const EU_Countries = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE" ]
let PAYPAL_STRIPE_ALLOWED = [...EU_Countries, 'GB', 'US']

export default function PurchaseElement(props: Props) {
    let isDisabled = props.isDisabled || !props.countryCode

    return (
        <Card className={styles.premiumPlanCard} style={props.isSpecial1800CoinsMultiplier ? { width: '100%' } : {}}>
            <Card.Header>
                <Card.Title>
                    <Number number={props.coflCoinsToBuy} /> CoflCoins
                </Card.Title>
            </Card.Header>
            <Card.Body>
                {props.isSpecial1800CoinsMultiplier ? (
                    <>
                        <p>
                            We noticed that your CoflCoins are not a multiple of <Number number={1800} /> and therefore you would not be able to use all of them
                            to buy premium. Here you can purchase <Number number={props.coflCoinsToBuy} /> CoflCoins to again be able to do that.
                        </p>
                        <p>
                            Due to the fees we have to pay to our payment providers we sadly can't provide purchases of less than <Number number={1800} />{' '}
                            CoflCoins at once.
                        </p>
                        <hr />
                    </>
                ) : null}
                {props.countryCode && PAYPAL_STRIPE_ALLOWED.includes(props.countryCode) ? (
                    <>
                        <GenericProviderPurchaseCard
                            type="PayPal"
                            isDisabled={isDisabled}
                            onPay={() => {
                                props.onPayPalPay(props.paypalProductId, props.isSpecial1800CoinsMultiplier ? props.coflCoinsToBuy : undefined)
                            }}
                            price={props.paypalPrice}
                            redirectLink={props.redirectLink}
                            discount={props.discount}
                            isRedirecting={
                                !props.isSpecial1800CoinsMultiplier
                                    ? props.paypalProductId === props.loadingProductId
                                    : `${props.paypalProductId}_${props.coflCoinsToBuy}` === props.loadingProductId
                            }
                            disabledTooltip={props.disabledTooltip}
                        />
                        <GenericProviderPurchaseCard
                            type="Stripe"
                            isDisabled={isDisabled}
                            onPay={() => {
                                props.onStripePay(props.stripeProductId, props.isSpecial1800CoinsMultiplier ? props.coflCoinsToBuy : undefined)
                            }}
                            price={props.stripePrice}
                            redirectLink={props.redirectLink}
                            discount={props.discount}
                            isRedirecting={
                                !props.isSpecial1800CoinsMultiplier
                                    ? props.stripeProductId === props.loadingProductId
                                    : `${props.stripeProductId}_${props.coflCoinsToBuy}` === props.loadingProductId
                            }
                            disabledTooltip={props.disabledTooltip}
                        />
                    </>
                ) : (
                    <GenericProviderPurchaseCard
                        type="LemonSqueezy"
                        isDisabled={isDisabled}
                        onPay={() => {
                            props.onLemonSqeezyPay(props.lemonsqueezyProductId, props.isSpecial1800CoinsMultiplier ? props.coflCoinsToBuy : undefined)
                        }}
                        price={props.lemonsqueezyPrice}
                        redirectLink={props.redirectLink}
                        discount={props.discount}
                        isRedirecting={
                            !props.isSpecial1800CoinsMultiplier
                                ? props.lemonsqueezyProductId === props.loadingProductId
                                : `${props.lemonsqueezyProductId}_${props.coflCoinsToBuy}` === props.loadingProductId
                        }
                        disabledTooltip={props.disabledTooltip}
                    />
                )}
            </Card.Body>
        </Card>
    )
}
