let properties = {}
let isSSR = typeof window === 'undefined'
let isTestRunner = process.env.TEST_RUNNER === 'true' || process.env.NEXT_PUBLIC_TEST_RUNNER === 'true'
properties = {
    commandEndpoint:
        isSSR || window.location.host.startsWith('localhost') || window.location.hostname.includes('pr-env-sky-')
            ? 'https://sky.coflnet.com/command'
            : '/command',
    apiEndpoint:
        isSSR || window.location.host.startsWith('localhost') || window.location.hostname.includes('pr-env-sky-') ? 'https://sky.coflnet.com/api' : '/api',
    websocketEndpoint: isSSR || window.location.host === 'localhost:8008' ? 'ws://localhost:8008/skyblock' : 'wss://sky.coflnet.com/skyblock',
    refLink: 'https://sky.coflnet.com/refed',
    websocketOldEndpoint: 'wss://skyblock-backend.coflnet.com/skyblock',
    feedbackEndpoint: 'https://feedback.coflnet.com/api/',
    isTestRunner
}

export default properties
