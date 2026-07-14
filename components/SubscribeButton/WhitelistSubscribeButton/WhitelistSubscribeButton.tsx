'use client'
import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { toast } from 'react-toastify'
import NotificationIcon from '@mui/icons-material/NotificationsOutlined'
import styles from '../SubscribeButton.module.css'
import { useRouter } from 'next/navigation'
import { SubscriptionType } from '../../../api/ApiTypes.d'
import { useWasAlreadyLoggedIn } from '../../../utils/Hooks'
import api from '../../../api/ApiHelper'
import GoogleSignIn from '../../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../../utils/PremiumTypeUtils'
import Link from 'next/link'
import ChannelPicker from '../ChannelPicker/ChannelPicker'
import {
    ChannelSelection,
    getInitialChannelSelection,
    isChannelSelectionValid,
    rememberChannelSelection,
    resolveChannelSelection
} from '../../../utils/NotificationChannelUtils'

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
    let [channelSelection, setChannelSelection] = useState<ChannelSelection>({ inGame: true, push: false, newDiscordUrl: null, existingTargetIds: [] })
    let [isLoadingNotificationTargets, setIsLoadingNotificationTargets] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let [isPremiumLoading, setIsPremiumLoading] = useState(false)
    let [isSubmitting, setIsSubmitting] = useState(false)

    async function onSubscribe() {
        if (!hasPremium) {
            toast.error('Premium access required to create whitelist notifiers')
            return
        }

        trackEvent({ action: 'subscribed', category: 'subscriptions' })

        setIsSubmitting(true)
        let resolvedTargets: NotificationTarget[]
        try {
            resolvedTargets = await resolveChannelSelection(channelSelection, notificationTargets)
        } catch (e) {
            setIsSubmitting(false)
            toast.error(e instanceof Error ? e.message : 'Could not set up the selected channels. Please try again.')
            return
        }

        api.subscribe('whitelist', [SubscriptionType.WHITELIST], resolvedTargets, undefined, undefined)
            .then(() => {
                rememberChannelSelection(channelSelection, resolvedTargets)
                setShowDialog(false)
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
                if (error?.message) {
                    toast.error(error.message, {
                        onClick: () => {
                            router.push('/subscriptions')
                        }
                    })
                }
            })
            .finally(() => {
                setIsSubmitting(false)
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
            setChannelSelection(getInitialChannelSelection(targets))
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
                                Get notified whenever a new auction matching your whitelist from the{' '}
                                <Link href="https://sky.coflnet.com/flipper">Auction flipper</Link> is created.
                            </p>
                            <h5 className={styles.sectionHeading}>Where</h5>
                            <ChannelPicker
                                targets={notificationTargets}
                                isLoading={isLoadingNotificationTargets}
                                selection={channelSelection}
                                onChange={setChannelSelection}
                            />
                            <Button
                                onClick={onSubscribe}
                                disabled={!isChannelSelectionValid(channelSelection) || isSubmitting}
                                className={styles.notifyButton}
                            >
                                {isSubmitting ? 'Creating...' : 'Create notifier'}
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                                <h5 style={{ color: 'var(--bs-warning)', marginBottom: '10px' }}>Premium Feature</h5>
                                <p style={{ marginBottom: '15px' }}>Whitelist notifiers require at least Premium access.</p>
                                <p style={{ marginBottom: '15px' }}>Click the notification icon to open this dialog again after purchasing premium.</p>
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

    return (
        <div className={styles.subscribeButton}>
            {dialog}
            <Button style={{ width: 'max-content' }} onClick={openDialog}>
                <NotificationIcon />
                Create Whitelist Notifier
            </Button>
        </div>
    )
}

export default WhitelistSubscribeButton
