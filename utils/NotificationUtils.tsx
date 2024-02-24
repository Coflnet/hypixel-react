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
            if (payload.data.type === 'auction') {
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
            return 'Firebase'
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
