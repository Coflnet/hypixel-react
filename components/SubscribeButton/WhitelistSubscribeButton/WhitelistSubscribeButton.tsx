'use client'
import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { toast } from 'react-toastify'
import NotificationIcon from '@mui/icons-material/NotificationsOutlined'
import styles from '../SubscribeButton.module.css'
import { useRouter } from 'next/navigation'
import { Typeahead } from 'react-bootstrap-typeahead'
import { SubscriptionType } from '../../../api/ApiTypes.d'
import { useWasAlreadyLoggedIn } from '../../../utils/Hooks'
import api from '../../../api/ApiHelper'
import CreateTargetDialog from '../CreateTargetDialog/CreateTargetDialog'
import GoogleSignIn from '../../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import Link from 'next/link'

interface Props {
    onAfterSubscribe?(): void
}

function WhitelistSubscribeButton(props: Props) {
    let { trackEvent } = useMatomo()
    let router = useRouter()
    let [showDialog, setShowDialog] = useState(false)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    let [notificationTargets, setNotificationTargets] = useState<NotificationTarget[]>([])
    let [selectedNotificationTargets, setSelectedNotificationTargets] = useState<NotificationTarget[]>([])
    let [isLoadingNotificationTargets, setIsLoadingNotificationTargets] = useState(false)
    let [showCreateTargetDialog, setShowCreateTargetDialog] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let [isPremiumLoading, setIsPremiumLoading] = useState(false)

    async function onSubscribe() {
        if (!hasPremium) {
            toast.error('Premium access required to create whitelist notifiers')
            return
        }

        trackEvent({ action: 'subscribed', category: 'subscriptions' })
        setShowDialog(false)

        api.subscribe("whitelist", [SubscriptionType.WHITELIST], selectedNotificationTargets, undefined, undefined)
            .then(() => {
                toast.success('Notifier successfully created!', {
                    onClick: () => {
                        router.push('/subscriptions')
                    }
                })
                if (props.onAfterSubscribe) {
                    props.onAfterSubscribe()
                }
            })
            .catch(error => {
                toast.error(error.message, {
                    onClick: () => {
                        router.push('/subscriptions')
                    }
                })
            })
    }

    function onLogin() {
        setIsLoggedIn(true)
        setIsLoadingNotificationTargets(true)
        setIsPremiumLoading(true)
        Promise.all([
            api.getNotificationTargets(),
            api.refreshLoadPremiumProducts(products => {
                setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
            })
        ]).then(([targets]) => {
            setNotificationTargets(targets)
            setIsLoadingNotificationTargets(false)
            setIsPremiumLoading(false)
        })
    }

    function closeDialog() {
        trackEvent({ action: 'whitelist subscription dialog closed', category: 'subscriptions' })
        setShowDialog(false)
    }

    function openDialog() {
        trackEvent({ action: 'whitelist subscription dialog opened', category: 'subscriptions' })
        setShowDialog(true)
    }

    let dialog = (
        <Modal show={showDialog} onHide={closeDialog} className={styles.subscribeDialog}>
            <Modal.Header closeButton>
                <Modal.Title>Create a Whitelist Notifier</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isLoggedIn ? (
                    isPremiumLoading ? (
                        getLoadingElement()
                    ) : hasPremium ? (
                        <div>
                            <p>
                                Creating this will send a notification to the selected target whenever a new auction matching your whitelist from <Link href="https://sky.colfnet.com/flipper">Auction flipper</Link> is created.
                            </p>
                            <label htmlFor="notificationTargetsTypeahead">Targets: </label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Typeahead
                                    id="notificationTargetsTypeahead"
                                    className={styles.multiSearch}
                                    isLoading={isLoadingNotificationTargets}
                                    labelKey="name"
                                    style={{ flex: 1 }}
                                    options={notificationTargets}
                                    placeholder={'Select targets...'}
                                    selected={selectedNotificationTargets}
                                    onChange={selected => {
                                        setSelectedNotificationTargets(selected as NotificationTarget[])
                                    }}
                                    multiple={true}
                                />
                                <Button
                                    onClick={() => {
                                        setShowCreateTargetDialog(true)
                                    }}
                                    variant='secondary'
                                >
                                    Create new target
                                </Button>
                            </div>
                            <Button onClick={onSubscribe} className={styles.notifyButton}>
                                Notify me
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                                <h5 style={{ color: 'var(--bs-warning)', marginBottom: '10px' }}>Premium Feature</h5>
                                <p style={{  marginBottom: '15px' }}>
                                    Whitelist notifiers require at least Premium access.
                                </p>
                                <p style={{  marginBottom: '15px' }}>
                                    Click the notification icon to open this dialog again after purchasing premium.
                                </p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                                <Link href="/premium?tier=premium">
                                    <Button variant="warning">Get Premium</Button>
                                </Link>
                            </div>
                        </div>
                    )
                ) : (
                    <p>To use notifiers, please login with Google: </p>
                )}
                <GoogleSignIn onAfterLogin={onLogin} />
                {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            </Modal.Body>
        </Modal>
    )

    function onTargetCreated(target: NotificationTarget) {
        setSelectedNotificationTargets([...selectedNotificationTargets, target])
        setNotificationTargets([...notificationTargets, target])
    }

    return (
        <div className={styles.subscribeButton}>
            {dialog}
            <CreateTargetDialog
                show={showCreateTargetDialog}
                onHide={() => setShowCreateTargetDialog(false)}
                onTargetCreated={onTargetCreated}
            />
            <Button style={{ width: 'max-content' }} onClick={openDialog}>
                <NotificationIcon />
                Create Whitelist Notifier
            </Button>
        </div>
    )
}

export default WhitelistSubscribeButton
