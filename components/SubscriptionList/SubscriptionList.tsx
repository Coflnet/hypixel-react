'use client'
import DeleteIcon from '@mui/icons-material/Delete'
import UndoIcon from '@mui/icons-material/Undo'
import Link from 'next/link'
import { useEffect, useState, type JSX } from 'react'
import { Badge, Button, ListGroup, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { NotificationListener, SubscriptionType } from '../../api/ApiTypes.d'
import { convertTagToName } from '../../utils/Formatter'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import Number from '../Number/Number'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import styles from './SubscriptionList.module.css'
import NotificationTargets from '../NotificationTargets/NotificationTargets'
import ChannelChips from './ChannelChips'
import NewNotifierButton from './NewNotifierButton'
import WhitelistSubscribeButton from '../SubscribeButton/WhitelistSubscribeButton/WhitelistSubscribeButton'

let mounted = true

function SubscriptionList() {
    let [listener, setListener] = useState<NotificationListener[]>([])
    let [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([])
    let [allTargets, setAllTargets] = useState<NotificationTarget[]>([])
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasStarterPremium, setHasStarterPremium] = useState(false)
    let [showDeleteAllSubscriptionDialog, setShowDeleteAllSubscriptionDialog] = useState(false)
    let [showNotificationTargets, setShowNotificationTargets] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    useEffect(() => {
        mounted = true
    })

    useEffect(() => {
        return () => {
            mounted = false
        }
    }, [])

    let subscriptionsToListenerMap = getListenerToTargetsMap()

    function getListenerToTargetsMap() {
        if (!listener) {
            return {}
        }
        let map: {
            [key: number]: NotificationListener | undefined
        } = {}

        subscriptions.forEach(s => {
            if (s.sourceType === 'Subscription' && s.id !== undefined) {
                map[s.id] = listener.find(l => l.id?.toString() === s.sourceSubIdRegex)
            }
        })
        return map
    }

    function loadListener() {
        return new Promise((resolve, reject) => {
            api.getNotificationListener().then(listeners => {
                if (!mounted) {
                    resolve(null)
                    return
                }

                let newListeners = [...listeners]

                let promises: Promise<void>[] = []
                newListeners.forEach((listener, i) => {
                    let p = getSubscriptionTitle(listener).then(title => {
                        newListeners[i].title = title
                    })
                    promises.push(p)
                })
                Promise.all(promises)
                    .then(() => {
                        setListener(newListeners)
                        resolve(null)
                    })
                    .catch(() => {
                        reject()
                    })
            })
        })
    }

    function loadSubscriptions() {
        return api.getNotificationSubscriptions().then(subscriptions => {
            if (!mounted) {
                return
            }
            setSubscriptions(subscriptions)
        })
    }

    function loadTargets() {
        return api.getNotificationTargets().then(targets => {
            if (!mounted) {
                return
            }
            setAllTargets(targets)
        })
    }

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            setIsLoading(true)
            api.refreshLoadPremiumProducts(
                products => {
                    setHasStarterPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
                },
                () => {
                    setHasStarterPremium(false)
                }
            )
            Promise.all([loadListener(), loadSubscriptions(), loadTargets()]).then(() => {
                setIsLoading(false)
            })
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
    }

    function getSubTypesAsList(subTypes: SubscriptionType[], price: number): JSX.Element {
        return (
            <ul>
                {subTypes.map((subType, i) => {
                    let result
                    switch (SubscriptionType[subType].toString()) {
                        case SubscriptionType.BIN.toString():
                            result = <li key={i}>Notify only for instant buy</li>
                            break
                        case SubscriptionType.PRICE_HIGHER_THAN.toString():
                            result =
                                price > 0 ? (
                                    <li key={i}>
                                        Notify if price is higher than{' '}
                                        <b>
                                            <Number number={price} /> Coins
                                        </b>
                                    </li>
                                ) : (
                                    <li key="2">Any price</li>
                                )
                            break
                        case SubscriptionType.PRICE_LOWER_THAN.toString():
                            result = (
                                <li key={i}>
                                    Notify if price is lower than{' '}
                                    <b>
                                        <Number number={price} /> Coins
                                    </b>
                                </li>
                            )
                            break
                        case SubscriptionType.OUTBID.toString():
                            result = <li key={i}>Notify if player outbid something</li>
                            break
                        case SubscriptionType.SOLD.toString():
                            result = <li key={i}>Notify if player sold something</li>
                            break
                        case SubscriptionType.PLAYER_CREATES_AUCTION.toString():
                            result = <li key={i}>Notify if player creates an auction</li>
                            break
                        case SubscriptionType.BOUGHT_ANY_AUCTION.toString():
                            result = <li key={i}>Notify if player bought any auction</li>
                            break
                        case SubscriptionType.USE_SELL_NOT_BUY.toString():
                            result = <li key={i}>Use sell price instead of buy price</li>
                            break
                        case SubscriptionType.WHITELIST.toString():
                            result = <li key={i}>Notify if something on your whitelist matches</li>
                            break
                    }
                    return result
                })}
            </ul>
        )
    }
    function onDelete(notificationListener: NotificationListener) {
        if (!notificationListener.id) {
            toast.error('Could not delete notifier, no id available...')
            return
        }

        let subscriptionToDelete = subscriptions.find(s => s.sourceSubIdRegex === notificationListener.id!.toString())

        Promise.all([
            subscriptionToDelete ? api.deleteNotificationSubscription(subscriptionToDelete) : Promise.resolve(),
            api.unsubscribe(notificationListener)
        ]).then(() => {
            let newListeners = listener.filter(s => s !== notificationListener)
            listener = newListeners
            setListener(newListeners)

            if (subscriptionToDelete) {
                let newSubscriptions = subscriptions.filter(s => s.id !== subscriptionToDelete?.id)
                subscriptions = newSubscriptions
                setSubscriptions(newSubscriptions)
            }

            toast.success(
                <span>
                    Notifier deleted{' '}
                    <Button
                        style={{ float: 'right', marginRight: '5px' }}
                        variant="info"
                        onClick={() => {
                            resubscribe(notificationListener, subscriptionToDelete!)
                            toast.dismiss()
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
                setListener([])
                setSubscriptions([])
                toast.success('All notifiers were sucessfully removed')
            })
            .catch(() => {
                toast.error('Could not unsubscribe, please try again in a few minutes')
            })

        subscriptions.forEach(subscription => {
            api.deleteNotificationSubscription({ ...subscription })
        })
        setShowDeleteAllSubscriptionDialog(false)
    }

    async function resubscribe(listener: NotificationListener, subscription: NotificationSubscription) {
        setIsLoading(true)
        await api.subscribe(listener.topicId, listener.types, subscription.targets as any, listener.price, listener.filter)

        await Promise.all([loadListener(), loadSubscriptions()])
        setIsLoading(false)
    }

    function onAfterSubscribeEdit(oldSubscription: NotificationListener) {
        let subscriptionToDelete = subscriptions.find(s => s.sourceSubIdRegex === oldSubscription.id!.toString())

        Promise.all([
            subscriptionToDelete ? api.deleteNotificationSubscription(subscriptionToDelete) : Promise.resolve(),
            api.unsubscribe(oldSubscription)
        ]).then(() => {
            setListener([])
            setSubscriptions([])

            setIsLoading(true)
            Promise.all([loadListener(), loadSubscriptions(), loadTargets()]).then(() => {
                setIsLoading(false)
            })
        })
    }

    function getSubscriptionTitle(subscription: NotificationListener): Promise<string> {
        return new Promise((resolve, reject) => {
            switch (subscription.type) {
                case 'whitelist':
                    resolve('Whitelist Notification')
                    break
                case 'item':
                case 'bazaar':
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
                        .then(result => {
                            let auctionDetails = result.parsed
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

    function getSubscriptionTitleElement(subscription: NotificationListener) {
        switch (subscription.type) {
            case 'item':
            case 'bazaar':
                return (
                    <Link href={'/item/' + subscription.topicId} className="disableLinkStyle">
                        {subscription.title}
                    </Link>
                )
            case 'player':
                return (
                    <Link href={'/player/' + subscription.topicId} className="disableLinkStyle">
                        {subscription.title}
                    </Link>
                )
            case 'auction':
                return (
                    <Link href={'/auction/' + subscription.topicId} className="disableLinkStyle">
                        {subscription.title}
                    </Link>
                )
            default:
                return subscription.title
        }
    }

    let subscriptionsTableBody = subscriptions.map((subscription, i) => {
        let listener
        if (subscription.id) {
            listener = subscriptionsToListenerMap[subscription.id?.toString()]
        }
        // Show a generic entry for subscription without a listener
        if (!listener) {
            return (
                <ListGroup.Item key={i}>
                    <h5>
                        <Badge style={{ marginRight: '5px' }} bg="primary">
                            {i + 1}
                        </Badge>
                        Legacy notifier
                    </h5>
                    <ChannelChips subscription={subscription} allTargets={allTargets} />
                    <div style={{ position: 'absolute', top: '0.75rem', right: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'end' }}>
                        <DeleteIcon
                            color="error"
                            onClick={async () => {
                                await api.deleteNotificationSubscription(subscription)
                                toast.success('Subscription deleted')
                                setIsLoading(true)
                                await Promise.all([loadListener(), loadSubscriptions(), loadTargets()])
                                setIsLoading(false)
                            }}
                        />
                    </div>
                </ListGroup.Item>
            )
        }

        // Show normal entry for subscriptions with a listener
        if (listener) {
            return (
                <ListGroup.Item key={i}>
                    <h5>
                        <Badge style={{ marginRight: '5px' }} bg="primary">
                            {i + 1}
                        </Badge>
                        {getSubscriptionTitleElement(listener)}
                    </h5>
                    {getSubTypesAsList(listener.types, listener.price)}
                    {listener.filter ? <hr /> : null}
                    <ItemFilterPropertiesDisplay filter={listener.filter} />
                    <ChannelChips subscription={subscription} allTargets={allTargets} />
                    <div style={{ position: 'absolute', top: '0.75rem', right: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'end' }}>
                        {listener.type === 'whitelist' ? null : (
                            <SubscribeButton
                                topic={listener.topicId}
                                type={listener.type}
                                isEditButton={true}
                                onAfterSubscribe={() => {
                                    onAfterSubscribeEdit(listener)
                                }}
                                prefill={{
                                    listener: listener,
                                    targetIds: subscription.id && subscription.targets.length > 0 ? subscription.targets.map(t => t.id) : []
                                }}
                                popupTitle="Update Notifier"
                                popupButtonText="Update"
                                successMessage="Notifier successfully updated"
                            />)}
                        <DeleteIcon
                            color="error"
                            onClick={() => {
                                onDelete(listener)
                            }}
                        />
                    </div>
                </ListGroup.Item>
            )
        }
    })

    let resetSettingsElement = (
        <Modal
            show={showDeleteAllSubscriptionDialog}
            onHide={() => {
                setShowDeleteAllSubscriptionDialog(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete all your notifiers?</p>
                <p>
                    <b>All {listener.length} notifier will be deleted!</b>
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="danger" style={{ width: '45%' }} onClick={deleteAll}>
                        RESET <DeleteIcon />
                    </Button>
                    <Button
                        style={{ width: '45%' }}
                        onClick={() => {
                            setShowDeleteAllSubscriptionDialog(false)
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    )

    let notificationTargetsElement = (
        <Modal
            show={showNotificationTargets}
            size="lg"
            onHide={() => {
                setShowNotificationTargets(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Channels</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <NotificationTargets />
            </Modal.Body>
        </Modal>
    )

    return (
        <div className={styles.subscriptionList}>
            {isLoggedIn ? (
                isLoading ? (
                    getLoadingElement()
                ) : (
                    <>
                        <div style={{ height: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                            <NewNotifierButton
                                onAfterSubscribe={() => {
                                    setIsLoading(true)
                                    Promise.all([loadListener(), loadSubscriptions(), loadTargets()]).then(() => {
                                        setIsLoading(false)
                                    })
                                }}
                            />
                            <WhitelistSubscribeButton onAfterSubscribe={() => {
                                setIsLoading(true);
                                Promise.all([loadListener(), loadSubscriptions(), loadTargets()]).then(() => {
                                    setIsLoading(false);
                                });
                            }} />
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowNotificationTargets(true)
                                }}
                            >
                                Channels
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowDeleteAllSubscriptionDialog(true)
                                }}
                                disabled={subscriptions.length === 0}
                            >
                                Delete all notifiers
                            </Button>
                        </div>
                        {subscriptions.length > 0 ? (
                            <>
                                <ListGroup style={{ marginTop: '20px' }}>{subscriptionsTableBody}</ListGroup>
                            </>
                        ) : (
                            <p>You dont have any notifiers</p>
                        )}
                    </>
                )
            ) : null}
            {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            {!wasAlreadyLoggedIn && !isLoggedIn ? <p>To use subscriptions, please login with Google:</p> : ''}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            {subscriptions.length >= 3 && !hasStarterPremium ? (
                <div className="alert alert-info d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ marginTop: '20px' }}>
                    <span>
                        <strong>Want more notifiers?</strong> You have reached the free limit of 3. Unlock more notifiers with{' '}
                        <strong>Starter Premium</strong> for under <strong>2€/month</strong>.
                    </span>
                    <Link href="/premium" className="btn btn-primary" style={{ flexShrink: 0 }}>
                        Upgrade Now
                    </Link>
                </div>
            ) : null}

            {resetSettingsElement}
            {notificationTargetsElement}

            <div>
                <h3>What are Notifiers?</h3>
                <p>
                    Notifiers alert you about events on Skyblock — the most common are price drops or jumps, auctions expiring or being sold, and new rare items
                    being listed on the auction house.
                </p>
                <p>
                    Use <b>New notifier</b> above to search for an item or player, or press the <b>Notify</b> button on any item, player or auction page. Choose{' '}
                    <b>where</b> you want to be notified — in-game, on this device, or a Discord server — under <b>Channels</b>.
                </p>
            </div>
        </div>
    )
}

export default SubscriptionList
