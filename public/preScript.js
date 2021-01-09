window.websocket = new WebSocket('wss://skyblock-backend.coflnet.com/skyblock');
window.websocket.onopen = function() {
    console.log("Websocket opened");
}

if (window.location.href.toString().indexOf("localhost") !== -1 && false) {
    console.log("ServiceWorker was not registered. You are on localhost");
} else if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/serviceWorker.js').then(function(registration) {

            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);

            loadScript("https://arc.io/widget.min.js#WK8BPDas");


            loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-app.js');
            loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-messaging.js');

            setTimeout(() => pushNotifications(registration), 3000);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
} else {
    console.log("ServiceWorker was not registered");
}

function loadScript(url) {

    var script = document.createElement("script")
    script.type = "text/javascript";
    script.async = true;
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

async function pushNotifications(serviceWorkerRegistration) {
    var firebaseConfig = {
        apiKey: "AIzaSyB1yFUo__ZzeTBKw7KRQNHIyhxL7q9cLdI",
        authDomain: "skyblock-300817.firebaseapp.com",
        projectId: "skyblock-300817",
        storageBucket: "skyblock-300817.appspot.com",
        messagingSenderId: "570302890760",
        appId: "1:570302890760:web:60cd30b3753f747d6c62bd"
    };
    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging so that it can handle background
    // messages.
    const messaging = firebase.messaging();
    messaging.usePublicVapidKey('BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30')
    messaging.useServiceWorker(serviceWorkerRegistration)
    const token = await messaging.getToken({
        vapidKey: "BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30"
    });
    localStorage.fcmToken = token;

    messaging.onMessage(function(payload) {
        // TODO: show the notification on the site
        console.log("on Message", payload);
    });
}