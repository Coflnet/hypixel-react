'use client'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { getLocalDateAndTime } from '../../../utils/Formatter'
import { getHighestPriorityPremiumProduct, getPremiumLabelForSubscription, getPremiumType } from '../../../utils/PremiumTypeUtils'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './PremiumStatus.module.css'
import { CancelOutlined, RestartAlt } from '@mui/icons-material'
import CancelSubscriptionFeedbackDialog from '../CancelSubscriptionFeedbackDialog/CancelSubscriptionFeedbackDialog'
import { usePutApiPremiumSubscriptionExternalIdReactivate } from '../../../api/_generated/skyApi'
import { toast } from 'react-toastify'

interface Props {
    products: PremiumProduct[]
    subscriptions: PremiumSubscription[]
    labelStyle?: React.CSSProperties
    onSubscriptionCancel(subscription: PremiumSubscription): void
    hasLoadingError?: boolean
}

function PremiumStatus(props: Props) {
    let [highestPriorityProduct, setHighestPriorityProduct] = useState<PremiumProduct>()
    let [productsToShow, setProductsToShow] = useState<PremiumProductWithtimeDifference[]>()
    let [showCancelSubscriptionDialogSubscription, setShowCancelSubscriptionDialogSubscription] = useState<PremiumSubscription>()
    let [reactivatingExternalId, setReactivatingExternalId] = useState<string | null>(null)

    // Get Google token for authentication
    const googleToken = typeof window !== 'undefined' 
        ? (sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? '') 
        : ''

    const reactivateMutation = usePutApiPremiumSubscriptionExternalIdReactivate({
        fetch: googleToken ? { headers: { GoogleToken: googleToken } } : undefined,
        mutation: {
            onSuccess: (response) => {
                // The generated API returns an object like { data, status, headers }.
                // New backend behavior: PayPal-specific error is a 400 with a message containing
                // "Updating PayPal subscriptions via API is not currently supporte".
                // Treat that case specially. For 500 errors, instruct the user to contact support.
                try {
                    if (!response) {
                        toast.error('Resuming failed. Please try again later.')
                    } else {
                        const status = (response as any).status
                        const data = (response as any).data

                        const paypalMessage = 'Updating PayPal subscriptions via API is not currently supporte'

                        // Check data for the paypal message (data can be string or object)
                        let containsPaypal = false
                        if (typeof data === 'string') containsPaypal = data.includes(paypalMessage)
                        else if (data && typeof data === 'object') {
                            try {
                                const serialized = JSON.stringify(data)
                                containsPaypal = serialized.includes(paypalMessage)
                            } catch (e) {
                                containsPaypal = false
                            }
                        }

                        if (status === 400 && containsPaypal) {
                            toast.error('Resuming failed: PayPal subscriptions cannot be resumed via our API. Please manage the subscription via PayPal or contact support for assistance.')
                        } else if (status === 500) {
                            toast.error('Resuming failed due to a server error. Please contact support.')
                        } else if (status >= 400) {
                            toast.error('Failed to reactivate subscription. Please try again.')
                        } else {
                            toast.success('Subscription reactivated successfully!')
                            // Reload the page to refresh subscription data
                            window.location.reload()
                        }
                    }
                } catch (e) {
                    toast.error('Failed to reactivate subscription. Please try again.')
                }

                setReactivatingExternalId(null)
            },
            onError: (err) => {
                // Fallback for network/throw errors
                toast.error('Failed to reactivate subscription. Please try again.')
                setReactivatingExternalId(null)
            }
        }
    })

    useEffect(() => {
        let products = props.products
            .map(product => {
                return {
                    ...product,
                    timeDifference: 0
                }
            })
            .sort((a, b) => getPremiumType(b)?.priority - getPremiumType(a)?.priority)

        // Hide lower tier products that are most likely bought automatically together (<1min time difference)
        if (products.length > 1) {
            for (let i = 1; i < products.length; i++) {
                const diff = Math.abs(products[i - 1].expires.getTime() - products[i].expires.getTime())
                if (diff < 60000) {
                    if (getPremiumType(products[i - 1])?.priority > getPremiumType(products[i])?.priority) {
                        products.splice(i, 1)
                    } else {
                        products.splice(i - 1, 1)
                    }
                    i = 0
                } else products[i].timeDifference = diff
            }
        }

        products = products.filter(product => product.expires > new Date())
        setProductsToShow(products)
        setHighestPriorityProduct(getHighestPriorityPremiumProduct(props.products))
    }, [props.products])

    function getProductListEntry(product: PremiumProductWithtimeDifference) {
        return (
            <>
                <span>{getPremiumType(product)?.label}</span>
                <Tooltip
                    type="hover"
                    content={
                        <span>
                            {' '}
                            (ends {moment(product.expires).fromNow()}
                            {product.timeDifference > 0 ? (
                                <>
                                    , <span className={styles.timeDifference}>{moment.duration(product.timeDifference).humanize()}</span> after
                                </>
                            ) : null}
                            )
                        </span>
                    }
                    tooltipContent={<span>At {getLocalDateAndTime(product.expires)}</span>}
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
                        {props.hasLoadingError === true ? (
                            'Premium Status could not be loaded'
                        ) : (
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
                                        {subscription.endsAt && (
                                            <Tooltip
                                                type="hover"
                                                content={
                                                    <span style={{ color: 'green' }}>
                                                        <RestartAlt
                                                            style={{ cursor: 'pointer', color: 'green', marginLeft: 5 }}
                                                            onClick={() => {
                                                                setReactivatingExternalId(subscription.externalId)
                                                                reactivateMutation.mutate({ externalId: subscription.externalId })
                                                            }}
                                                        />
                                                    </span>
                                                }
                                                tooltipContent={<span>Reactivate subscription</span>}
                                            />
                                        )}
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
                        )}
                    </div>
                ) : (
                    <p>
                        {' '}
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        {props.hasLoadingError === true ? (
                            'Premium Status could not be loaded'
                        ) : (
                            <>
                                {highestPriorityProduct ? getProductListEntry({ ...highestPriorityProduct } as PremiumProductWithtimeDifference) : 'No Premium'}
                            </>
                        )}
                    </p>
                )}
            </div>
            <CancelSubscriptionFeedbackDialog
                show={!!showCancelSubscriptionDialogSubscription}
                onCancel={() => {
                    if (showCancelSubscriptionDialogSubscription) {
                        props.onSubscriptionCancel(showCancelSubscriptionDialogSubscription)
                        setShowCancelSubscriptionDialogSubscription(undefined)
                    }
                }}
                onClose={() => {
                    setShowCancelSubscriptionDialogSubscription(undefined)
                }}
            />
        </>
    )
}

export default PremiumStatus
