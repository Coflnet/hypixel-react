export default function askForNotificationPermissons(): Promise<string> {
    return new Promise((resolve, reject) => {
        let token = localStorage.getItem('fcmToken')
        if (token) {
            resolve(token as string)
            return
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
            reject(new Error('Notifications are blocked in your browser. Enable them in the site settings and try again.'))
            return
        }
        // Retrieve an instance of Firebase Messaging so that it can handle background
        // messages.
        let attempts = 0
        let settled = false
        // @ts-ignore
        waitTilSet()
        function waitTilSet() {
            if (settled) {
                return
            }
            if (!(window as any).messaging) {
                // give up after ~10s so the caller isn't left hanging if messaging never initializes.
                // this is usually a content/privacy blocker stopping the Firebase scripts, or the page
                // being served over plain http from a non-localhost host (push needs https or localhost).
                if (attempts++ > 200) {
                    settled = true
                    reject(new Error('Push setup could not finish. Reload the page, and disable content blockers for this site if it keeps failing.'))
                    return
                }
                setTimeout(waitTilSet, 50) //wait 50 millisecnds then recheck
                return
            }
            // getToken() can hang indefinitely (e.g. the push service worker never becomes active, or the
            // browser silently drops the FCM registration), so bound it with a timeout instead of leaving
            // the caller spinning forever.
            let timeout = setTimeout(() => {
                if (settled) {
                    return
                }
                settled = true
                reject(new Error('Getting a push token timed out. Reload the page and try again.'))
            }, 15000)
            ;(window as any).messaging
                .getToken({
                    vapidKey: 'BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30'
                })
                .then((token: string) => {
                    if (settled) {
                        return
                    }
                    settled = true
                    clearTimeout(timeout)
                    localStorage.setItem('fcmToken', token)
                    resolve(token)
                })
                .catch((e: any) => {
                    if (settled) {
                        return
                    }
                    settled = true
                    clearTimeout(timeout)
                    console.error('FCM getToken failed', e)
                    reject(e instanceof Error ? e : new Error('Could not enable push notifications. Please allow notifications and try again.'))
                })
        }
    })
}
