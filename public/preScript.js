if ('serviceWorker' in navigator) {
    // this script is injected after hydration (afterInteractive), so the window "load" event may have
    // already fired by the time it runs. in that case addEventListener('load') would never trigger and
    // window.messaging would never be set, so run immediately when the document is already complete.
    if (document.readyState === 'complete') {
        registerServiceWorker()
    } else {
        window.addEventListener('load', registerServiceWorker)
    }
} else {
    console.log('ServiceWorker was not registered')
}

function registerServiceWorker() {
    navigator.serviceWorker.register('/serviceWorker.js').then(
            function (registration) {
                setTimeout(() => {
                    // load firebase-app before firebase-messaging: as two async scripts their execution order
                    // is a race, and firebase-messaging throws ("be sure to load firebase-app.js first" /
                    // reading 'INTERNAL') when it runs first. chaining the loads makes the order deterministic.
                    loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-app.js', function () {
                        loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-messaging.js', function () {
                            pushNotifications(registration)
                        })
                    })
                }, 5000)

                // Registration was successful
                console.log('ServiceWorker registration successful with scope: ', registration.scope)
            },
            function (err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err)
            }
        )

        // this is a workaround for the darkreader extension as it styles the checkboxes in a way that makes them invisible
        // sadly the extension doesn't set it's meta tag correctly to detect it (it's only set the moment you switch something in the extension)
        var styleTags = document.head.getElementsByTagName('style')
        for (var i = 0; i < styleTags.length; i++) {
            if (styleTags[i].classList.contains('darkreader')) {
                var styleElement = document.createElement('style')
                document.head.appendChild(styleElement)

                let css = `
                .form-check-input {
                    background-color: #444;
                    border: 2px solid rgb(84, 91, 94);
                }`
                styleElement.appendChild(document.createTextNode(css))
                break
            }
        }
}

function loadScript(url, onLoad) {
    let script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = url
    if (onLoad) {
        script.onload = onLoad
    }
    document.getElementsByTagName('head')[0].appendChild(script)
}

function pushNotifications(serviceWorkerRegistration) {
    let firebaseConfig = {
        apiKey: 'AIzaSyB1yFUo__ZzeTBKw7KRQNHIyhxL7q9cLdI',
        authDomain: 'skyblock-300817.firebaseapp.com',
        projectId: 'skyblock-300817',
        storageBucket: 'skyblock-300817.appspot.com',
        messagingSenderId: '570302890760',
        appId: '1:570302890760:web:60cd30b3753f747d6c62bd'
    }
    waitTilSet()

    function waitTilSet() {
        if (!window.firebase || !window.firebase.messaging) {
            setTimeout(waitTilSet, 50) //wait 50 millisecnds then recheck
            return
        }
        window.firebase.initializeApp(firebaseConfig)
        const messaging = window.firebase.messaging()
        messaging.usePublicVapidKey('BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30')
        messaging.useServiceWorker(serviceWorkerRegistration)

        window.messaging = messaging
    }
}
