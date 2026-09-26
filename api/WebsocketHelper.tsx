import { ApiRequest, WebsocketHelper, ApiSubscription, RequestType } from './ApiTypes.d'
import cacheUtils from '../utils/CacheUtils'
import api from './ApiHelper'
import { toast } from 'react-toastify'
import { getProperty } from '../utils/PropertiesUtils'
import { getNextMessageId } from '../utils/MessageIdUtils'
import { atobUnicode, btoaUnicode } from '../utils/Base64Utils'

let requests: ApiRequest[] = []
let websocket: WebSocket
let reconnectTimeout: ReturnType<typeof setTimeout> | undefined

let isConnectionIdSet: boolean = false
let isSessionReady = false
let connectionWatchdog: ReturnType<typeof setInterval> | undefined

let apiSubscriptions: ApiSubscription[] = []

function initWebsocket(): void {
    let lastMessageAt = Date.now()
    let connectedAt = Date.now()

    let onWebsocketClose = (): void => {
        if (reconnectTimeout !== undefined) return
        isConnectionIdSet = false
        isSessionReady = false
        // Retire the socket immediately, even if a half-open connection never emits close.
        websocket.onclose = null
        websocket.onerror = null
        websocket.onmessage = null
        websocket.onopen = null
        websocket.close()
        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = undefined
            websocket = getNewWebsocket(true)
        }, Math.random() * 5000)
        // A lost setup reply must not leave a matching request blocking the next handshake.
        const setupRequests = requests.filter(request => [RequestType.SET_CONNECTION_ID, RequestType.LOGIN_WITH_TOKEN].includes(request.type))
        removeSentRequests(setupRequests)
        setupRequests.forEach(request => request.reject({ message: 'Connection interrupted. Reconnecting.' }))
    }

    let onOpen = async (socket: WebSocket, isReconnecting: boolean): Promise<void> => {
        try {
            await api.setConnectionId()
            if (socket !== websocket || reconnectTimeout !== undefined) return
            isConnectionIdSet = true
            if (isReconnecting && sessionStorage.getItem('googleId') !== null) {
                const token = await api.loginWithToken(sessionStorage.getItem('googleId')!)
                if (socket !== websocket || reconnectTimeout !== undefined) return
                sessionStorage.setItem('googleId', token)
                localStorage.setItem('googleId', token)
            }
            isSessionReady = true
            if (isReconnecting) {
                const toReconnect = [...apiSubscriptions]
                apiSubscriptions = []
                toReconnect.forEach(subscription => subscription.resubscribe(subscription))
            }
        } catch {
            if (socket === websocket) onWebsocketClose()
        }
    }

    let _handleRequestOnMessage = function (response: ApiResponse, request: ApiRequest) {
        let equals = findForEqualSentRequest(request)

        if (response.type === 'display') {
            let parsedData = JSON.parse(response.data)
            if (typeof toast[parsedData.type] === 'function') {
                toast[parsedData.type](parsedData.message)
            } else {
                toast.info(parsedData.message)
            }
            return
        }

        if (response.type.includes('error')) {
            request.reject(JSON.parse(response.data))
            equals.forEach(equal => equal.reject(JSON.parse(response.data)))
        } else {
            if (response.data === '') {
                response.data = '""'
            }
            let parsedResponse = JSON.parse(response.data)
            request.resolve(parsedResponse)
            equals.forEach(equal => equal.resolve(parsedResponse))
            // cache the response
            let maxAge = response.maxAge
            cacheUtils.setIntoCache(request.type, atobUnicode(request.data), parsedResponse, maxAge)
        }

        removeSentRequests([...equals, request])
    }

    let _handleSubscriptionOnMessage = function (response: ApiResponse, subscription: ApiSubscription) {
        try {
            response.data = JSON.parse(response.data)
        } catch (e) {}

        if (response.type === 'error') {
            subscription.onError(response.data.message)
        } else {
            subscription.callback(response)
        }
    }

    let onWebsocketMessage = (e: MessageEvent): void => {
        lastMessageAt = Date.now()
        let response: ApiResponse = JSON.parse(e.data)
        let request: ApiRequest | undefined = requests.find(e => e.mId === response.mId)
        let subscription: ApiSubscription | undefined = apiSubscriptions.find(e => e.mId === response.mId)

        if (!request && !subscription) {
            return
        }

        if (request) {
            _handleRequestOnMessage(response, request)
        }
        if (subscription) {
            _handleSubscriptionOnMessage(response, subscription)
        }
    }

    let getNewWebsocket = (isReconnecting: boolean): WebSocket => {
        connectedAt = lastMessageAt = Date.now()
        websocket = new WebSocket(getProperty('websocketEndpoint'))
        websocket.onclose = onWebsocketClose
        websocket.onerror = onWebsocketClose
        websocket.onmessage = onWebsocketMessage
        const socket = websocket
        websocket.onopen = () => {
            void onOpen(socket, isReconnecting)
        }
        ;(window as any).websocket = websocket
        return websocket
    }

    websocket = getNewWebsocket(false)
    connectionWatchdog = setInterval(() => {
        // The server sends nextUpdate/ping even when filters match no flips.
        const timedOut = isSessionReady ? Date.now() - lastMessageAt > 90_000 : Date.now() - connectedAt > 15_000
        if (timedOut) onWebsocketClose()
    }, 5000)
}

function sendRequest(request: ApiRequest): Promise<void> {
    if (!websocket) {
        initWebsocket()
    }
    let requestString = JSON.stringify(request.data)
    return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
        // Navigation can queue an unsubscribe while offline, then start a newer feed.
        if (
            request.type === RequestType.UNSUBSCRIBE_FLIPS &&
            apiSubscriptions.some(subscription => [RequestType.SUBSCRIBE_FLIPS, RequestType.SUBSCRIBE_FLIPS_ANONYM].includes(subscription.type))
        ) {
            request.resolve()
            return
        }
        if (cacheValue) {
            request.resolve(cacheValue)
            return
        }

        if (_isWebsocketReady(request.type, websocket)) {
            request.mId = getNextMessageId()
            let equals = findForEqualSentRequest(request)
            if (equals.length > 0) {
                requests.push(request)
                return
            }
            requests.push(request)
            prepareDataBeforeSend(request)
            websocket.send(JSON.stringify(request))
        } else {
            setTimeout(() => {
                sendRequest(request)
            }, 500)
            return
        }
    })
}

function prepareDataBeforeSend(request: ApiRequest) {
    try {
        request.data = btoaUnicode(JSON.stringify(request.data))
    } catch (error) {
        throw new Error('couldnt btoa this data: ' + request.data)
    }
}

function removeOldSubscriptionByType(type: RequestType) {
    for (let i = apiSubscriptions.length - 1; i >= 0; i--) {
        let subscription = apiSubscriptions[i]
        if (subscription.type === type) {
            apiSubscriptions.splice(i, 1)
        }
    }
}

function subscribe(subscription: ApiSubscription): void {
    if (!websocket) {
        initWebsocket()
    }
    apiSubscriptions.push(subscription)
    const sendWhenReady = () => {
        if (!apiSubscriptions.includes(subscription)) return
        if (_isWebsocketReady(subscription.type, websocket) && isSessionReady) {
            subscription.mId = getNextMessageId()
            websocket.send(JSON.stringify({ ...subscription, data: btoaUnicode(JSON.stringify(subscription.data)) }))
        } else {
            setTimeout(sendWhenReady, 500)
        }
    }
    sendWhenReady()
}

function findForEqualSentRequest(request: ApiRequest) {
    return requests.filter(r => {
        return r.type === request.type && r.data === request.data && r.mId !== request.mId
    })
}

function removeSentRequests(toDelete: ApiRequest[]) {
    requests = requests.filter(request => {
        for (let i = 0; i < toDelete.length; i++) {
            if (toDelete[i].mId === request.mId) {
                return false
            }
        }
        return true
    })
}

function _isWebsocketReady(requestType: string, websocket: WebSocket) {
    return (
        websocket &&
        websocket.readyState === WebSocket.OPEN &&
        (requestType === RequestType.SET_CONNECTION_ID || (isConnectionIdSet && (isSessionReady || requestType === RequestType.LOGIN_WITH_TOKEN)))
    )
}

function disconnect(): void {
    clearInterval(connectionWatchdog)
    connectionWatchdog = undefined
    if (reconnectTimeout !== undefined) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = undefined
    }
    if (websocket) {
        websocket.onclose = null
        websocket.onerror = null
        websocket.onmessage = null
        websocket.onopen = null
        websocket.close()
    }
    isConnectionIdSet = false
    isSessionReady = false
    websocket = undefined!
    requests = []
    apiSubscriptions = []
}

export let websocketHelper: WebsocketHelper = {
    sendRequest: sendRequest,
    subscribe: subscribe,
    removeOldSubscriptionByType: removeOldSubscriptionByType,
    disconnect: disconnect
}
