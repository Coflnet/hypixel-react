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

    async function onSubscribe() {
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
        api.getNotificationTargets().then(targets => {
            setNotificationTargets(targets)
            setIsLoadingNotificationTargets(false)
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
                    <div>
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
