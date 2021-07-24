import { ApiRequest, HttpApi } from "./ApiTypes.d";
import { Base64 } from "js-base64";
import { v4 as generateUUID } from 'uuid';
import cacheUtils from "../utils/CacheUtils";
import { getProperty } from "../utils/PropertiesUtils";
import { getNextMessageId } from "../utils/MessageIdUtils";

const commandEndpoint = getProperty("commandEndpoint");
let requests: ApiRequest[] = [];

/**
 * Sends http-Request to the backend
 * @param request The request-Object
 * @param cacheInvalidationGrouping A number which is appended to the url to be able to invalidate the cache
 * @returns A emty promise (the resolve/reject Method of the request-Object is called)
 */
function sendRequest(request: ApiRequest, cacheInvalidationGrouping?: number): Promise<void> {
    request.mId = getNextMessageId();
    let requestString = JSON.stringify(request.data);
    let headers = { 'ConId': getOrGenerateUUid() };
    var url = `${commandEndpoint}/${request.type}/${Base64.encode(requestString)}`;

    if (cacheInvalidationGrouping) {
        url += `/${cacheInvalidationGrouping}`;
    }

    return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
        if (cacheValue) {
            request.resolve(cacheValue);
            return;
        }

        try {
            request.data = Base64.encode(requestString);
        } catch (error) {
            throw new Error("couldnt btoa this data: " + request.data);
        }

        // don't resend in progress requests
        let equals = findForEqualSentRequest(request);
        if (equals.length > 0) {
            requests.push(request);
            return;
        }

        requests.push(request);
        return fetch(url, { headers })
            .then(response => {
                let parsed;
                try {
                    parsed = response.json();
                } catch (error) {
                    request.reject({ Message: "Unnown error" });
                }
                if (!isResponseValid(response)) {
                    parsed.then((parsedResponse) => {
                        request.reject(parsedResponse);
                    })
                    return;
                }
                return parsed;
            }).then(parsedResponse => {
                if (!parsedResponse || parsedResponse.Slug !== undefined) {
                    request.reject(parsedResponse);
                    return;
                }
                request.resolve(parsedResponse)
                let equals = findForEqualSentRequest(request);
                equals.forEach(equal => {
                    equal.resolve(parsedResponse)
                });
                // all http answers are valid for 60 sec
                let maxAge = 60;
                cacheUtils.setIntoCache(request.type, Base64.decode(request.data), parsedResponse, maxAge);
                removeSentRequests([...equals, request]);
            }).finally(() => {
                // when there are still matching request remove them
                let equals = findForEqualSentRequest(request);
                equals.forEach(equal => {
                    equal.reject()
                });
                removeSentRequests([...equals, request]);
            });
    })

    function isResponseValid(response: Response) {
        return response.ok && response.body;
    }
}

function sendRequestLimitCache(request: ApiRequest, grouping = 1): Promise<void> {
    let group = Math.round(new Date().getMinutes() / grouping);
    return sendRequest(request, group);
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

function getOrGenerateUUid(): string {
    let websocketUUID = window.localStorage.getItem("websocketUUID") || generateUUID();
    window.localStorage.setItem("websocketUUID", websocketUUID);
    return websocketUUID;
}
function findForEqualSentRequest(request: ApiRequest) {
    return requests.filter(r => {
        return r.type === request.type && r.data === request.data && r.mId !== request.mId;
    })
}

export let httpApi: HttpApi = {
    sendRequest: sendRequest,
    sendLimitedCacheRequest: sendRequestLimitCache
}