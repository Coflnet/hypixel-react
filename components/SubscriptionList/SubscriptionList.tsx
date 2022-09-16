import React, { useEffect, useState } from 'react'
import { Badge, Button, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d'
import { getLoadingElement } from '../../utils/LoadingUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter'
import { toast } from 'react-toastify'
import { Delete as DeleteIcon, Undo as UndoIcon } from '@mui/icons-material'
import Link from 'next/link'
import styles from './SubscriptionList.module.css'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { useForceUpdate } from '../../utils/Hooks'

let mounted = true

function SubscriptionList() {
    let [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    let forceUpdate = useForceUpdate()

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

            subscriptions.forEach((subscription, i) => {
                getSubscriptionTitle(subscription).then(title => {
                    let newSubscriptions = subscriptions
                    newSubscriptions[i].title = title
                    setSubscriptions(newSubscriptions)
                    forceUpdate()
                })
            })

            setSubscriptions(subscriptions)
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
                        case SubscriptionType.PLAYER_CREATES_AUCTION.toString():
                            result = <li key="5">Notify if player creates an auction</li>
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
            subscriptions = subs
            setSubscriptions(subs)

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

    function deleteAll() {
        api.unsubscribeAll()
            .then(() => {
                setSubscriptions([])
                toast.success('All subscriptions were sucessfully removed')
            })
            .catch(() => {
                toast.error('An unexpected error occured')
            })
    }

    function resubscribe(subscription: Subscription) {
        api.subscribe(subscription.topicId, subscription.types, subscription.price, subscription.filter).then(() => {
            loadSubscriptions()
        })
    }

    function getSubscriptionTitle(subscription: Subscription): Promise<string> {
        return new Promise((resolve, reject) => {
            switch (subscription.type) {
                case 'item':
                    resolve(convertTagToName(subscription.topicId))
                    break
                case 'player':
                    api.getPlayerName(subscription.topicId)
                        .then(playerName => {
                            resolve(playerName)
                        })
                        .catch(() => {
                            resolve('Player could not be loaded...')
                        })
                    break
                case 'auction':
                    api.getAuctionDetails(subscription.topicId)
                        .then(auctionDetails => {
                            resolve(auctionDetails.auction.item.name || auctionDetails.auction.item.tag)
                        })
                        .catch(() => {
                            resolve('Auction title could not be loaded...')
                        })
                    break
                default:
                    resolve(subscription.topicId)
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
                    <>
                        <div style={{ height: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button style={{ backgroundColor: 'red', float: 'right' }} onClick={deleteAll}>
                                Delete all subscriptions
                            </Button>
                        </div>
                        <ListGroup style={{ marginTop: '20px' }}>{subscriptionsTableBody}</ListGroup>
                    </>
                ) : (
                    <p>You dont have any notifiers</p>
                )
            ) : (
                ''
            )}
            {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            {!wasAlreadyLoggedIn && !isLoggedIn ? <p>To use subscriptions please login with Google:</p> : ''}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
        </div>
    )
}

export default SubscriptionList
