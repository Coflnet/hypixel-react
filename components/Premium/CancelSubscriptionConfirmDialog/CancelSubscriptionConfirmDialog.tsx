import React from 'react'
import { Modal, Button } from 'react-bootstrap'

interface CancelSubscriptionConfirmDialogProps {
    show: boolean
    onHide: () => void
    onConfirm: () => void
}

const CancelSubscriptionConfirmDialog = ({ show, onHide, onConfirm }: CancelSubscriptionConfirmDialogProps) => {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header>
                <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <p>Are you sure you want to cancel your subscription?</p>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
                        <Button variant="danger" onClick={onHide}>
                            Cancel
                        </Button>
                        <Button variant="success" onClick={onConfirm}>
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default CancelSubscriptionConfirmDialog
