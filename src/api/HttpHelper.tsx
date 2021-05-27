import { ApiRequest, HttpApi } from "./ApiTypes.d";
import { Base64 } from "js-base64";
import { v4 as generateUUID } from 'uuid';
import { toast } from "react-toastify";
const commandEndpoint = "https://sky.coflnet.com/command";

function sendRequest(request: ApiRequest): Promise<void> {
    let requestString = JSON.stringify(request.data);
    let headers = { 'ConId': getOrGenerateUUid() };
    var url = `${commandEndpoint}/${request.type}/${Base64.encode(requestString)}`;
    if (request.mId)
        url += `/${request.mId}`;
    return fetch(url, { headers })
        .then(response => response.json())
        .then(json => {
            if (json.type === "error")
                toast.error(JSON.parse(json.data).data);
            else
                request.resolve(json)
        });
}

function sendRequestLimitCache(request: ApiRequest, grouping = 1): Promise<void> {
    // invalidate the cache every miniute
    request.mId = Math.round (new Date().getMinutes() / grouping);
    return sendRequest(request);
}

function getOrGenerateUUid(): string {
    let websocketUUID = window.localStorage.getItem("websocketUUID") || generateUUID();
    window.localStorage.setItem("websocketUUID", websocketUUID);
    return websocketUUID;
}


export let httpApi: HttpApi = {
    sendRequest: sendRequest,
    sendLimitedCacheRequest: sendRequestLimitCache
}