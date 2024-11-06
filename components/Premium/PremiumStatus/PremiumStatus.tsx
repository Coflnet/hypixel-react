'use client'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { getLocalDateAndTime } from '../../../utils/Formatter'
import { getHighestPriorityPremiumProduct, getPremiumLabelForSubscription, getPremiumType } from '../../../utils/PremiumTypeUtils'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './PremiumStatus.module.css'
import { CancelOutlined } from '@mui/icons-material'
import CancelSubscriptionConfirmDialog from '../CancelSubscriptionConfirmDialog/CancelSubscriptionConfirmDialog'

interface Props {
    products: PremiumProduct[]
    subscriptions: PremiumSubscription[]
    labelStyle?: React.CSSProperties
    onSubscriptionCancel(subscription: PremiumSubscription): void
}

function PremiumStatus(props: Props) {
    let [highestPriorityProduct, setHighestPriorityProduct] = useState<PremiumProduct>()
    let [productsToShow, setProductsToShow] = useState<PremiumProduct[]>()
    let [showCancelSubscriptionDialogSubscription, setShowCancelSubscriptionDialogSubscription] = useState<PremiumSubscription>()

    useEffect(() => {
        let products = props.products

        // Hide lower tier products that are most likely bought automatically together (<1min time difference)
        if (products.length > 1) {
            for (let i = 1; i < products.length; i++) {
                if (Math.abs(products[i - 1].expires.getTime() - products[i].expires.getTime()) < 60000) {
                    if (getPremiumType(products[i - 1])?.priority > getPremiumType(products[i])?.priority) {
                        products.splice(i, 1)
                    } else {
                        products.splice(i - 1, 1)
                    }
                    i = 0
                }
            }
        }

        products = products.filter(product => product.expires > new Date())
        setProductsToShow(products)
        setHighestPriorityProduct(getHighestPriorityPremiumProduct(props.products))
    }, [props.products])

    function getProductListEntry(product: PremiumProduct) {
        return (
            <>
                <span>{getPremiumType(product)?.label}</span>
                <Tooltip
                    type="hover"
                    content={<span> (ends {moment(product.expires).fromNow()})</span>}
                    tooltipContent={<span>{getLocalDateAndTime(product.expires)}</span>}
                />
            </>
        )
    }

    let numberOfEntriesToShow = (productsToShow?.length || 0) + (props.subscriptions?.length || 0)

    return (
        <>
            <div>
                {numberOfEntriesToShow > 1 ? (
                    <div style={{ overflow: 'hidden' }}>
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        <ul style={{ float: 'left' }}>
                            {props.subscriptions.map(subscription => (
                                <li key={subscription.externalId}>
                                    {' '}
                                    <Tooltip
                                        type="hover"
                                        content={
                                            <span>
                                                {getPremiumLabelForSubscription(subscription)} (Subscription){' '}
                                                {subscription.endsAt && <span style={{ color: 'red', marginLeft: 5 }}>Canceled</span>}
                                            </span>
                                        }
                                        tooltipContent={
                                            <span>
                                                {subscription.endsAt ? (
                                                    <span>Ends at {getLocalDateAndTime(subscription.endsAt)} </span>
                                                ) : (
                                                    <span>Renews at {getLocalDateAndTime(subscription.renewsAt)}</span>
                                                )}
                                            </span>
                                        }
                                    />
                                    {!subscription.endsAt && (
                                        <Tooltip
                                            type="hover"
                                            content={
                                                <span style={{ color: 'red' }}>
                                                    <CancelOutlined
                                                        style={{ cursor: 'pointer', color: 'red', marginLeft: 5 }}
                                                        onClick={() => {
                                                            setShowCancelSubscriptionDialogSubscription(subscription)
                                                        }}
                                                    />
                                                </span>
                                            }
                                            tooltipContent={<span>Cancel subscription</span>}
                                        />
                                    )}
                                </li>
                            ))}
                            {productsToShow?.map(product => (
                                <li key={product.productSlug}>{getProductListEntry(product)}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>
                        {' '}
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        {highestPriorityProduct ? getProductListEntry(highestPriorityProduct!) : 'No Premium'}
                    </p>
                )}
            </div>
            <CancelSubscriptionConfirmDialog
                show={!!showCancelSubscriptionDialogSubscription}
                onConfirm={() => {
                    if (showCancelSubscriptionDialogSubscription) {
                        props.onSubscriptionCancel(showCancelSubscriptionDialogSubscription)
                        setShowCancelSubscriptionDialogSubscription(undefined)
                    }
                }}
                onHide={() => {
                    setShowCancelSubscriptionDialogSubscription(undefined)
                }}
            />
        </>
    )
}

export default PremiumStatus
