'use client'

import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import askForNotificationPermissons from '../../utils/NotificationPermisson'
import { getNotficationWhenEnumAsString, getNotificationTypeAsString } from '../../utils/NotificationUtils'

const TYPE_OPTIONS: NotificationType[] = ['WEBHOOK', 'DISCORD', 'DiscordWebhook', 'FIREBASE', 'EMAIL', 'InGame']
const WHEN_OPITIONS: NotificationWhen[] = ['NEVER', 'AfterFail', 'ALWAYS']

interface Props {
    type: 'CREATE' | 'UPDATE'
    defaultNotificationTarget?: NotificationTarget | null
    onSubmit(target: NotificationTarget): void
}

function NotificationTargetForm(props: Props) {
    let [name, setName] = useState<string>(props.defaultNotificationTarget?.name || '')
    let [type, setType] = useState<'WEBHOOK' | 'DISCORD' | 'DiscordWebhook' | 'FIREBASE' | 'EMAIL' | 'InGame' | number>(
        props.defaultNotificationTarget?.type || 'FIREBASE'
    )
    let [target, setTarget] = useState<string | null>(props.defaultNotificationTarget?.target || null)
    let [when, setWhen] = useState<'NEVER' | 'AfterFail' | 'ALWAYS' | number>(props.defaultNotificationTarget?.when || 'ALWAYS')
    let [disabled, setDisabled] = useState(false)

    async function addNotificationTarget() {
        let targetToSend = target

        if (type === 'FIREBASE') {
            if (localStorage.getItem('fcmToken') === null) {
                let token = await askForNotificationPermissons()
                await api.setToken(token)
                localStorage.setItem('fcmToken', token)
                targetToSend = token
            } else {
                targetToSend = localStorage.getItem('fcmToken') as string
            }
        }

        setDisabled(true)
        let notificationTarget: NotificationTarget = {
            id: props.defaultNotificationTarget?.id,
            name: name,
            type: type,
            target: targetToSend,
            when: when,
            useCount: 0
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
                    <Form.Control defaultValue={name} type="text" onChange={e => setName(e.target.value)} placeholder="Enter name" />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select defaultValue={type} onChange={e => setType(e.target.value as any)}>
                        {TYPE_OPTIONS.map(type => (
                            <option value={type} key={type}>
                                {getNotificationTypeAsString(type)}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                {type === 'WEBHOOK' || type === 'DiscordWebhook' ? (
                    <Form.Group className="mb-3">
                        <Form.Label>Target</Form.Label>
                        <Form.Control defaultValue={target || undefined} type="text" onChange={e => setTarget(e.target.value)} placeholder="Enter target" />
                    </Form.Group>
                ) : null}
                <Form.Group className="mb-3">
                    <Form.Label>When</Form.Label>
                    <Form.Select defaultValue={when} onChange={e => setWhen(e.target.value as any)}>
                        {WHEN_OPITIONS.map(when => (
                            <option value={when} key={when}>
                                {getNotficationWhenEnumAsString(when)}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Button variant="primary" onClick={addNotificationTarget} disabled={disabled}>
                    {props.type === 'CREATE' ? 'Add' : 'Update'}
                </Button>
            </Form>
        </>
    )
}

export default NotificationTargetForm
