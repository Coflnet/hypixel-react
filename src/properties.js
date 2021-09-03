let properties = {
    "commandEndpoint": window.location.host === 'localhost:3000' || window.location.hostname.includes("pr-env-sky-") ? "https://sky-commands.coflnet.com/command" : "/command",
    "apiEndpoint": window.location.host === 'localhost:3000' || window.location.hostname.includes("pr-env-sky-") ? "https://sky-commands.coflnet.com/api" : "/api",
    "websocketEndpoint": "wss://sky-commands.coflnet.com/skyblock",
    "refLink": "https://sky.coflnet.com/refed"
}
export default properties;