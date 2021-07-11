let properties = {
    "commandEndpoint": window.location.hostname === 'localhost' ? "https://sky-preview.coflnet.com/command" : "/command",
    "websocketEndpoint": "wss://skyblock-backend.coflnet.com/skyblock",
    "refLink": "https://sky.coflnet.com/refed"
}
export default properties;