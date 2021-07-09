let properties = {
    "commandEndpoint": window.location.hostname === 'localhost' ? "https://sky-preview.flou21.de/command" : "/command",
    "websocketEndpoint": "wss://skyblock-backend.coflnet.com/skyblock"
}
export default properties;