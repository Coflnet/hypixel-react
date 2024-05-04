import { ApiRequest, WebsocketHelper, ApiSubscription, RequestType } from './ApiTypes.d'
import cacheUtils from '../utils/CacheUtils'
import api from './ApiHelper'
import { toast } from 'react-toastify'
import { getProperty } from '../utils/PropertiesUtils'
import { getNextMessageId } from '../utils/MessageIdUtils'
import { atobUnicode, btoaUnicode } from '../utils/Base64Utils'

let requests: ApiRequest[] = []
let websocket: WebSocket

let isConnectionIdSet: boolean = false

let apiSubscriptions: ApiSubscription[] = []

function initWebsocket(): void {
    let onWebsocketClose = (): void => {
        var timeout = Math.random() * (5000 - 0) + 0
        setTimeout(() => {
            websocket = getNewWebsocket(true)
        }, timeout)
    }

    // dont show a toast message on websocket errors as this gets spammed when the user for example locks their computer
    let onWebsocketError = (e: Event): void => {
        console.error(e)
    }

    let onOpen = (e: Event, isReconnecting: boolean): void => {
        let _reconnect = function () {
            let toReconnect = [...apiSubscriptions]
            apiSubscriptions = []

            toReconnect.forEach(subscription => {
                subscription.resubscribe(subscription)
            })
        }

        // set the connection id first
        api.setConnectionId().then(() => {
            isConnectionIdSet = true
            if (isReconnecting && sessionStorage.getItem('googleId') !== null) {
                api.loginWithToken(sessionStorage.getItem('googleId')!).then(token => {
                    sessionStorage.setItem('googleId', token)
                    localStorage.setItem('googleId', token)
                    _reconnect()
                })
            }
        })
    }

    let _handleRequestOnMessage = function (response: ApiResponse, request: ApiRequest) {
        let equals = findForEqualSentRequest(request)

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
        console.log('getNewWebsocket is called')
        websocket = new WebSocket(getProperty('websocketEndpoint'))
        websocket.onclose = onWebsocketClose
        websocket.onerror = onWebsocketError
        websocket.onmessage = onWebsocketMessage
        websocket.onopen = e => {
            onOpen(e, isReconnecting)
        }
        ;(window as any).websocket = websocket
        return websocket
    }

    websocket = getNewWebsocket(false)
}

function sendRequest(request: ApiRequest): Promise<void> {
    if (!websocket) {
        initWebsocket()
    }
    let requestString = JSON.stringify(request.data)
    return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
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
    let requestString = JSON.stringify(subscription.data)
    if (_isWebsocketReady(subscription.type, websocket)) {
        subscription.mId = getNextMessageId()
        try {
            subscription.data = btoaUnicode(requestString)
        } catch (error) {
            throw new Error('couldnt btoa this data: ' + subscription.data)
        }
        apiSubscriptions.push(subscription)
        websocket.send(JSON.stringify(subscription))
    } else {
        setTimeout(() => {
            subscribe(subscription)
        }, 500)
    }
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
    return websocket && websocket.readyState === WebSocket.OPEN && (isConnectionIdSet || requestType === RequestType.SET_CONNECTION_ID)
}

export let websocketHelper: WebsocketHelper = {
    sendRequest: sendRequest,
    subscribe: subscribe,
    removeOldSubscriptionByType: removeOldSubscriptionByType
}
