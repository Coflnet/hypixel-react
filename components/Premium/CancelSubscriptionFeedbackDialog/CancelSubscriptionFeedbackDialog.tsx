import { useState, ChangeEvent } from 'react'
import { Modal, Form, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../../api/ApiHelper'
import Tooltip from '../../Tooltip/Tooltip'

interface Props {
    show: boolean
    onClose: () => void
    onCancel: () => void
}

interface SubscriptionCancelFeedbackExtended extends SubscriptionCancelFeedback {
    cantAffordAnymore?: boolean
}

function CancelSubscriptionFeedbackDialog(props: Props) {
    let [feedback, setFeedback] = useState<SubscriptionCancelFeedbackExtended>({
        stoppedPlayingSkyblock: false,
        hasComplaint: false,
        cantAffordAnymore: false,
        additionalInformation: ''
    })
    let [hasUserInput, setHasUserInput] = useState(false)
    let [showMissingAdditionalInformation, setShowMissingAdditionalInformation] = useState(false)

    function onAbort() {
        props.onClose()
    }

    function onCancelWithoutFeedback() {
        props.onCancel()
    }

    function onSubmitAndCancel() {
        if (!feedback.additionalInformation && feedback.hasComplaint) {
            setShowMissingAdditionalInformation(true)
            return
        }
        
        let feedbackToSend: any = { ...feedback }
        feedbackToSend.href = location.href

        api.sendFeedback('subscription-cancel', feedbackToSend)
            .then(() => {
                toast.success('Thank you for your feedback!')
                props.onCancel()
            })
            .catch(() => {
                toast.error('Feedback could not be sent.')
                props.onCancel()
            })
    }

    function onStoppedPlayingSkyblockChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.stoppedPlayingSkyblock = e.target.checked
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    function onHasComplaintChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.hasComplaint = e.target.checked
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    function onCantAffordAnymoreChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.cantAffordAnymore = e.target.checked
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    function onAdditionalInformationChange(e: ChangeEvent<HTMLTextAreaElement>) {
        let newFeedback = { ...feedback }
        newFeedback.additionalInformation = e.target.value
        if (newFeedback.additionalInformation) {
            setShowMissingAdditionalInformation(false)
        }
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    return (
        <Modal size="lg" show={props.show} onHide={onAbort}>
            <Modal.Header closeButton>
                <Modal.Title>Cancel Subscription</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <p>
                        We're sorry to see you go! To help us improve our service, please let us know why you're canceling:
                    </p>
                    <Form>
                        <hr />
                        <Form.Group>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Form.Check
                                    id="stoppedPlayingSkyblock"
                                    checked={feedback.stoppedPlayingSkyblock}
                                    onChange={onStoppedPlayingSkyblockChange}
                                />
                                <Form.Label htmlFor="stoppedPlayingSkyblock" style={{ margin: 0 }}>
                                    I stopped playing Skyblock
                                </Form.Label>
                            </div>
                        </Form.Group>

                        <hr />
                        <Form.Group>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Form.Check
                                    id="cantAffordAnymore"
                                    checked={feedback.cantAffordAnymore}
                                    onChange={onCantAffordAnymoreChange}
                                />
                                <Form.Label htmlFor="cantAffordAnymore" style={{ margin: 0 }}>
                                    I can't afford this anymore
                                </Form.Label>
                            </div>
                        </Form.Group>

                        <hr />
                        <Form.Group>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Form.Check
                                    id="hasComplaint"
                                    checked={feedback.hasComplaint}
                                    onChange={onHasComplaintChange}
                                />
                                <Form.Label htmlFor="hasComplaint" style={{ margin: 0 }}>
                                    I have a complaint
                                </Form.Label>
                            </div>
                            {feedback.hasComplaint ? (
                                <Form.Group style={{ marginTop: '10px' }}>
                                    <Form.Label htmlFor="additionalInformations">
                                        *Please tell us what went wrong
                                    </Form.Label>
                                    <Form.Control
                                        isInvalid={showMissingAdditionalInformation}
                                        style={{ height: '75px', resize: 'none' }}
                                        id="additionalInformations"
                                        as="textarea"
                                        value={feedback.additionalInformation}
                                        onChange={onAdditionalInformationChange}
                                    />
                                    {showMissingAdditionalInformation ? (
                                        <div>
                                            <span style={{ color: 'red' }}>
                                                Please enter additional information about your complaint
                                            </span>
                                        </div>
                                    ) : null}
                                </Form.Group>
                            ) : null}
                        </Form.Group>

                        {!feedback.hasComplaint && feedback.stoppedPlayingSkyblock ? (
                            <>
                                <hr />
                                <Form.Group>
                                    <Form.Label htmlFor="additionalInformations">
                                        Additional information (optional)
                                    </Form.Label>
                                    <Form.Control
                                        style={{ height: '75px', resize: 'none' }}
                                        id="additionalInformations"
                                        as="textarea"
                                        value={feedback.additionalInformation}
                                        onChange={onAdditionalInformationChange}
                                    />
                                </Form.Group>
                            </>
                        ) : null}
                    </Form>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <Button variant="secondary" onClick={onAbort}>
                            Abort
                        </Button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Tooltip
                                type={'hover'}
                                content={
                                    <Button
                                        variant="success"
                                        onClick={onSubmitAndCancel}
                                    >
                                        {hasUserInput ? 'Submit feedback and cancel' : 'Confirm cancelation'}
                                    </Button>
                                }
                                tooltipContent={
                                    !hasUserInput ? (
                                        <span>No feedback provided - will cancel subscription without feedback</span>
                                    ) : undefined
                                }
                            />
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default CancelSubscriptionFeedbackDialog
