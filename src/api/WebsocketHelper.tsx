import { ApiRequest, WebsocketHelper } from "./ApiTypes.d";
import {Base64} from "js-base64";

let requests: ApiRequest[] = [];
let requestCounter: number = 0;
let websocket: WebSocket = initWebsocket();

function initWebsocket(): WebSocket {

    let onWebsocketOpen = (): void => {
        console.log("Websocket open");
    };

    let onWebsocketClose = (): void => {
        console.log("Websocket closed");
        console.log("reopening Websocket")
        websocket = getNewWebsocket();
    };

    let onWebsocketError = (e: Event): void => {
        console.error(e);
    };

    let onWebsocketMessage = (e: MessageEvent): void => {
        var response: any = JSON.parse(e.data);
        let request: ApiRequest | undefined = requests.find(e => e.mId === response.mId);
        if (!request) {
            return;
        }
        delete response.mId;
        if (response.type.includes("error")) {
            request.reject(response.data);
        } else {
            request.resolve(JSON.parse(response.data));
        }
    };

    let getNewWebsocket = (): WebSocket => {
        let websocket = new WebSocket("wss://skyblock-backend.coflnet.com/skyblock");
        websocket.onopen = onWebsocketOpen;
        websocket.onclose = onWebsocketClose;
        websocket.onerror = onWebsocketError;
        websocket.onmessage = onWebsocketMessage;
        return websocket;
    }

    return getNewWebsocket();
}

function sendRequest(request: ApiRequest): void {
    if (websocket.readyState === WebSocket.OPEN) {
        request.mId = requestCounter++;

        try {
            request.data = Base64.encode(JSON.stringify(request.data));
        } catch (error) {
            throw new Error("couldnt btoa this data: " + request.data);
        }
        requests.push(request);
        websocket.send(JSON.stringify(request));
    } else if (websocket.readyState === WebSocket.CONNECTING) {
        setTimeout(() => {
            sendRequest(request);
        }, 1000);
    }
}

export let websocketHelper: WebsocketHelper = {
    sendRequest: sendRequest
}