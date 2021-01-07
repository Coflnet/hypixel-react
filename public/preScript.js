window.websocket = new WebSocket('wss://skyblock-backend.coflnet.com/skyblock');
window.websocket.onopen = function() {
    console.log("Websocket opened");
}

if (window.location.href.toString().indexOf("localhost") !== -1) {
    console.log("ServiceWorker was not registered. You are on localhost");
} else if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/serviceWorker.js').then(function(registration) {

            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);

            loadScript("https://arc.io/widget.min.js#WK8BPDas");
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