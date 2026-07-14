import { toast } from 'react-toastify'
import cacheUtils from './CacheUtils'
import { canUseClipBoard, writeToClipboard } from './ClipboardUtils'

export default function registerNotificationCallback(router) {
    let interval = setInterval(function () {
        // wait until messaging is definded
        let messaging = (window as any).messaging
        if (typeof messaging == 'undefined') return
        clearInterval(interval)

        messaging.onMessage(function (payload) {
            let notification = payload.notification
            if (payload.data?.type === 'auction') {
                savePayloadIntoCache(payload)
            }
            displayNotification(notification)
        })
    }, 10)

    function displayNotification(notification: any) {
        toast.info(notification.title + '\n' + notification.body, {
            onClick: () => {
                if (canUseClipBoard()) {
                    writeToClipboard('/viewauction ' + notification.click_action.split(/\/auction\//)[1])
                }
                router.push('/' + notification.click_action.match(/\/\/[^/]+\/([^.]+)/)[1])
            },
            autoClose: 20000
        })
    }

    function savePayloadIntoCache(payload: any) {
        let auction = JSON.parse(payload.data.auction)
        cacheUtils.setIntoCache('auctionDetails', JSON.stringify(auction.uuid), auction, 60)
    }
}

export function getNotificationTypeAsString(type: NotificationType | number): string {
    switch (type) {
        case 1:
        case 'WEBHOOK':
            return 'Webhook'
        case 2:
        case 'DISCORD':
            return 'Discord'
        case 3:
        case 'DiscordWebhook':
            return 'Discord Webhook'
        case 4:
        case 'FIREBASE':
            return 'Push-Notification'
        case 5:
        case 'EMAIL':
            return 'E-Mail'
        case 6:
        case 'InGame':
            return 'InGame'
        default:
            return 'Unknown'
    }
}

/**
 * A one-line stand-in for the raw target value. Push tokens are hundreds of characters and Discord
 * webhook urls contain a secret, so neither is useful (or safe) to print in full - only enough to tell
 * two entries apart is shown, the full value can still be copied.
 */
export function getShortNotificationTarget(target: NotificationTarget): string {
    let value = target.target || ''
    if (!value) {
        return ''
    }
    if (isNotificationType(target.type, 'FIREBASE')) {
        return `Push token …${value.slice(-6)}`
    }
    if (isNotificationType(target.type, 'DiscordWebhook') || isNotificationType(target.type, 'WEBHOOK')) {
        let webhookId = value.match(/webhooks\/(\d+)/)
        return webhookId ? `Webhook …${webhookId[1].slice(-6)}` : 'Webhook url'
    }
    return value.length > 40 ? `${value.slice(0, 37)}…` : value
}

export function getNotficationWhenEnumAsString(when: NotificationWhen | number): string {
    switch (when) {
        case 0:
        case 'NEVER':
            return 'Never'
        case 1:
        case 'AfterFail':
            return 'After fail'
        case 2:
        case 'ALWAYS':
            return 'Always'
        default:
            return 'Never'
    }
}

// The API sends notification type/when either as string enum names or as their numeric value depending on the endpoint.
// These helpers let callers compare against a name without caring which form they got.
const NOTIFICATION_TYPE_NUMBERS: { [key in NotificationType]?: number } = {
    WEBHOOK: 1,
    DISCORD: 2,
    DiscordWebhook: 3,
    FIREBASE: 4,
    EMAIL: 5,
    InGame: 6
}

const NOTIFICATION_WHEN_NUMBERS: { [key in NotificationWhen]: number } = {
    NEVER: 0,
    AfterFail: 1,
    ALWAYS: 2
}

export function isNotificationType(type: NotificationType | number | undefined, name: NotificationType): boolean {
    return type === name || type === NOTIFICATION_TYPE_NUMBERS[name]
}

export function isNotificationWhen(when: NotificationWhen | number | undefined, name: NotificationWhen): boolean {
    return when === name || when === NOTIFICATION_WHEN_NUMBERS[name]
}

/**
 * Finds the target that marks in-game notifications as disabled (type InGame, when NEVER).
 * Only one such marker is ever needed per user; it is shared across all notifiers.
 */
export function findInGameNeverTarget(targets: NotificationTarget[]): NotificationTarget | undefined {
    return targets.find(t => isNotificationType(t.type, 'InGame') && isNotificationWhen(t.when, 'NEVER'))
}
