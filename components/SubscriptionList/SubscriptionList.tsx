'use client'
import DeleteIcon from '@mui/icons-material/Delete'
import UndoIcon from '@mui/icons-material/Undo'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Button, ListGroup, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { NotificationListener, SubscriptionType } from '../../api/ApiTypes.d'
import { convertTagToName } from '../../utils/Formatter'
import { useForceUpdate, useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import { Number } from '../Number/Number'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import styles from './SubscriptionList.module.css'
import NotificationTargets from '../NotificationTargets/NotificationTargets'
import { Typeahead } from 'react-bootstrap-typeahead'

let mounted = true

function SubscriptionList() {
    let [listener, setListener] = useState<NotificationListener[]>([])
    let [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([])
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [showDeleteAllSubscriptionDialog, setShowDeleteAllSubscriptionDialog] = useState(false)
    let [showNotificationTargets, setShowNotificationTargets] = useState(false)
    let [isLoading, setIsLoading] = useState(false)
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
        return api.getNotificationListener().then(subscriptions => {
            if (!mounted) {
                return
            }

            subscriptions.forEach((subscription, i) => {
                getSubscriptionTitle(subscription).then(title => {
                    let newSubscriptions = subscriptions
                    newSubscriptions[i].title = title
                    setListener(newSubscriptions)
                    forceUpdate()
                })
            })
            setListener(subscriptions)
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

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            setIsLoading(true)
            Promise.all([loadListener(), loadSubscriptions()]).then(() => {
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
                                <li key="3">
                                    Notify if price is lower than{' '}
                                    <b>
                                        <Number number={price} /> Coins
                                    </b>
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
            let subs = listener.filter(s => s !== notificationListener)
            listener = subs
            setListener(subs)

            toast.success(
                <span>
                    Notifier deleted{' '}
                    <Button
                        style={{ float: 'right', marginRight: '5px' }}
                        variant="info"
                        onClick={() => {
                            resubscribe(notificationListener, subscriptionToDelete!)
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
                toast.success('All notifiers were sucessfully removed')
            })
            .catch(() => {
                toast.error('Could not unsubscribe, please try again in a few minutes')
            })

        subscriptions.forEach(subscription => {
            api.deleteNotificationSubscription({ ...subscription, sourceSubIdRegex: 't' })
        })
        setShowDeleteAllSubscriptionDialog(false)
    }

    function resubscribe(listener: NotificationListener, subscription: NotificationSubscription) {
        let promises = [
            api.subscribe(listener.topicId, listener.types, subscription.targets as any, listener.price, listener.filter),
            api.createNotificationSubscription(subscription)
        ]

        Promise.all(promises).then(() => {
            setIsLoading(true)
            Promise.all([loadListener(), loadSubscriptions()]).then(() => {
                setIsLoading(false)
            })
        })
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
            Promise.all([loadListener(), loadSubscriptions()]).then(() => {
                setIsLoading(false)
            })
        })
    }

    function getSubscriptionTitle(subscription: NotificationListener): Promise<string> {
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
                        {subscription.sourceType}
                    </h5>
                    <p>SourceSubIdRegex: {subscription.sourceSubIdRegex}</p>
                    <div style={{ float: 'right' }}>
                        <p>Notification Targets: {subscription.targets.length > 0 ? null : 'None'}</p>
                        {subscriptions.length > 0 ? (
                            <Typeahead
                                disabled
                                id={`notificationTargetsTypeahead-${subscription.id}`}
                                multiple
                                labelKey={'name'}
                                defaultSelected={subscription.targets}
                                options={subscription.targets ? subscription.targets : []}
                            />
                        ) : null}
                    </div>
                    <div style={{ position: 'absolute', top: '0.75rem', right: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'end' }}>
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
                    <div style={{ float: 'right' }}>
                        <p>Notification Targets: {subscription.targets.length > 0 ? null : 'None'}</p>
                        {subscriptions.length > 0 ? (
                            <Typeahead
                                disabled
                                id={`notificationTargetsTypeahead-${subscription.id}`}
                                multiple
                                labelKey={'name'}
                                defaultSelected={subscription.targets}
                                options={subscription.targets ? subscription.targets : []}
                            />
                        ) : null}
                    </div>
                    <div style={{ position: 'absolute', top: '0.75rem', right: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'end' }}>
                        <SubscribeButton
                            topic={listener.topicId}
                            type={listener.type}
                            isEditButton={true}
                            onAfterSubscribe={() => {
                                onAfterSubscribeEdit(listener)
                            }}
                            prefill={{
                                listener: listener,
                                targetNames: subscription.id && subscription.targets.length > 0 ? subscription.targets.map(t => t.name) : []
                            }}
                            popupTitle="Update Notifier"
                            popupButtonText="Update"
                            successMessage="Notifier successfully updated"
                        />
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
                <Modal.Title>Notification Targets</Modal.Title>
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
                        <div style={{ height: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowNotificationTargets(true)
                                }}
                            >
                                Notification Targets
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowDeleteAllSubscriptionDialog(true)
                                }}
                                disabled={listener.length === 0}
                            >
                                Delete all notifiers
                            </Button>
                        </div>
                        {listener.length > 0 ? (
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
            {resetSettingsElement}
            {notificationTargetsElement}
        </div>
    )
}

export default SubscriptionList
