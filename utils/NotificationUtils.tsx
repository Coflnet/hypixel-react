import { toast } from 'react-toastify'
import cacheUtils from './CacheUtils'

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
        console.log(notification)
        toast.info(notification.title + '\n' + notification.body, {
            onClick: () => {
                if (window.navigator.clipboard) {
                    window.navigator.clipboard.writeText('/viewauction ' + notification.click_action.split(/\/auction\//)[1])
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
