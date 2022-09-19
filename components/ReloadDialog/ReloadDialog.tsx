import React, { useState, ChangeEvent } from 'react'
import { Form, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { errorLog } from '../../pages/_app'
import styles from './ReloadDialog.module.css'

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

    function onClose() {
        props.onClose()
    }

    function onSubmit() {
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
    }

    function onLoadNewInformationChange(e: ChangeEvent<HTMLInputElement>) {
        feedback.loadNewInformation = e.target.checked
        setFeedback(feedback)
    }

    function onSomethingBrokeChange(e: ChangeEvent<HTMLInputElement>) {
        feedback.somethingBroke = e.target.checked
        setFeedback(feedback)
    }

    function onOtherIssueChange(e: ChangeEvent<HTMLInputElement>) {
        feedback.otherIssue = e.target.checked
        setFeedback(feedback)
    }

    function onAdditionalInformationChange(e: ChangeEvent<HTMLInputElement>) {
        feedback.additionalInformation = e.target.value
        setFeedback(feedback)
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
                    <Form.Label htmlFor="additionalInformations">Additional information</Form.Label>
                    <Form.Control
                        style={{ height: '75px', resize: 'none' }}
                        id="additionalInformations"
                        as="textarea"
                        onChange={onAdditionalInformationChange}
                    />
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
                <Button variant="success" onClick={onSubmit} style={{ marginLeft: '15px' }}>
                    Submit
                </Button>
            </div>
        </div>
    )
}

export default ReloadDialog
