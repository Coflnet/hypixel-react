'use client'
import { useState, type JSX } from 'react'
import { Button } from 'react-bootstrap'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import NotificationIcon from '@mui/icons-material/NotificationsOutlined'
import EditIcon from '@mui/icons-material/Edit'
import styles from './SubscribeButton.module.css'
import NotifierDialog from './NotifierDialog'

interface Props {
    topic: string
    type: 'player' | 'item' | 'auction' | 'bazaar'
    buttonContent?: JSX.Element
    isEditButton?: boolean
    currentPrice?: number
    currentSellPrice?: number
    /** the filter the user is currently searching with; copied into a new item notifier */
    defaultFilter?: ItemFilter
    onAfterSubscribe?()
    prefill?: SubscribePrefill
    popupTitle?: string
    popupButtonText?: string
    successMessage?: string
}

function SubscribeButton(props: Props) {
    let { trackEvent } = useMatomo()
    let [showDialog, setShowDialog] = useState(false)

    function openDialog() {
        trackEvent({ action: 'subscription dialog opened', category: 'subscriptions' })
        setShowDialog(true)
    }

    function closeDialog() {
        trackEvent({ action: 'subscription dialog closed', category: 'subscriptions' })
        setShowDialog(false)
    }

    return (
        <div className={styles.subscribeButton}>
            {/* only mounted while open, so the dialog always starts from the price and filter that are current
                at that moment instead of the ones from when this button was first rendered */}
            {showDialog ? (
                <NotifierDialog
                    show={showDialog}
                    onHide={closeDialog}
                    topic={props.topic}
                    type={props.type}
                    currentPrice={props.currentPrice}
                    currentSellPrice={props.currentSellPrice}
                    defaultFilter={props.defaultFilter}
                    prefill={props.prefill}
                    popupTitle={props.popupTitle}
                    popupButtonText={props.popupButtonText}
                    successMessage={props.successMessage}
                    onAfterSubscribe={props.onAfterSubscribe}
                />
            ) : null}
            {props.isEditButton ? (
                <div onClick={openDialog}>
                    <EditIcon />
                </div>
            ) : (
                <Button style={{ width: 'max-content' }} onClick={openDialog}>
                    <NotificationIcon />
                    {props.buttonContent || ' Notify'}
                </Button>
            )}
        </div>
    )
}

export default SubscribeButton
