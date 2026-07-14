'use client'
import { useEffect, useRef, useState } from 'react'
import { Form, Spinner } from 'react-bootstrap'
import GamepadIcon from '@mui/icons-material/SportsEsports'
import PhoneIcon from '@mui/icons-material/PhoneIphone'
import DiscordIcon from '@mui/icons-material/Forum'
import askForNotificationPermissons from '../../../utils/NotificationPermisson'
import { getNotificationTypeAsString, isNotificationType } from '../../../utils/NotificationUtils'
import { ChannelSelection, fetchWebhookName, getDeviceName, getExtraTargets, isValidDiscordWebhookUrl } from '../../../utils/NotificationChannelUtils'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import styles from './ChannelPicker.module.css'

interface Props {
    targets: NotificationTarget[]
    isLoading: boolean
    selection: ChannelSelection
    onChange(selection: ChannelSelection): void
}

const PUSH_SUPPORTED = typeof window !== 'undefined' && 'Notification' in window

function ChannelPicker(props: Props) {
    let [pushPending, setPushPending] = useState(false)
    let [pushError, setPushError] = useState<string | null>(null)
    // once the user edits the name themselves, stop auto-filling it from the fetched webhook name
    let nameTouchedRef = useRef(false)
    let selectionRef = useRef(props.selection)
    selectionRef.current = props.selection

    let { selection } = props

    // when a valid webhook URL is entered, prefill the name field with the webhook's own name (Discord's
    // API doesn't expose the channel name, only its id), unless the user has already typed their own label
    useEffect(() => {
        let url = selection.newDiscordUrl
        if (url === null || !isValidDiscordWebhookUrl(url) || nameTouchedRef.current) {
            return
        }
        let cancelled = false
        fetchWebhookName(url).then(name => {
            if (cancelled || !name || nameTouchedRef.current) {
                return
            }
            let current = selectionRef.current
            if (current.newDiscordUrl !== url) {
                return // the url changed while fetching, don't clobber
            }
            props.onChange({ ...current, newDiscordName: name.slice(0, 32) })
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selection.newDiscordUrl])

    async function onToggleDevice(checked: boolean) {
        setPushError(null)
        if (!checked) {
            props.onChange({ ...selection, push: false })
            return
        }
        setPushPending(true)
        try {
            // the token is stored locally here; the FIREBASE notification target that registers it with
            // the backend is created at submit time (see resolveChannelSelection)
            await askForNotificationPermissons()
            props.onChange({ ...selection, push: true })
        } catch (e) {
            setPushError(e instanceof Error ? e.message : 'Could not enable push notifications.')
        } finally {
            setPushPending(false)
        }
    }

    function onToggleDiscord(checked: boolean) {
        nameTouchedRef.current = false
        props.onChange({ ...selection, newDiscordUrl: checked ? '' : null, newDiscordName: '' })
    }

    function onToggleExisting(id: number, checked: boolean) {
        let existingTargetIds = checked
            ? [...selection.existingTargetIds, id]
            : selection.existingTargetIds.filter(existingId => existingId !== id)
        props.onChange({ ...selection, existingTargetIds })
    }

    if (props.isLoading) {
        return getLoadingElement(<p>Loading channels...</p>)
    }

    let deviceName = getDeviceName()
    let discordChecked = selection.newDiscordUrl !== null
    let discordInvalid = discordChecked && selection.newDiscordUrl !== '' && !isValidDiscordWebhookUrl(selection.newDiscordUrl || '')
    let discordValid = discordChecked && isValidDiscordWebhookUrl(selection.newDiscordUrl || '')
    let extraTargets = getExtraTargets(props.targets)

    return (
        <div className={styles.channelPicker}>
            {/* In-game chat */}
            <label className={styles.channel}>
                <Form.Check type="checkbox" checked={selection.inGame} onChange={e => props.onChange({ ...selection, inGame: e.target.checked })} />
                <GamepadIcon className={styles.icon} />
                <span className={styles.text}>
                    <span className={styles.title}>In-game chat</span>
                    <span className={styles.subtitle}>Sent by the mod while you're online</span>
                </span>
            </label>

            {/* This device (push) */}
            <label className={`${styles.channel} ${!PUSH_SUPPORTED ? styles.disabled : ''}`}>
                {pushPending ? (
                    <Spinner animation="border" size="sm" className={styles.spinner} />
                ) : (
                    <Form.Check
                        type="checkbox"
                        checked={selection.push}
                        disabled={!PUSH_SUPPORTED}
                        onChange={e => onToggleDevice(e.target.checked)}
                    />
                )}
                <PhoneIcon className={styles.icon} />
                <span className={styles.text}>
                    {/* named after the browser and OS, since a desktop and a phone are usually both registered */}
                    <span className={styles.title}>This device ({deviceName})</span>
                    <span className={styles.subtitle}>{PUSH_SUPPORTED ? 'Push notification' : 'Not supported in this browser'}</span>
                    {pushError ? <span className={styles.error}>{pushError}</span> : null}
                </span>
            </label>

            {/* New Discord webhook */}
            <div className={`${styles.channel} ${styles.channelColumn} ${discordChecked ? styles.channelActive : ''}`}>
                <label className={styles.channelRow}>
                    <Form.Check type="checkbox" checked={discordChecked} onChange={e => onToggleDiscord(e.target.checked)} />
                    <DiscordIcon className={styles.icon} />
                    <span className={styles.text}>
                        <span className={styles.title}>Discord server</span>
                        <span className={styles.subtitle}>Post to a channel via webhook</span>
                    </span>
                </label>
                {discordChecked ? (
                    <div className={styles.discordExpand}>
                        <Form.Control
                            type="text"
                            value={selection.newDiscordUrl || ''}
                            isInvalid={discordInvalid}
                            placeholder="https://discord.com/api/webhooks/..."
                            onChange={e => props.onChange({ ...selection, newDiscordUrl: e.target.value })}
                        />
                        {discordInvalid ? (
                            <span className={styles.error}>
                                The URL has to start with "https://discord.com/api/..." or "https://discordapp.com/api/webhooks/...".
                            </span>
                        ) : (
                            <span className={styles.subtitle}>
                                Server Settings → Integrations → Webhooks → Copy URL ·{' '}
                                <a
                                    href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    show me how
                                </a>
                            </span>
                        )}
                        {discordValid ? (
                            <>
                                <Form.Control
                                    type="text"
                                    maxLength={32}
                                    value={selection.newDiscordName || ''}
                                    placeholder="Name (e.g. your channel)"
                                    onChange={e => {
                                        nameTouchedRef.current = true
                                        props.onChange({ ...selection, newDiscordName: e.target.value })
                                    }}
                                />
                                <span className={styles.subtitle}>Shown in your notifier list. Defaults to the webhook name.</span>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {/* Other existing targets, e.g. the user's other devices and past webhooks */}
            {extraTargets.map(target => (
                <label className={styles.channel} key={target.id}>
                    <Form.Check
                        type="checkbox"
                        checked={target.id !== undefined && selection.existingTargetIds.includes(target.id)}
                        onChange={e => target.id !== undefined && onToggleExisting(target.id, e.target.checked)}
                    />
                    {isNotificationType(target.type, 'FIREBASE') ? <PhoneIcon className={styles.icon} /> : <DiscordIcon className={styles.icon} />}
                    <span className={styles.text}>
                        <span className={styles.title}>{target.name || getNotificationTypeAsString(target.type)}</span>
                        <span className={styles.subtitle}>
                            {getNotificationTypeAsString(target.type)}
                            {target.useCount ? ` · used ${target.useCount}×` : ''}
                        </span>
                    </span>
                </label>
            ))}
        </div>
    )
}

export default ChannelPicker
