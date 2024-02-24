if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/serviceWorker.js').then(
            function (registration) {
                setTimeout(() => {
                    loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-app.js')
                    loadScript('https://www.gstatic.com/firebasejs/8.2.2/firebase-messaging.js')
                    pushNotifications(registration)
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
            console.log(styleTags[i])
            if (styleTags[i].classList.contains('darkreader')) {
                console.log('contains')
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
    })
} else {
    console.log('ServiceWorker was not registered')
}

function loadScript(url) {
    let script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = url
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
