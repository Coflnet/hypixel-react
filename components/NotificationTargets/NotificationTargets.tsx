'use client'

import { useEffect, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import NotificationTargetForm from './NotificationTargetForm'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CopyIcon from '@mui/icons-material/ContentCopy'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getNotficationWhenEnumAsString, getNotificationTypeAsString, getShortNotificationTarget } from '../../utils/NotificationUtils'
import { canUseClipBoard, writeToClipboard } from '../../utils/ClipboardUtils'
import styles from './NotificationTargets.module.css'

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
        api.deleteNotificationTarget(target)
            .then(() => {
                setNotificationTargets(notificationTargets.filter(t => t.name !== target.name))
            })
            .catch(error => {
                // the http layer rejects with a plain string like `HTTP 500: {"slug":"subscription_depends",...}`,
                // so apiErrorHandler (which only handles error.message) stays silent - surface it here instead.
                let message = typeof error === 'string' ? error : error?.message
                if (message && message.includes('subscription_depends')) {
                    toast.error(`"${target.name}" is still used by at least one notifier. Switch those notifiers to another channel first, then delete it.`)
                } else {
                    toast.error(message || 'Could not delete this channel. Please try again.')
                }
            })
    }

    function sendTestNotification(target: NotificationTarget) {
        api.sendTestNotification(target)
    }

    function copyTarget(target: NotificationTarget) {
        if (!target.target || !canUseClipBoard()) {
            return
        }
        writeToClipboard(target.target)
        toast.success('Copied to clipboard')
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!showAddNotificationTarget ? (
                    <Button onClick={() => setShowAddNotificationTarget(true)}>Add channel</Button>
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
            {isLoading ? (
                getLoadingElement()
            ) : (
                <div className={styles.targetList}>
                    <Table className={styles.targetTable}>
                        <thead>
                            <tr>
                                <th className={styles.nameCell}>Name</th>
                                <th className={styles.targetCell}>Target</th>
                                <th className={styles.typeCell}>Type</th>
                                <th className={styles.whenCell}>When</th>
                                <th className={styles.usesCell}>Uses</th>
                                <th className={styles.actionCell}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {notificationTargets.map(target => (
                                <tr key={target.id ?? target.name}>
                                    <td className="ellipse" title={target.name || ''}>
                                        {target.name}
                                    </td>
                                    <td>{getTargetElement(target)}</td>
                                    <td>{getNotificationTypeAsString(target.type as number)}</td>
                                    <td>{getNotficationWhenEnumAsString(target.when as number)}</td>
                                    <td>{target.useCount || 0}</td>
                                    <td>{getActionsElement(target)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {/* the same rows on phones, where 6 columns don't fit: name + one line of details + the actions */}
                    <div className={styles.cardList}>
                        {notificationTargets.map(target => (
                            <div className={styles.card} key={target.id ?? target.name}>
                                <span className={`ellipse ${styles.cardName}`} title={target.name || ''}>
                                    {target.name}
                                </span>
                                <div className={styles.cardDetails}>
                                    <span>{getNotificationTypeAsString(target.type as number)}</span>
                                    <span>·</span>
                                    {getTargetElement(target)}
                                    <span>·</span>
                                    <span>used {target.useCount || 0}×</span>
                                </div>
                                {getActionsElement(target)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )

    function getTargetElement(target: NotificationTarget) {
        if (!target.target) {
            return null
        }
        return (
            <span
                className={styles.copyTarget}
                role="button"
                tabIndex={0}
                title="Click to copy the full value"
                onClick={() => copyTarget(target)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        copyTarget(target)
                    }
                }}
            >
                <span className="ellipse">{getShortNotificationTarget(target)}</span>
                <CopyIcon className={styles.copyIcon} />
            </span>
        )
    }

    function getActionsElement(target: NotificationTarget) {
        return (
            <div className={styles.actions}>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                        sendTestNotification(target)
                    }}
                >
                    Test
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    aria-label="Edit channel"
                    onClick={() => {
                        setShowAddNotificationTarget(true)
                        setNotificationTargetToUpdate(target)
                        setNotificationTargetType('UPDATE')
                    }}
                >
                    <EditIcon fontSize="small" />
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    aria-label="Delete channel"
                    onClick={() => {
                        deleteNotificationTarget(target)
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </Button>
            </div>
        )
    }
}

export default NotificationTargets
