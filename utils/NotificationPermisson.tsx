const GET_TOKEN_TIMEOUT = 15000
const VAPID_KEY = 'BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30'

/** Resolves once the Firebase messaging instance set up by preScript.js is available. */
function waitForMessaging(timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
        let waited = 0
        let check = () => {
            let messaging = (window as any).messaging
            if (messaging) {
                resolve(messaging)
                return
            }
            if (waited >= timeout) {
                // usually a content/privacy blocker stopping the Firebase scripts, or the page being served
                // over plain http from a non-localhost host (push needs https or localhost)
                reject(new Error('Push setup could not finish. Disable content blockers for this site and try again.'))
                return
            }
            waited += 50
            setTimeout(check, 50)
        }
        check()
    })
}

/**
 * getToken() waits forever when the push service worker isn't active yet, which is the case on the
 * first visit while the registration is still installing. Waiting for it to become active is what
 * makes the first attempt succeed instead of only working after a page reload.
 */
function waitForActiveServiceWorker(timeout: number): Promise<void> {
    if (!('serviceWorker' in navigator)) {
        return Promise.reject(new Error('Push notifications are not supported in this browser.'))
    }
    return Promise.race([
        navigator.serviceWorker.ready.then(() => undefined),
        new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('The push service worker did not start. Reload the page and try again.')), timeout)
        )
    ])
}

function getTokenWithTimeout(messaging: any): Promise<string> {
    return Promise.race([
        messaging.getToken({ vapidKey: VAPID_KEY }) as Promise<string>,
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Getting a push token timed out.')), GET_TOKEN_TIMEOUT))
    ])
}

export default async function askForNotificationPermissons(): Promise<string> {
    let storedToken = localStorage.getItem('fcmToken')
    if (storedToken) {
        return storedToken
    }

    if (typeof Notification === 'undefined') {
        throw new Error('Push notifications are not supported in this browser.')
    }
    if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked in your browser. Enable them in the site settings and try again.')
    }
    // ask explicitly instead of relying on getToken() doing it, so a dismissed prompt fails fast
    if (Notification.permission === 'default') {
        let permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            throw new Error('Notifications were not allowed. Enable them in the site settings and try again.')
        }
    }

    await waitForActiveServiceWorker(20000)
    let messaging = await waitForMessaging(20000)

    let token: string
    try {
        token = await getTokenWithTimeout(messaging)
    } catch (e) {
        console.error('FCM getToken failed, retrying once', e)
        // a timed out first attempt usually means the service worker only just became active. retrying
        // against the now ready worker recovers without the user having to reload the page.
        await waitForActiveServiceWorker(10000)
        try {
            token = await getTokenWithTimeout(messaging)
        } catch (retryError) {
            console.error('FCM getToken failed again', retryError)
            throw new Error('Could not enable push notifications. Please try again in a moment.')
        }
    }

    localStorage.setItem('fcmToken', token)
    return token
}
