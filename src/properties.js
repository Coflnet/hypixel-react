let properties = {
    "commandEndpoint": window.location.host === 'localhost:3000' || window.location.hostname.includes("pr-env-sky-") ? "https://sky.coflnet.com/command" : "/command",
    "apiEndpoint": window.location.host === 'localhost:3000' || window.location.hostname.includes("pr-env-sky-") ? "https://sky.coflnet.com/api" : "/api",
    "websocketEndpoint": "wss://sky.coflnet.com/skyblock",
    "refLink": "https://sky.coflnet.com/refed",
    "websocketOldEndpoint": "wss://skyblock-backend.coflnet.com/skyblock",
    "feedbackEndpoint": "https://feedback.coflnet.com/api/"
}
export default properties;