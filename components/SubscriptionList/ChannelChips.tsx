'use client'
import { type JSX } from 'react'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import ForumIcon from '@mui/icons-material/Forum'
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined'
import { findInGameNeverTarget, isNotificationType } from '../../utils/NotificationUtils'
import { findDeviceTarget } from '../../utils/NotificationChannelUtils'
import styles from './SubscriptionList.module.css'

interface Props {
    subscription: NotificationSubscription
    allTargets: NotificationTarget[]
}

/** Renders the notifier's delivery channels as compact chips (in-game shown unless disabled). */
function ChannelChips(props: Props) {
    let attachedIds = props.subscription.targets.map(t => t.id)
    let attachedTargets = props.allTargets.filter(t => t.id !== undefined && attachedIds.includes(t.id))

    let inGameDisabled = findInGameNeverTarget(attachedTargets) !== undefined
    let deviceTarget = findDeviceTarget(props.allTargets)

    let chips: { key: string; icon: JSX.Element; label: string }[] = []

    if (!inGameDisabled) {
        chips.push({ key: 'ingame', icon: <SportsEsportsIcon fontSize="small" />, label: 'In-game' })
    }

    attachedTargets.forEach(target => {
        if (isNotificationType(target.type, 'InGame')) {
            return // in-game handled above; NEVER marker is not a real channel
        }
        if (deviceTarget && target.id === deviceTarget.id) {
            chips.push({ key: `t-${target.id}`, icon: <PhoneIphoneIcon fontSize="small" />, label: 'This device' })
            return
        }
        if (isNotificationType(target.type, 'FIREBASE')) {
            chips.push({ key: `t-${target.id}`, icon: <PhoneIphoneIcon fontSize="small" />, label: target.name || 'Push' })
            return
        }
        if (isNotificationType(target.type, 'DiscordWebhook') || isNotificationType(target.type, 'DISCORD')) {
            chips.push({ key: `t-${target.id}`, icon: <ForumIcon fontSize="small" />, label: target.name || 'Discord' })
            return
        }
        chips.push({ key: `t-${target.id}`, icon: <NotificationsIcon fontSize="small" />, label: target.name || 'Channel' })
    })

    if (chips.length === 0) {
        return <span className={styles.noChannels}>No channels</span>
    }

    return (
        <div className={styles.chips}>
            {chips.map(chip => (
                <span className={styles.chip} key={chip.key}>
                    {chip.icon}
                    {chip.label}
                </span>
            ))}
        </div>
    )
}

export default ChannelChips
