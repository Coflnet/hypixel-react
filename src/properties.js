let properties = {
    "commandEndpoint": window.location.hostname === 'localhost' || window.location.hostname.includes("temp-env-sky-")? "https://sky-preview.coflnet.com/command" : "/command",
    "websocketEndpoint": "wss://skyblock-backend.coflnet.com/skyblock",
    "refLink": "https://sky.coflnet.com/refed"
}
export default properties;