let properties = {
    "commandEndpoint": window.location.host === 'localhost:3000' || window.location.hostname.includes("pr-env-sky-") ? "https://sky-preview.coflnet.com/command" : "/command",
    "apiEndpoint": window.location.host === 'localhost:3000' || window.location.hostname.includes("pr-env-sky-") ? "https://sky-preview.coflnet.com/api" : "/api",
    "websocketEndpoint": "wss://skyblock-backend.coflnet.com/skyblock",
    "refLink": "https://sky.coflnet.com/refed"
}
export default properties;