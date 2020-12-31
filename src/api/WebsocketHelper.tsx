import { ApiRequest, WebsocketHelper } from "./ApiTypes.d";
import { Base64 } from "js-base64";
import { v4 as generateUUID } from 'uuid';
import { get, set, keys } from 'idb-keyval';
import cookie from 'cookie';
import data from "../components/PriceGraph/PriceGraphConfig";

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
            // cache the response 
            if (!request.type.includes("subscribe")) {
                set(request.type + Base64.decode(request.data), response.data);
            }
        }
    };

    let getNewWebsocket = (): WebSocket => {

        // get UUID of user for websocket or generate a new one
        let cookies = cookie.parse(document.cookie);
        cookies.websocketUUID = cookies.websocketUUID || generateUUID();
        document.cookie = cookie.serialize("websocketUUID", cookies.websocketUUID, { expires: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()) });

        let websocket = new WebSocket(`ws://localhost:8008/skyblock?id=${cookies.websocketUUID}`);
        websocket.onopen = onWebsocketOpen;
        websocket.onclose = onWebsocketClose;
        websocket.onerror = onWebsocketError;
        websocket.onmessage = onWebsocketMessage;
        return websocket;
    }

    return getNewWebsocket();
}

async function sendRequest(request: ApiRequest): Promise<void> {
    let requestJson = JSON.stringify(request.data);
    var cacheValue = await get(request.type + requestJson)

    if (cacheValue) {
        request.resolve(JSON.parse(cacheValue as string));
        return;
    }

    if (websocket.readyState === WebSocket.OPEN) {



        request.mId = requestCounter++;

        try {
            request.data = Base64.encode(requestJson);
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