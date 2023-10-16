import { useState, ChangeEvent } from 'react'
import { Form, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import Tooltip from '../Tooltip/Tooltip'
import styles from './ReloadDialog.module.css'
import { errorLog } from '../MainApp/MainApp'

interface Props {
    onClose()
}

function ReloadDialog(props: Props) {
    let [feedback, setFeedback] = useState<ReloadFeedback>({
        loadNewInformation: false,
        otherIssue: false,
        somethingBroke: false,
        additionalInformation: ''
    })
    let [hasUserInput, setHasUserInput] = useState(false)
    let [showMissingAdditionalInformation, setShowMissingAdditionalInformation] = useState(false)

    function onClose() {
        props.onClose()
    }

    function onSubmit() {
        if (!feedback.additionalInformation) {
            setShowMissingAdditionalInformation(true)
            return
        }
        let feedbackToSend: any = { ...feedback }
        feedbackToSend.errorLog = errorLog
        feedbackToSend.href = location.href

        api.sendFeedback('reload', feedbackToSend)
            .then(() => {
                toast.success('Thank you for your feedback!')
                props.onClose()
            })
            .catch(() => {
                toast.error('Feedback could not be sent.')
                props.onClose()
            })
    }

    function onRememberHideDialogChange(e: ChangeEvent<HTMLInputElement>) {
        localStorage.setItem('rememberHideReloadDialog', e.target.checked.toString())
        setHasUserInput(true)
    }

    function onLoadNewInformationChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.loadNewInformation = e.target.checked
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    function onSomethingBrokeChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.somethingBroke = e.target.checked
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    function onOtherIssueChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.otherIssue = e.target.checked
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    function onAdditionalInformationChange(e: ChangeEvent<HTMLInputElement>) {
        let newFeedback = { ...feedback }
        newFeedback.additionalInformation = e.target.value
        if (newFeedback.additionalInformation) {
            setShowMissingAdditionalInformation(false)
        }
        setFeedback(newFeedback)
        setHasUserInput(true)
    }

    return (
        <div>
            <p>
                We noticed that you reloaded the page multiple times. We try to constantly improve our service. To do so we need to know if and what went wrong.
            </p>
            <p>Please tell us, why you reloaded the page:</p>
            <Form>
                <hr />
                <Form.Group>
                    <Form.Label htmlFor="loaddNewInformation">I tried to load new information</Form.Label>
                    <Form.Check
                        id="loaddNewInformation"
                        className={styles.checkbox}
                        defaultChecked={feedback.loadNewInformation}
                        onChange={onLoadNewInformationChange}
                    />
                    <p style={{ fontStyle: 'italic' }}>
                        If you need the most recent information on something you could try to create a notification for it. Currently you can create
                        notifications for Items, Auctions and Players. Do you need something else? Please dont hesitate to ask us.
                    </p>
                </Form.Group>
                <hr />
                <Form.Group>
                    <Form.Label htmlFor="somethingBroke">Something broke</Form.Label>
                    <Form.Check id="somethingBroke" className={styles.checkbox} defaultChecked={feedback.somethingBroke} onChange={onSomethingBrokeChange} />
                    <p style={{ fontStyle: 'italic' }}>You found an bug? Please tell us about it so that we can fix it as soon as possible.</p>
                </Form.Group>

                <hr />
                <Form.Group>
                    <Form.Label htmlFor="otherIssues">Other issue</Form.Label>
                    <Form.Check id="otherIssues" className={styles.checkbox} defaultChecked={feedback.otherIssue} onChange={onOtherIssueChange} />
                    <p style={{ fontStyle: 'italic' }}>If you need any kind of help please join our discord or write us an E-Mail. We are happy to help.</p>
                </Form.Group>

                <hr />
                <Form.Group>
                    <Form.Label htmlFor="additionalInformations">*Additional information</Form.Label>
                    <Form.Control
                        isInvalid={showMissingAdditionalInformation}
                        style={{ height: '75px', resize: 'none' }}
                        id="additionalInformations"
                        as="textarea"
                        onChange={onAdditionalInformationChange}
                    />
                    {showMissingAdditionalInformation ? (
                        <div>
                            <span style={{ color: 'red' }}>Please enter some additional information</span>
                        </div>
                    ) : null}
                </Form.Group>

                <hr />
                <Form.Group>
                    <Form.Label htmlFor="rememberHideDialog">
                        <b>Please dont show this dialog again.</b>
                    </Form.Label>
                    <Form.Check id="rememberHideDialog" className={styles.checkbox} onChange={onRememberHideDialogChange} />
                </Form.Group>
            </Form>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="danger" onClick={onClose}>
                    Close
                </Button>
                <Tooltip
                    type={'hover'}
                    content={
                        <div>
                            <Button variant="success" onClick={onSubmit} disabled={!hasUserInput} style={{ marginLeft: '15px' }}>
                                Submit
                            </Button>
                        </div>
                    }
                    tooltipContent={!hasUserInput ? <span>Please enter some information before submitting feedback</span> : undefined}
                />
            </div>
        </div>
    )
}

export default ReloadDialog
