import { ApiRequest, WebsocketHelper, ApiSubscription } from "./ApiTypes.d";
import { Base64 } from "js-base64";
import cacheUtils from '../utils/CacheUtils';
import api from "./ApiHelper";
import { toast } from "react-toastify";

let requests: ApiRequest[] = [];
let requestCounter: number = 0;
let websocket: WebSocket;

let apiSubscriptions: ApiSubscription[] = [];

function initWebsocket(): void {

    let onWebsocketClose = (): void => {
        console.log("Websocket closed");
        console.log("reopening Websocket")
        websocket = getNewWebsocket();
    };

    let onWebsocketError = (e: Event): void => {
        console.error(e);
    };

    let _handleRequestOnMessage = function (response: ApiResponse, request: ApiRequest) {
        let equals = findForEqualSentRequest(request);

        if (response.type.includes("error")) {
            request.reject(JSON.parse(response.data));
            equals.forEach(equal => equal.reject(JSON.parse(response.data)));
        } else {
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
        let parsedResponse = JSON.parse(response.data);
        console.log(response)
        console.log(response.type == "error")
        if (response.type == "error")
            toast.error(parsedResponse.data);
        else
            subscription.callback(parsedResponse);
    }

    let onWebsocketMessage = (e: MessageEvent): void => {
        let response: ApiResponse = JSON.parse(e.data);
        let request: ApiRequest | undefined = requests.find(e => e.mId === response.mId);
        let subscription: ApiSubscription | undefined = apiSubscriptions.find(e => e.mId === response.mId);

        if (!request && !subscription) {
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

        if (!websocket) {
            websocket = (window as any).websocket;
            api.setConnectionId();
            cacheUtils.checkForCacheClear();
        } else {
            // reconnect
            websocket = new WebSocket('wss://skyblock-backend.coflnet.com/skyblock');
            api.setConnectionId();
            (window as any).websocket = websocket;
        }
        websocket.onclose = onWebsocketClose;
        websocket.onerror = onWebsocketError;
        websocket.onmessage = onWebsocketMessage;
        return websocket;
    }

    websocket = getNewWebsocket();
}

function sendRequest(request: ApiRequest): Promise<void> {
    let requestString = JSON.stringify(request.data);
    return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
        if (cacheValue) {
            request.resolve(cacheValue);
            return;
        }

        if (websocket && websocket.readyState === WebSocket.OPEN) {
            request.mId = requestCounter++;

            try {
                request.data = Base64.encode(requestString);
            } catch (error) {
                throw new Error("couldnt btoa this data: " + request.data);
            }

            // if a equal requests are already sent, dont really send more
            // at onMessage answer all
            let equals = findForEqualSentRequest(request);
            if (equals.length > 0) {
                requests.push(request);
                return;
            }

            requests.push(request);
            websocket.send(JSON.stringify(request));
        } else if (!websocket || websocket.readyState === WebSocket.CONNECTING) {
            websocket.onopen = function () {
                console.log("websocket opened");
                sendRequest(request);
            }
        }
    })
}

function subscribe(subscription: ApiSubscription): void {

    if (websocket && websocket.readyState === WebSocket.OPEN) {
        subscription.mId = requestCounter++;

        try {
            subscription.data = Base64.encode(subscription.data);
        } catch (error) {
            throw new Error("couldnt btoa this data: " + subscription.data);
        }
        apiSubscriptions.push(subscription);
        websocket.send(JSON.stringify(subscription))

    } else if (!websocket || websocket.readyState === WebSocket.CONNECTING) {
        websocket.onopen = function () {
            console.log("websocket opened");
            subscribe(subscription);
        }
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

export let websocketHelper: WebsocketHelper = {
    sendRequest: sendRequest,
    init: initWebsocket,
    subscribe: subscribe
}