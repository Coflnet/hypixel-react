'use client'
import { type JSX } from 'react'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import ComputerIcon from '@mui/icons-material/Computer'
import ForumIcon from '@mui/icons-material/Forum'
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined'
import { findInGameNeverTarget, isNotificationType } from '../../utils/NotificationUtils'
import { findDeviceTarget, isMobileDeviceName } from '../../utils/NotificationChannelUtils'
import styles from './SubscriptionList.module.css'

interface Props {
    subscription: NotificationSubscription
    allTargets: NotificationTarget[]
    /** the channel the user just tried to delete; its chip is marked so the notifier in the way is obvious */
    highlightedTargetId?: number
}

/** Renders the notifier's delivery channels as compact chips (in-game shown unless disabled). */
function ChannelChips(props: Props) {
    let attachedIds = props.subscription.targets.map(t => t.id)
    let attachedTargets = props.allTargets.filter(t => t.id !== undefined && attachedIds.includes(t.id))

    let inGameDisabled = findInGameNeverTarget(attachedTargets) !== undefined
    let deviceTarget = findDeviceTarget(props.allTargets)

    let chips: { key: string; icon: JSX.Element; label: string; highlighted?: boolean }[] = []

    if (!inGameDisabled) {
        chips.push({ key: 'ingame', icon: <SportsEsportsIcon fontSize="small" />, label: 'In-game' })
    }

    attachedTargets.forEach(target => {
        if (isNotificationType(target.type, 'InGame')) {
            return // in-game handled above; NEVER marker is not a real channel
        }
        let highlighted = target.id !== undefined && target.id === props.highlightedTargetId
        if (isNotificationType(target.type, 'FIREBASE')) {
            // a phone and a desktop are usually both registered, so the icon has to tell them apart
            let icon = isMobileDeviceName(target.name) ? <PhoneIphoneIcon fontSize="small" /> : <ComputerIcon fontSize="small" />
            let isThisDevice = deviceTarget && target.id === deviceTarget.id
            chips.push({ key: `t-${target.id}`, icon, label: isThisDevice ? 'This device' : target.name || 'Push', highlighted })
            return
        }
        if (isNotificationType(target.type, 'DiscordWebhook') || isNotificationType(target.type, 'DISCORD')) {
            chips.push({ key: `t-${target.id}`, icon: <ForumIcon fontSize="small" />, label: target.name || 'Discord', highlighted })
            return
        }
        chips.push({ key: `t-${target.id}`, icon: <NotificationsIcon fontSize="small" />, label: target.name || 'Channel', highlighted })
    })

    if (chips.length === 0) {
        return <span className={styles.noChannels}>No channels</span>
    }

    return (
        <div className={styles.chips}>
            {chips.map(chip => (
                <span className={`${styles.chip} ${chip.highlighted ? styles.chipHighlight : ''}`} key={chip.key}>
                    {chip.icon}
                    {chip.label}
                </span>
            ))}
        </div>
    )
}

export default ChannelChips
