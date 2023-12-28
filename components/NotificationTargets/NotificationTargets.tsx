'use client'

import { useEffect, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import NotificationTargetForm from './NotificationTargetForm'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { getLoadingElement } from '../../utils/LoadingUtils'

function NotificationTargets() {
    let [notificationTargets, setNotificationTargets] = useState<NotificationTarget[]>([])
    let [isLoading, setIsLoading] = useState(false)
    let [showAddNotificationTarget, setShowAddNotificationTarget] = useState(false)
    let [notificationTargetToUpdate, setNotificationTargetToUpdate] = useState<NotificationTarget | null>(null)
    let [notificationTargetFormType, setNotificationTargetType] = useState<'CREATE' | 'UPDATE'>('CREATE')

    useEffect(() => {
        loadNotificatinoTargets()
    }, [])

    function loadNotificatinoTargets() {
        setIsLoading(true)
        api.getNotificationTargets().then(targets => {
            setNotificationTargets(targets)
            setIsLoading(false)
        })
    }

    function deleteNotificationTarget(target: NotificationTarget) {
        api.deleteNotificationTarget(target).then(() => {
            setNotificationTargets(notificationTargets.filter(t => t.name !== target.name))
        })
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!showAddNotificationTarget ? (
                    <Button onClick={() => setShowAddNotificationTarget(true)}>Add Notification Target</Button>
                ) : (
                    <Button
                        onClick={() => {
                            setShowAddNotificationTarget(false)
                        }}
                    >
                        Hide Form
                    </Button>
                )}
            </div>
            {showAddNotificationTarget && (
                <>
                    <NotificationTargetForm
                        type={notificationTargetFormType}
                        defaultNotificationTarget={notificationTargetFormType === 'UPDATE' ? notificationTargetToUpdate : null}
                        onSubmit={() => {
                            setShowAddNotificationTarget(false)
                            loadNotificatinoTargets()
                        }}
                    />
                    <hr />
                </>
            )}
            <Table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Target</th>
                        <th>Type</th>
                        <th>When</th>
                        <th>Use Count</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={99}>{getLoadingElement()}</td>
                        </tr>
                    ) : (
                        notificationTargets.map(target => {
                            return (
                                <tr>
                                    <td>{target.name}</td>
                                    <td>{target.target}</td>
                                    <td>{target.type}</td>
                                    <td>{target.when}</td>
                                    <td>{target.useCount}</td>
                                    <td>
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                setShowAddNotificationTarget(true)
                                                setNotificationTargetToUpdate(target)
                                                setNotificationTargetType('UPDATE')
                                            }}
                                        >
                                            <EditIcon />
                                        </Button>
                                    </td>
                                    <td>
                                        <Button
                                            variant="danger"
                                            onClick={() => {
                                                deleteNotificationTarget(target)
                                            }}
                                        >
                                            <DeleteIcon />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </Table>
        </>
    )
}

export default NotificationTargets
