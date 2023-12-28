'use client'

import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'

const TYPE_OPTIONS = ['UNKOWN', 'WEBHOOK', 'DISCORD', 'DISCORD_WEBHOOK', 'FIREBASE', 'EMAIL']
const WHEN_OPITIONS = ['NEVER', 'AFTER_FAIL', 'ALWAYS']

interface Props {
    type: 'CREATE' | 'UPDATE'
    defaultNotificationTarget?: NotificationTarget | null
    onSubmit(target: NotificationTarget): void
}

function NotificationTargetForm(props: Props) {
    let [name, setName] = useState<string>(props.defaultNotificationTarget?.name || '')
    let [type, setType] = useState<'UNKOWN' | 'WEBHOOK' | 'DISCORD' | 'DISCORD_WEBHOOK' | 'FIREBASE' | 'EMAIL'>(
        props.defaultNotificationTarget?.type || 'FIREBASE'
    )
    let [target, setTarget] = useState<string | null>(props.defaultNotificationTarget?.target || null)
    let [when, setWhen] = useState<'NEVER' | 'AFTER_FAIL' | 'ALWAYS'>(props.defaultNotificationTarget?.when || 'NEVER')
    let [disabled, setDisabled] = useState(false)

    function addNotificationTarget() {
        setDisabled(true)
        let notificationTarget: NotificationTarget = {
            name: name,
            type: type,
            target: target,
            when: when,
            useCount: 0,
            userId: localStorage.getItem('googleId')
        }
        let updateOrCreateFunction = props.type === 'CREATE' ? api.addNotificationTarget : api.updateNotificationTarget
        updateOrCreateFunction(notificationTarget)
            .then(newTarget => {
                props.onSubmit(newTarget)
            })
            .finally(() => {
                setDisabled(false)
            })
    }

    return (
        <>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" onChange={e => setName(e.target.value)} placeholder="Enter name" />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select defaultValue={type} onChange={e => setType(e.target.value as any)}>
                        {TYPE_OPTIONS.map(type => (
                            <option value={type} key={type}>
                                {type}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Target</Form.Label>
                    <Form.Control type="text" onChange={e => setTarget(e.target.value)} placeholder="Enter target" />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>When</Form.Label>
                    <Form.Select defaultValue={when} onChange={e => setWhen(e.target.value as any)}>
                        {WHEN_OPITIONS.map(when => (
                            <option value={when} key={when}>
                                {when}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Button variant="primary" onClick={addNotificationTarget} disabled={disabled}>
                    Add
                </Button>
            </Form>
        </>
    )
}

export default NotificationTargetForm
