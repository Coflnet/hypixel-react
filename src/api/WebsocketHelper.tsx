import { ApiRequest, WebsocketHelper, ApiSubscription, RequestType } from "./ApiTypes.d";
import { Base64 } from "js-base64";
import cacheUtils from '../utils/CacheUtils';
import api from "./ApiHelper";
import { toast } from "react-toastify";
import { getProperty } from '../utils/PropertiesUtils';
import { getNextMessageId } from "../utils/MessageIdUtils";
import { refreshToken, wasAlreadyLoggedIn } from "../utils/GoogleUtils";

let requests: ApiRequest[] = [];
let websocket: WebSocket;
let tempOldWebsocket: WebSocket;

let isConnectionIdSet: boolean = false;

let apiSubscriptions: ApiSubscription[] = [];

function initWebsocket(): void {

    let onWebsocketClose = (): void => {
        var timeout = (Math.random() * (5000 - 0)) + 0;
        setTimeout(() => {
            websocket = getNewWebsocket();
        }, timeout)
    };

    let onWebsocketError = (e: Event): void => {
        console.error(e);
    };

    let onOpen = (e: Event): void => {

        let _reconnect = function () {
            apiSubscriptions.forEach(subscription => {
                subscribe(subscription, true);
            })
        }

        // set the connection id first 
        api.setConnectionId().then(() => {
            isConnectionIdSet = true;
            let googleAuthObj = (window as any).googleAuthObj;
            if (wasAlreadyLoggedIn() && googleAuthObj) {
                if (new Date(googleAuthObj.tokenObj.expires_at).getTime() <= new Date().getTime()) {
                    refreshToken(googleAuthObj).then(refreshToken => {
                        api.setGoogle(refreshToken.id_token).then(() => {
                            _reconnect();
                        })
                    })
                } else {
                    api.setGoogle(googleAuthObj.tokenId).then(() => {
                        _reconnect();
                    })
                }
            } else {
                _reconnect();
            }
        })
    }

    let _handleRequestOnMessage = function (response: ApiResponse, request: ApiRequest) {
        let equals = findForEqualSentRequest(request);

        if (response.type.includes("error")) {
            request.reject(JSON.parse(response.data));
            equals.forEach(equal => equal.reject(JSON.parse(response.data)));
        } else {
            if (response.data === "") {
                response.data = "\"\"";
            }
            let parsedResponse = JSON.parse(response.data);
            request.resolve(parsedResponse);
            equals.forEach(equal => equal.resolve(parsedResponse));
            // cache the response 
            let maxAge = response.maxAge;
            cacheUtils.setIntoCache(request.type, Base64.decode(request.data), parsedResponse, maxAge);
        }

        removeSentRequests([...equals, request]);
    }

    let _handleSubscriptionOnMessage = function (response: ApiResponse, subscription: ApiSubscription) {
        try {
            response.data = JSON.parse(response.data);
        } catch (e) { }

        if (response.type === "error") {
            toast.error(response.data.Message);
        } else {
            subscription.callback(response);
        }
    }

    let onWebsocketMessage = (e: MessageEvent): void => {
        let response: ApiResponse = JSON.parse(e.data);
        let request: ApiRequest | undefined = requests.find(e => e.mId === response.mId);
        let subscription: ApiSubscription | undefined = apiSubscriptions.find(e => e.mId === response.mId);

        if (!request && !subscription) {
            return;
        }

        if(request?.type === RequestType.SET_GOOGLE && (e.target as any).url === tempOldWebsocket.url){
            return;
        }

        if (request) {
            _handleRequestOnMessage(response, request);
        }
        if (subscription) {
            _handleSubscriptionOnMessage(response, subscription);
        }

    };

    let getNewWebsocket = (): WebSocket => {

        websocket = new WebSocket(getProperty("websocketEndpoint"));
        websocket.onclose = onWebsocketClose;
        websocket.onerror = onWebsocketError;
        websocket.onmessage = onWebsocketMessage;
        websocket.onopen = onOpen;
        return websocket;
    }

    let getNewOldWebsocket = (): WebSocket => {

        tempOldWebsocket = new WebSocket(getProperty("websocketOldEndpoint"));
        tempOldWebsocket.onclose = function () {
            var timeout = (Math.random() * (5000 - 0)) + 0;
            setTimeout(() => {
                tempOldWebsocket = getNewOldWebsocket();
            }, timeout)
        };
        tempOldWebsocket.onerror = onWebsocketError;
        tempOldWebsocket.onmessage = onWebsocketMessage;
        tempOldWebsocket.onopen = onOpen;
        return tempOldWebsocket;
    }

    websocket = getNewWebsocket();
    tempOldWebsocket = getNewOldWebsocket();
}

function sendRequest(request: ApiRequest): Promise<void> {
    if (!websocket) {
        initWebsocket();
    }
    let requestString = JSON.stringify(request.data);
    return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
        if (cacheValue) {
            request.resolve(cacheValue);
            return;
        }

        let paymentRequests = [
            RequestType.PAYMENT_SESSION,
            RequestType.GET_STRIPE_PRODUCTS,
            RequestType.GET_STRIPE_PRICES,
            RequestType.VALIDATE_PAYMENT_TOKEN,
            RequestType.PAYPAL_PAYMENT,
            RequestType.SET_REF,
        ]
        if (paymentRequests.findIndex(p => p === request.type) !== -1) {
            if (_isWebsocketReady(request.type, tempOldWebsocket)) {
                request.mId = getNextMessageId()
                let equals = findForEqualSentRequest(request)
                if (equals.length > 0) {
                    requests.push(request)
                    return
                }
                requests.push(request)
                prepareDataBeforeSend(request)
                tempOldWebsocket.send(JSON.stringify(request))
            } else {
                setTimeout(() => {
                    sendRequest(request)
                }, 500)
                return;
            }
        } else {
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
                return;
            }

            if (request.type === RequestType.SET_GOOGLE) {
               retrySend(tempOldWebsocket, request);
            }
        }

    })
}

function retrySend(websocket, request){
    if(_isWebsocketReady(request.type, websocket)){
        websocket.send(JSON.stringify(request));
    }else{
        setTimeout(() => {
            retrySend(websocket, request);
        }, 500)
    }
}

function prepareDataBeforeSend(request: ApiRequest) {
    try {
        request.data = Base64.encode(JSON.stringify(request.data));
    } catch (error) {
        throw new Error("couldnt btoa this data: " + request.data);
    }
}

function removeOldSubscriptionByType(type: RequestType) {
    for (let i = apiSubscriptions.length - 1; i >= 0; i--) {
        let subscription = apiSubscriptions[i];
        if (subscription.type === type) {
            apiSubscriptions.splice(i, 1);
        }
    }
}

function subscribe(subscription: ApiSubscription, resub?: boolean): void {
    if (!websocket) {
        initWebsocket();
    }
    let requestString = JSON.stringify(subscription.data);
    if (_isWebsocketReady(subscription.type, websocket)) {
        subscription.mId = getNextMessageId();
        if (!resub) {
            try {
                subscription.data = Base64.encode(requestString);
            } catch (error) {
                throw new Error("couldnt btoa this data: " + subscription.data);
            }
            apiSubscriptions.push(subscription);
        }
        websocket.send(JSON.stringify(subscription))

    } else {
        setTimeout(() => {
            subscribe(subscription);
        }, 500);
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
                return false;
            }
        }
        return true;
    })
}

function _isWebsocketReady(requestType: string, websocket: WebSocket) {
    return websocket && websocket.readyState === WebSocket.OPEN && (isConnectionIdSet || requestType === RequestType.SET_CONNECTION_ID);
}

export let websocketHelper: WebsocketHelper = {
    sendRequest: sendRequest,
    subscribe: subscribe,
    removeOldSubscriptionByType: removeOldSubscriptionByType
}