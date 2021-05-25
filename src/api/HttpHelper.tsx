import { ApiRequest, HttpApi, WebsocketHelper } from "./ApiTypes.d";
import { Base64 } from "js-base64";
import api from "./ApiHelper";
import { v4 as generateUUID } from 'uuid';


function init(): void {

}

function sendRequest(request: ApiRequest): Promise<void> {
    let requestString = JSON.stringify(request.data);
    let headers = {'ConId':getOrGenerateUUid()};
    var url = `https://sky.coflnet.com/command/${request.type}/${Base64.encode(requestString)}`;
    if(request.mId)
        url += `/${request.mId}`;
    return fetch(url,{headers})
    .then(response => response.json())
    .then(json => request.resolve(json));
}

function sendRequestLimitCache(request: ApiRequest, grouping = 1): Promise<void> {
    // invalidate the cache every miniute
    request.mId = new Date().getMinutes() / grouping;
    return sendRequest(request);
}

function getOrGenerateUUid() : string {
    let websocketUUID = window.localStorage.getItem("websocketUUID") || generateUUID();
    window.localStorage.setItem("websocketUUID", websocketUUID);
    return websocketUUID;
}


export let httpApi:  HttpApi = {
    sendRequest: sendRequest,
    init: init,
    sendLimitedCacheRequest: sendRequestLimitCache
}