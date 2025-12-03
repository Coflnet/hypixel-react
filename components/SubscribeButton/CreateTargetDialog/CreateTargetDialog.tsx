'use client'
import { Modal } from 'react-bootstrap'
import NotificationTargetForm from '../../NotificationTargets/NotificationTargetForm'
import styles from '../SubscribeButton.module.css'

interface Props {
    show: boolean
    onHide: () => void
    onTargetCreated: (target: NotificationTarget) => void
    popupTitle?: string
}

function CreateTargetDialog(props: Props) {
    function onTargetCreated(target: NotificationTarget) {
        props.onTargetCreated(target)
        props.onHide()
    }

    return (
        <Modal
            show={props.show}
            onHide={props.onHide}
            className={styles.subscribeDialog}
        >
            <Modal.Header closeButton>
                <Modal.Title>{props.popupTitle || 'Create a Notification Target'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <NotificationTargetForm
                    type="CREATE"
                    onSubmit={onTargetCreated}
                />
            </Modal.Body>
        </Modal>
    )
}

export default CreateTargetDialog
