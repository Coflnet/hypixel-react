import React, { useEffect, useState } from 'react'
import { Badge, Button, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d'
import { getLoadingElement } from '../../utils/LoadingUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter'
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils'
import { toast } from 'react-toastify'
import { Delete as DeleteIcon, Undo as UndoIcon } from '@material-ui/icons'
import Link from 'next/link'
import styles from './SubscriptionList.module.css'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'

interface Props {}

let mounted = true
let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn()

function SubscriptionList(props: Props) {
    let [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    let [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        mounted = true
    })

    useEffect(() => {
        return () => {
            mounted = false
        }
    }, [])

    function loadSubscriptions() {
        api.getSubscriptions().then(subscriptions => {
            if (!mounted) {
                return
            }
            let promises: Promise<void>[] = []
            subscriptions.forEach(subscription => {
                promises.push(getSubscriptionTitle(subscription))
            })

            Promise.all(promises).then(() => {
                setSubscriptions(subscriptions)
            })
        })
    }

    function onLogin() {
        let googleId = localStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            loadSubscriptions()
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        wasAlreadyLoggedInGoogle = false
    }
    function getSubTypesAsList(subTypes: SubscriptionType[], price: number): JSX.Element {
        return (
            <ul>
                {subTypes.map(subType => {
                    let result
                    switch (SubscriptionType[subType].toString()) {
                        case SubscriptionType.BIN.toString():
                            result = <li key="1">Notify only for instant buy</li>
                            break
                        case SubscriptionType.PRICE_HIGHER_THAN.toString():
                            result =
                                price > 0 ? (
                                    <li key="2">
                                        Notify if price is higher than <b>{numberWithThousandsSeperators(price)} Coins</b>
                                    </li>
                                ) : (
                                    <li key="2">Any price</li>
                                )
                            break
                        case SubscriptionType.PRICE_LOWER_THAN.toString():
                            result = (
                                <li key="3">
                                    Notify if price is lower than <b>{numberWithThousandsSeperators(price)} Coins</b>
                                </li>
                            )
                            break
                        case SubscriptionType.OUTBID.toString():
                            result = <li key="4">Notify if player outbid something</li>
                            break
                        case SubscriptionType.SOLD.toString():
                            result = <li key="5">Notify if player sold something</li>
                            break
                    }
                    return result
                })}
            </ul>
        )
    }
    function onDelete(subscription: Subscription) {
        api.unsubscribe(subscription).then(n => {
            if (n === 0) {
                return
            }
            let subs = subscriptions.filter(s => s !== subscription)
            setSubscriptions(subs)
            subscriptions = subs

            toast.success(
                <span>
                    Notifier deleted{' '}
                    <Button
                        style={{ float: 'right', marginRight: '5px' }}
                        variant="info"
                        onClick={() => {
                            resubscribe(subscription)
                        }}
                    >
                        <UndoIcon /> Undo
                    </Button>
                </span>
            )
        })
    }

    function resubscribe(subscription: Subscription) {
        api.subscribe(subscription.topicId, subscription.types, subscription.price, subscription.filter).then(() => {
            loadSubscriptions()
        })
    }

    function getSubscriptionTitle(subscription: Subscription): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (subscription.type) {
                case 'item':
                    subscription.title = convertTagToName(subscription.topicId)
                    resolve()
                    break
                case 'player':
                    api.getPlayerName(subscription.topicId).then(playerName => {
                        subscription.title = playerName
                        resolve()
                    })
                    break
                case 'auction':
                    api.getAuctionDetails(subscription.topicId).then(auctionDetails => {
                        subscription.title = auctionDetails.auction.item.name || auctionDetails.auction.item.tag
                        resolve()
                    })
                    break
                default:
                    subscription.title = subscription.topicId
                    resolve()
                    break
            }
        })
    }

    function getSubscriptionTitleElement(subscription: Subscription) {
        switch (subscription.type) {
            case 'item':
                return (
                    <Link href={'/item/' + subscription.topicId}>
                        <a className="disableLinkStyle">{subscription.title}</a>
                    </Link>
                )
            case 'player':
                return (
                    <Link href={'/player/' + subscription.topicId}>
                        <a className="disableLinkStyle">{subscription.title}</a>
                    </Link>
                )
            case 'auction':
                return (
                    <Link href={'/auction/' + subscription.topicId}>
                        <a className="disableLinkStyle">{subscription.title}</a>
                    </Link>
                )
            default:
                return subscription.title
        }
    }

    let subscriptionsTableBody = subscriptions.map((subscription, i) => (
        <ListGroup.Item key={i}>
            <h5>
                <Badge style={{ marginRight: '5px' }} variant="primary">
                    {i + 1}
                </Badge>
                {getSubscriptionTitleElement(subscription)}
            </h5>
            {getSubTypesAsList(subscription.types, subscription.price)}
            {subscription.filter ? <hr /> : null}
            <ItemFilterPropertiesDisplay filter={subscription.filter} />
            <div
                style={{ position: 'absolute', top: '0.75rem', right: '1.25rem', cursor: 'pointer' }}
                onClick={() => {
                    onDelete(subscription)
                }}
            >
                <DeleteIcon color="error" />
            </div>
        </ListGroup.Item>
    ))

    return (
        <div className={styles.subscriptionList}>
            {isLoggedIn ? (
                subscriptions.length > 0 ? (
                    <ListGroup style={{ marginTop: '20px' }}>{subscriptionsTableBody}</ListGroup>
                ) : (
                    <p>You dont have any notifiers</p>
                )
            ) : (
                ''
            )}
            {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ''}
            {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>To use subscriptions please login with Google:</p> : ''}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
        </div>
    )
}

export default SubscriptionList
