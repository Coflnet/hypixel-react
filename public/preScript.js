if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/serviceWorker.js').then(function(registration) {


            setTimeout(() => {
                loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-app.js');
                loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-messaging.js');
                pushNotifications(registration);
                loadScript("https://arc.io/widget.min.js#WK8BPDas");
            }, 5000)

            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
} else {
    console.log("ServiceWorker was not registered");
}

function loadScript(url) {

    let script = document.createElement("script")
    script.type = "text/javascript";
    script.async = true;
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function pushNotifications(serviceWorkerRegistration) {
    let firebaseConfig = {
        apiKey: "AIzaSyB1yFUo__ZzeTBKw7KRQNHIyhxL7q9cLdI",
        authDomain: "skyblock-300817.firebaseapp.com",
        projectId: "skyblock-300817",
        storageBucket: "skyblock-300817.appspot.com",
        messagingSenderId: "570302890760",
        appId: "1:570302890760:web:60cd30b3753f747d6c62bd"
    };
    waitTilSet();

    function waitTilSet() {
        if (!firebase) {
            setTimeout(waitTilSet, 50); //wait 50 millisecnds then recheck
            return;
        }
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();
        messaging.usePublicVapidKey('BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30')
        messaging.useServiceWorker(serviceWorkerRegistration)

        window.messaging = messaging;
    }
}