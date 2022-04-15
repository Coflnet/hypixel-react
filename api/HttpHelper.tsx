import { ApiRequest, HttpApi } from './ApiTypes.d'
import { Base64 } from 'js-base64'
import cacheUtils from '../utils/CacheUtils'
import { getProperty } from '../utils/PropertiesUtils'
import { getNextMessageId } from '../utils/MessageIdUtils'
import { isClientSideRendering } from '../utils/SSRUtils'

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
        var url = `${commandEndpoint}/${request.type}/${Base64.encode(requestString)}`

        if (cacheInvalidationGrouping) {
            url += `/${cacheInvalidationGrouping}`
        }

        return cacheUtils.getFromCache(request.type, requestString).then(cacheValue => {
            if (cacheValue) {
                request.resolve(cacheValue)
                return
            }

            try {
                request.data = Base64.encode(requestString)
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
    function sendApiRequest(request: ApiRequest, body?: any, cacheInvalidationGrouping?: number): Promise<void> {
        request.mId = getNextMessageId()
        let requestString = request.data
        var url = `${apiEndpoint}/${request.type}`

        if (requestString) {
            url += `/${requestString}`
        }

        if (request.customRequestURL) {
            url = request.customRequestURL
        }

        if (cacheInvalidationGrouping) {
            url += `?t=${cacheInvalidationGrouping}`
        }

        return cacheUtils.getFromCache(request.customRequestURL || request.type, requestString).then(cacheValue => {
            if (cacheValue) {
                request.resolve(cacheValue)
                return
            }

            // don't resend in progress requests
            let equals = findForEqualSentRequest(request)
            if (equals.length > 0) {
                requests.push(request)
                return
            }

            requests.push(request)
            return handleServerRequest(request, url, body)
        })
    }

    function isResponseValid(response: Response) {
        return response.ok && response.body
    }

    function handleServerRequest(request: ApiRequest, url: string, body?: any): Promise<void> {
        if (!isClientSideRendering()) {
            console.log('Sending Request...')
            console.log('URL: ' + url)
            console.log('Request: ' + JSON.stringify(request))
            console.log('Body: ' + JSON.stringify(body))
            console.log('------------------------')
        }
        return fetch(url, {
            body: body,
            method: request.requestMethod,
            headers: request.requestHeader
        })
            .then(response => {
                if (!response.ok) {
                    request.resolve()
                    return
                }

                if (response.status === 204) {
                    request.resolve()
                    return
                }

                let parsed
                try {
                    parsed = response.json()
                    console.log('Received Response: ' + JSON.stringify(parsed))
                } catch (error) {
                    request.reject({ Message: 'Unnown error' })
                }
                if (!isResponseValid(response)) {
                    parsed.then(parsedResponse => {
                        request.reject(parsedResponse)
                    })
                    return
                }
                return parsed
            })
            .then(parsedResponse => {
                if (!parsedResponse || parsedResponse.Slug !== undefined) {
                    request.reject(parsedResponse)
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
                    data = Base64.decode(request.data)
                } catch {}

                cacheUtils.setIntoCache(request.customRequestURL || request.type, data, parsedResponse, maxAge)
                removeSentRequests([...equals, request])
            })
            .finally(() => {
                // when there are still matching request remove them
                let equals = findForEqualSentRequest(request)
                equals.forEach(equal => {
                    equal.reject()
                })
                removeSentRequests([...equals, request])
            })
    }

    function sendRequestLimitCache(request: ApiRequest, grouping = 1): Promise<void> {
        let group = Math.round(new Date().getMinutes() / grouping)
        return sendRequest(request, group)
    }

    function sendLimitedCacheApiRequest(request: ApiRequest, grouping = 1): Promise<void> {
        let group = Math.round(new Date().getMinutes() / grouping)
        return sendApiRequest(request, undefined, group)
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
            return r.type === request.type && r.data === request.data && r.mId !== request.mId
        })
    }

    return {
        sendRequest: sendRequest,
        sendLimitedCacheRequest: sendRequestLimitCache,
        sendApiRequest: sendApiRequest,
        sendLimitedCacheApiRequest: sendLimitedCacheApiRequest
    }
}
