/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js')

const CACHE_EXPIRATION_ONE_DAY = 60 * 60 * 24
const CACHE_EXPIRATION_ONE_WEEK = 60 * 60 * 24 * 7
const CACHE_EXPIRATION_ONE_YEAR = 60 * 60 * 24 * 365

// Service worker version - increment to force cache refresh
const SW_VERSION = '2.0.0'

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
workbox.setConfig({
    debug: false
})

// Skip waiting and claim clients immediately on install
self.addEventListener('install', (event) => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Claim all clients immediately
            clients.claim(),
            // Clear old caches that might cause issues
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter((key) => {
                        // Clear js and css caches on new SW version
                        return key.includes('workbox:js') || key.includes('workbox:css')
                    }).map((key) => caches.delete(key))
                )
            })
        ])
    )
})

// cache js files - use staleWhileRevalidate to always try to get fresh content
// but fall back to cache if network fails
workbox.routing.registerRoute(
    new RegExp('.*.js$'),
    workbox.strategies.staleWhileRevalidate({
        cacheName: 'workbox:js',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: CACHE_EXPIRATION_ONE_DAY,
                maxEntries: 50
            })
        ]
    })
)

// cache css files - use staleWhileRevalidate for fresher content
workbox.routing.registerRoute(
    // Cache CSS files
    new RegExp('.*.css$'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:css',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: CACHE_EXPIRATION_ONE_DAY,
                maxEntries: 30
            })
        ]
    })
)

// cache generall images
workbox.routing.registerRoute(
    new RegExp('.*.(?:png|jpg|jpeg|svg|gif)$'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: CACHE_EXPIRATION_ONE_YEAR
            })
        ]
    })
)

// cache .ico files
workbox.routing.registerRoute(
    new RegExp('.*.ico$'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: CACHE_EXPIRATION_ONE_YEAR
            })
        ]
    })
)

// cache images from sky.lea.moe and craftatar
workbox.routing.registerRoute(
    // Cache image files
    new RegExp('(.*sky.lea.moe.*|.*sky.coflnet.com/avatars.*)'),
    // Use the cache if it's available
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
        plugins: [
            new workbox.expiration.Plugin({
                maxAgeSeconds: CACHE_EXPIRATION_ONE_YEAR
            })
        ]
    })
)

importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js')

// Your web app's Firebase configuration
let firebaseConfig = {
    apiKey: 'AIzaSyB1yFUo__ZzeTBKw7KRQNHIyhxL7q9cLdI',
    authDomain: 'skyblock-300817.firebaseapp.com',
    projectId: 'skyblock-300817',
    storageBucket: 'skyblock-300817.appspot.com',
    messagingSenderId: '570302890760',
    appId: '1:570302890760:web:60cd30b3753f747d6c62bd'
}
firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()
messaging.usePublicVapidKey('BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30')
messaging.onBackgroundMessage(function (payload) {
    const request = indexedDB.open('keyval-store', 1)
    let db
    if (payload.data?.type != 'auction') {
        return
    }

    let auction = JSON.parse(payload.data.auction)

    let key = `auctionDetails\"${auction.uuid}\"`
    let data = {
        expireTimeStamp: new Date().getTime() + 60 * 1000,
        response: auction
    }

    request.onsuccess = function () {
        db = this.result

        db.transaction('keyval', 'readwrite').objectStore('keyval').add(JSON.stringify(data), key)
    }
})

//Code for adding event on click of notification
self.addEventListener('notificationclick', function (event) {
    let url = event.notification.data.url
    event.notification.close()
    event.waitUntil(
        clients
            .matchAll({
                type: 'window'
            })
            .then(windowClients => {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    let client = windowClients[i]
                    // If so, just focus it.
                    if (client.url === url && 'focus' in client) {
                        return client.focus()
                    }
                }
                // If not, then open the target URL in a new window/tab.
                if (clients.openWindow) {
                    return clients.openWindow(url)
                }
            })
    )
})
