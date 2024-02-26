import { ApiRequest, HttpApi } from './ApiTypes.d'
import cacheUtils from '../utils/CacheUtils'
import { getProperty } from '../utils/PropertiesUtils'
import { getNextMessageId } from '../utils/MessageIdUtils'
import { isClientSideRendering } from '../utils/SSRUtils'
import { atobUnicode, btoaUnicode } from '../utils/Base64Utils'

export function initHttpHelper(customCommandEndpoint?: string, customApiEndpoint?: string): HttpApi {
    const commandEndpoint = customCommandEndpoint || getProperty('commandEndpoint')
    const apiEndpoint = customApiEndpoint || getProperty('apiEndpoint')
    let requests: ApiRequest[] = []

    /**
     * @deprecated
     * Sends http-Request to the backend
     * @param request The request-Object
     * @param cacheInvalidationGrouping A number which is appended to the url to be able to invalidate the cache
     * @returns A emty promise (the resolve/reject Method of the request-Object is called)
     */
    function sendRequest(request: ApiRequest, cacheInvalidationGrouping?: number): Promise<void> {
        request.mId = getNextMessageId()
        let requestString = JSON.stringify(request.data)
        var url = `${commandEndpoint}/${request.type}/${btoaUnicode(requestString)}`

        if (cacheInvalidationGrouping) {
            url += `/${cacheInvalidationGrouping}`
        }

        return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
            if (cacheValue) {
                request.resolve(cacheValue)
                return
            }

            try {
                request.data = btoaUnicode(requestString)
            } catch (error) {
                throw new Error('couldnt btoa this data: ' + request.data)
            }

            // don't resend in progress requests
            let equals = findForEqualSentRequest(request)
            if (equals.length > 0) {
                requests.push(request)
                return
            }

            requests.push(request)
            return handleServerRequest(request, url)
        })
    }

    /**
     * Sends API-Request to the backend
     * @param request The request-Object
     * @returns A emty promise (the resolve/reject Method of the request-Object is called)
     */
    function sendApiRequest(request: ApiRequest, body?: any): Promise<void> {
        request.mId = getNextMessageId()
        let requestString = request.data
        var url = `${apiEndpoint}/${request.type}`

        if (requestString) {
            url += `/${requestString}`
        }

        if (request.customRequestURL) {
            url = request.customRequestURL
        }

        if (url.endsWith('&') || url.endsWith('?')) {
            url = url.substring(0, url.length - 1)
        }

        // don't resend in progress requests
        // ignore requests with a body, as they are currently not stored and therefore not checked
        if (!body) {
            let equals = findForEqualSentRequest(request)
            if (equals.length > 0) {
                requests.push(request)
                return Promise.resolve()
            }
        }

        requests.push(request)
        return handleServerRequest(request, url, body)
    }

    function handleServerRequest(request: ApiRequest, url: string, body?: any): Promise<void> {
        let parsedResponse
        try {
            return fetch(url, {
                body: body,
                method: request.requestMethod,
                headers: request.requestHeader
            })
                .then(response => {
                    if (!response.ok && response.status !== 304) {
                        return Promise.reject(response.text())
                    }

                    return response.text()
                })
                .then(responseText => {
                    parsedResponse = parseResponseText(responseText)
                    if ((!parsedResponse && parsedResponse !== false) || parsedResponse.slug !== undefined) {
                        request.resolve()
                        return
                    }
                    request.resolve(parsedResponse)
                    let equals = findForEqualSentRequest(request)
                    equals.forEach(equal => {
                        equal.resolve(parsedResponse)
                    })
                    // all http answers are valid for 60 sec
                    let maxAge = 60

                    let data = request.data
                    try {
                        data = atobUnicode(request.data)
                    } catch {}
                    cacheUtils.setIntoCache(request.customRequestURL || request.type, data, parsedResponse, maxAge)
                    removeSentRequests([...equals, request])
                })
                .catch(responseTextPromise => {
                    if (!responseTextPromise || typeof responseTextPromise.then !== 'function') {
                        request.reject(responseTextPromise || 'no responseTextPromise')
                        return
                    }
                    responseTextPromise.then(responseText => {
                        request.reject(parseResponseText(responseText) || 'no responseTextPromise after parse')
                    })
                })
                .finally(() => {
                    // when there are still matching request remove them
                    let equals = findForEqualSentRequest(request)
                    equals.forEach(equal => {
                        equal.resolve(parsedResponse)
                    })
                    removeSentRequests([...equals, request])
                })
        } catch (e) {
            console.log('Fetch threw exception...')
            console.log('URL: ' + url)
            console.log('Request: ' + JSON.stringify(request))
            console.log('Body: ' + JSON.stringify(body))
            console.log(JSON.stringify(e))
            console.log('------------------------')

            return request.reject('Fetch threw exception: ' + JSON.stringify(e))
        }
    }

    function sendRequestLimitCache(request: ApiRequest, grouping = 1): Promise<void> {
        let group = Math.round(new Date().getMinutes() / grouping)
        return sendRequest(request, group)
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

    function findForEqualSentRequest(request: ApiRequest) {
        return requests.filter(r => {
            return (
                r.type === request.type &&
                JSON.stringify(r.data) === JSON.stringify(request.data) &&
                r.customRequestURL === request.customRequestURL &&
                r.mId !== request.mId
            )
        })
    }

    function parseResponseText(responseText) {
        let parsedResponse: any
        try {
            if (!isNaN(responseText)) {
                return responseText
            }
            parsedResponse = JSON.parse(responseText)
        } catch {
            parsedResponse = responseText
        }
        return parsedResponse
    }

    return {
        sendRequest: sendRequest,
        sendLimitedCacheRequest: sendRequestLimitCache,
        sendApiRequest: sendApiRequest
    }
}
