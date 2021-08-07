import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import './ReloadDialog.css';

interface Props {
    onClose()
}

function ReloadDialog(props: Props) {

    let [feedback, setFeedback] = useState<ReloadFeedback>();

    //  TODO: 
    //  Track ansers (possible text)
    //  Save decision to not show this dialog again

    function onClose() {
        props.onClose();
    }

    function onSubmit() {
        props.onClose();
    }

    return (
        <div className="reload-dialog">
            <p>We noticed that you reloaded the page multiple times. We try to constantly improve our service. To do so we need to know if something went wrong.</p>
            <p>Please tell us, why you reloaded the page:</p>
            <Form>
                <hr />
                <Form.Group>
                    <Form.Check className="checkbox" />
                    <Form.Label>I tried to load new information.</Form.Label>
                    <p style={{ fontStyle: "italic" }}>If you need the most recent information on something you could try to subscribe to it. Currently you can subscribe to Items, Auctions and Players. Do you need something else? Please dont hesitate to ask us.</p>
                </Form.Group>
                <hr />
                <Form.Group>
                    <Form.Check className="checkbox" />
                    <Form.Label>Something broke.</Form.Label>
                    <p style={{ fontStyle: "italic" }}>You found an bug? Please tell us about it so that we can fix it as soon as possible.</p>
                </Form.Group>

                <hr />
                <Form.Group>
                    <Form.Check className="checkbox" />
                    <Form.Label>Other issue.</Form.Label>
                    <p style={{ fontStyle: "italic" }}>If you need any kind of help please join our discord or write us an E-Mail. We are happy to help.</p>
                </Form.Group>
                <hr />
                <Form.Group>
                    <Form.Check className="checkbox" />
                    <Form.Label><b>Please dont show this dialog again.</b></Form.Label>
                </Form.Group>
            </Form>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="danger" onClick={onClose}>Close</Button>
                <Button variant="success" onClick={onSubmit} style={{ marginLeft: "15px" }}>Submit</Button>
            </div>
        </div>
    );
}

export default ReloadDialog;