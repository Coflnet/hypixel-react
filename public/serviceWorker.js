/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
importScripts("https://arc.io/arc-sw-core.js");

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object

workbox.setConfig({
    debug: false
});

// 
// https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.routing#registerRoute
workbox.routing.registerRoute(
    new RegExp('.*\.html/'),
    // https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies
    workbox.strategies.cacheFirst({
        cacheName: 'workbox:html',
    })
);

// cache js files
workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.cacheFirst({
        cacheName: 'workbox:js',
    })
);

// cache css files
workbox.routing.registerRoute(
    // Cache CSS files
    new RegExp('.*\.css'),
    // Use cache but update in the background ASAP
    workbox.strategies.cacheFirst({
        // Use a custom cache name
        cacheName: 'workbox:css',
    })
);

// cache generall images
workbox.routing.registerRoute(
    new RegExp('.*\.(?:png|jpg|jpeg|svg|gif)'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
    })
);

// cache .ico files
workbox.routing.registerRoute(
    new RegExp('.*\.ico'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
    })
);

// cache images from sky.lea.moe and craftatar
workbox.routing.registerRoute(
    // Cache image files
    new RegExp('(.*sky.lea.moe.*|.*crafatar.com\/avatars.*)'),
    // Use the cache if it's available
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
    })
);

importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js');

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB1yFUo__ZzeTBKw7KRQNHIyhxL7q9cLdI",
    authDomain: "skyblock-300817.firebaseapp.com",
    projectId: "skyblock-300817",
    storageBucket: "skyblock-300817.appspot.com",
    messagingSenderId: "570302890760",
    appId: "1:570302890760:web:60cd30b3753f747d6c62bd"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.usePublicVapidKey('BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30')
messaging.onBackgroundMessage(function(payload) {
    const request = indexedDB.open('keyval-store', 1);
    var db;
    if (payload.data.type != "auction") {
        console.log("unkown notification type" + payload.data.type);
        return;
    }

    var auction = JSON.parse(payload.data.auction);


    var key = `auctionDetails\"${auction.uuid}\"`;
    var data = {
        expireTimeStamp: (new Date()).getTime() + 60 * 1000,
        response: auction
    }

    request.onsuccess = function() {
        db = this.result;

        db.transaction('keyval', "readwrite")
            .objectStore('keyval')
            .add(JSON.stringify(data), key);
    };
});

//Code for adding event on click of notification
self.addEventListener('notificationclick', function(event) {
    let url = event.notification.data.url;
    event.notification.close();
    event.waitUntil(
        clients.matchAll({
            type: 'window'
        }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});