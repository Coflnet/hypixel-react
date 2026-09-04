import { toast } from 'react-toastify'
import * as notificationApi from './NotificationApi'
import { getGoogleToken } from './NotificationApi'
import { v4 as generateUUID } from 'uuid'
import { atobUnicode } from '../utils/Base64Utils'
import cacheUtils from '../utils/CacheUtils'
import { getFlipCustomizeSettings } from '../utils/FlipUtils'
import { enchantmentAndReforgeCompare, toVariantItemTag } from '../utils/Formatter'
import {
    parseAccountInfo,
    parseArchivedAuctions,
    parseAuction,
    parseAuctionDetails,
    parseBazaarPrice,
    parseBazaarSnapshot,
    parseCraftingInstructions,
    parseCraftingRecipe,
    parseEnchantment,
    parseFilterOption,
    parseFlipAuction,
    parseFlipTrackingResponse,
    parseInventoryData,
    parseItem,
    parseItemBidForList,
    parseItemPrice,
    parseItemSummary,
    parseKatFlip,
    parseLowSupplyItem,
    parseMayorData,
    parseMinecraftConnectionInfo,
    parseOwnerHistory,
    parsePaymentResponse,
    parsePlayer,
    parsePopularSearch,
    parsePremiumProducts,
    parsePremiumSubscription,
    parsePrivacySettings,
    parseProfitableCrafts,
    parseRecentAuction,
    parseRefInfo,
    parseSearchResultItem,
    parseSkyblockProfile,
    parseTradeObject,
    parseTransaction
} from '../utils/Parser/APIResponseParser'
import { PREMIUM_TYPES } from '../utils/PremiumTypeUtils'
import { getProperty } from '../utils/PropertiesUtils'
import {
    FLIPPER_FILTER_KEY,
    getSetting,
    getSettingsObject,
    ITEM_ICON_TYPE,
    LAST_PREMIUM_PRODUCTS,
    mapSettingsToApiFormat,
    RESTRICTIONS_SETTINGS_KEY,
    setSettingsFromServerSide,
    storeUsedTagsInLocalStorage
} from '../utils/SettingsUtils'
import { isClientSideRendering } from '../utils/SSRUtils'
import { HttpApi, RequestType, SubscriptionType, CUSTOM_EVENTS, NotificationListener } from './ApiTypes.d'
import { initHttpHelper } from './HttpHelper'
import { websocketHelper } from './WebsocketHelper'
import { canUseClipBoard, writeToClipboard } from '../utils/ClipboardUtils'
import properties from '../properties'
import { getCurrentCoflCoins } from '../utils/CoflCoinsUtils'
import { unwrapGeneratedApiArrayResponse } from '../utils/GeneratedApiResponseUtils'
import {
    getApiSearchSearchVal,
    getApiItemItemTagDetails,
    getApiItemPriceItemTagHistoryDay,
    getApiItemPriceItemTagHistoryWeek,
    getApiItemPriceItemTagHistoryMonth,
    getApiItemPriceItemTagHistoryYear,
    getApiBazaarItemTagHistoryHour,
    getApiBazaarItemTagHistoryDay,
    getApiBazaarItemTagHistoryWeek,
    getApiBazaarItemTagHistory,
    getApiPlayerPlayerUuidAuctions,
    getApiPlayerPlayerUuidBids,
    getApiAuctionAuctionUuid,
    getApiPlayerPlayerUuidName,
    postApiPlayerNames,
    getApiAuctionsTagItemTagRecentOverview,
    getApiFilterOptions,
    postApiServicePurchase,
    getApiReferralInfo,
    postApiReferralReferredBy,
    getApiAuctionsTagItemTagActiveOverview,
    getApiItemSearchSearchVal,
    postApiModAuth,
    getApiSearchPlayerPlayerName,
    getApiAuctionsSupplyLow,
    getApiFlipUpdateWhen,
    getApiCraftProfit,
    postApiPlayerPlayerUuidName,
    getApiCraftRecipeItemTag,
    getApiItemPriceItemTagBin,
    getApiItemsBazaarTags,
    getApiItemPriceItemTag,
    getApiKatProfit,
    getApiFlipStatsPlayerPlayerUuid,
    getApiBazaarItemTagSnapshot,
    getApiUserPrivacy,
    getApiUserTerms,
    postApiUserPrivacy,
    postApiUserTerms,
    postApiPremiumUserOwns,
    postApiItemsNames,
    postApiFilter,
    getApiItemItemTagSimilar,
    getApiAuctionsUidUidSold,
    getApiMayor,
    getApiPremiumTransactions,
    getApiInventory,
    postApiTrades,
    deleteApiTradesId,
    getApiAuctionsTagItemTagArchiveOverview,
    postApiAuctionsTagItemTagArchiveExport,
    getApiLinkvertise,
    postApiPremiumSubscriptionSubscriptionSlug,
    getApiPremiumSubscription,
    deleteApiPremiumSubscriptionExternalId,
    getApiCraftItemTagInstructions
} from './_generated/skyApi'

/*
 * ApiHelper.tsx is being migrated off hand-rolled HTTP requests onto the generated
 * (orval) sky.coflnet.com client in api/_generated/skyApi.ts. Three groups of calls
 * intentionally remain hand-rolled here and are NOT candidates for that migration:
 *
 * 1. Websocket command-channel calls (via `websocketHelper.sendRequest`/`.subscribe`) -
 *    live subscriptions, push updates and request/response pairs that only exist on the
 *    persistent websocket connection (e.g. subscribeFlips, getAccountInfo, setFlipSetting,
 *    transferCoflCoins, loadConfig/updateConfig). There is no REST equivalent.
 * 2. The deprecated HTTP fallback for that same command channel (`httpApi.sendRequest` /
 *    `httpApi.sendLimitedCacheRequest`, see HttpHelper.tsx). It POSTs a base64-encoded
 *    command payload to `${commandEndpoint}/command/...` so server-side rendering (which
 *    can't hold a websocket open) can still ask for the same data the websocket protocol
 *    provides (e.g. getEnchantments, getVersion, getPreloadFlips, getFlipBasedAuctions,
 *    getNewPlayers, getNewItems, getPopularSearches, getEndedAuctions, getNewAuctions,
 *    flipFilters). These routes aren't documented in SkyApi's OpenAPI/swagger spec, so the
 *    generated client has no matching function - only the real REST endpoints under
 *    `${apiEndpoint}` (via `httpApi.sendApiRequest`) show up there.
 * 3. Calls to services other than SkyApi: sendFeedback (feedback.coflnet.com) and checkRat
 *    (isthisarat.com).
 *
 * A couple of `sendApiRequest`-based methods also stay hand-rolled for now because SkyApi's
 * generated client doesn't (yet) cover them: deleteAccount (`DELETE /user/me` isn't in the
 * current swagger/generated client) and getPlayerProfiles (`GET /profile/{uuid}` isn't
 * generated either). getTradeOffers also stays: the generated `getApiTrades` sends the
 * filter as a request body on a GET, which browsers reject outright.
 *
 * Auth: everything migrated below reads the Google token via `getGoogleToken()` (also used
 * by NotificationApi.tsx, which is fully migrated already) and attaches it through the
 * shared `googleTokenHeaders`/`requireGoogleToken` helpers just below, instead of each
 * method rebuilding `{ GoogleToken: ... }` by hand.
 */

function getApiEndpoint() {
    return isClientSideRendering() ? getProperty('apiEndpoint') : process.env.API_ENDPOINT || getProperty('apiEndpoint')
}

/**
 * Central place that builds the `RequestInit` used to authenticate calls made through the
 * generated SkyApi client. Keeps token-header construction in one spot instead of every
 * migrated method re-building `{ headers: { GoogleToken: ... } }` by hand.
 */
function googleTokenHeaders(token: string, extraHeaders?: Record<string, string>): RequestInit {
    return {
        headers: {
            GoogleToken: token,
            ...extraHeaders
        }
    }
}

/**
 * Reads the Google token and shows the same "you need to be logged in" toast the
 * hand-rolled methods used to show inline, returning null if there is none so callers can
 * reject their promise. Centralizes the sessionStorage/localStorage lookup (via
 * NotificationApi's `getGoogleToken`) for every auth-requiring generated-client call.
 */
function requireGoogleToken(actionDescription: string): string | null {
    let token = getGoogleToken()
    if (!token) {
        toast.error(`You need to be logged in to ${actionDescription}.`)
        return null
    }
    return token
}

export function initAPI(returnSSRResponse: boolean = false): API {
    let httpApi: HttpApi
    if (isClientSideRendering()) {
        httpApi = initHttpHelper()
    } else {
        let commandEndpoint = process.env.COMMAND_ENDPOINT
        let apiEndpoint = getApiEndpoint()
        httpApi = initHttpHelper(commandEndpoint, apiEndpoint)
    }

    setTimeout(() => {
        if (isClientSideRendering()) {
            cacheUtils.checkForCacheClear()
        }
    }, 20000)

    let apiErrorHandler = (requestType: RequestType, error: any, requestData: any = null) => {
        if (!error || !error.message) {
            return
        }
        if (isClientSideRendering()) {
            toast.error(
                <span>
                    <div>{error.message}</div>
                    <div style={{ fontSize: '0.85em', marginTop: '4px', opacity: 0.9 }}>
                        Request-Type: {requestType}
                    </div>
                </span>,
                {
                    onClick: () => {
                        if (error.traceId && canUseClipBoard()) {
                            writeToClipboard(error.traceId)
                            toast.success(
                                <span>
                                    Copied the error trace to the clipboard. Please use this to ask for help on our{' '}
                                    <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                                        Discord
                                    </a>
                                    .
                                </span>
                            )
                        }
                    }
                }
            )
        }
        console.log('RequestType: ' + requestType)
        console.log('ErrorMessage: ' + error.message)
        console.log('RequestData: ')
        console.log(requestData)
        console.log('------------------------------\n')
    }

    let search = (searchText: string): Promise<SearchResultItem[]> => {
        return getApiSearchSearchVal(searchText)
            .then(response => {
                let items = response.data as any
                return !items ? [] : items.map((item: any) => parseSearchResultItem(item))
            })
            .catch(error => {
                apiErrorHandler(RequestType.SEARCH, error, searchText)
                throw error
            })
    }

    let getItemImageUrl = (item: Item): string => {
        // Always use 'default' during SSR to avoid hydration mismatch
        // The user's preference is only available on the client via localStorage
        let type = isClientSideRendering() ? getSetting(ITEM_ICON_TYPE, 'default') : 'default'

        let iconURL = item.iconUrl || (item as any).icon // this is also player images
        if (iconURL && !iconURL.includes("mc-heads")) {
            if (type === 'vanilla' && !iconURL.endsWith('/vanilla') && iconURL.includes('sky.coflnet.com/static/icon')) {
                return iconURL + '/vanilla'
            }
            return iconURL
        }
        let r = `https://sky.coflnet.com/static/icon/${toVariantItemTag(item.tag)}${type === 'vanilla' ? '/vanilla' : ''}`
        return r
    }

    let getItemDetails = (itemTag: string): Promise<Item> => {
        return getApiItemItemTagDetails(itemTag)
            .then(response => {
                let item = response.data as any
                return returnSSRResponse ? item : parseItem(item)
            })
            .catch(error => {
                apiErrorHandler(RequestType.ITEM_DETAILS, error, itemTag)
                throw error
            })
    }

    let getItemPrices = (itemTag: string, fetchSpan: DateRange, itemFilter?: ItemFilter): Promise<ItemPrice[]> => {
        let handleData = (data: any[]) => {
            if (returnSSRResponse) {
                return data
            }
            return data ? data.map(parseItemPrice).sort((a: ItemPrice, b: ItemPrice) => a.time.getTime() - b.time.getTime()) : []
        }
        let handleResponse = (response: { data?: unknown; status?: number }) =>
            handleData(unwrapGeneratedApiArrayResponse(response, 'The item price service returned an invalid response.'))
        let handleError = (error: any) => {
            apiErrorHandler(RequestType.ITEM_PRICES, error, {
                itemTag,
                fetchSpan,
                itemFilter
            })
            throw error
        }

        // The generated params type nests these under `filters`, but its URL builder does not
        // serialize nested objects. Keep the filter keys at the top level like the old request.
        let params = itemFilter && Object.keys(itemFilter).length > 0 ? ({ ...itemFilter } as any) : undefined

        switch (String(fetchSpan)) {
            case 'day':
                return getApiItemPriceItemTagHistoryDay(itemTag, params).then(handleResponse).catch(handleError)
            case 'week':
                return getApiItemPriceItemTagHistoryWeek(itemTag, params).then(handleResponse).catch(handleError)
            case 'month':
                return getApiItemPriceItemTagHistoryMonth(itemTag, params).then(handleResponse).catch(handleError)
            case 'year':
                return getApiItemPriceItemTagHistoryYear(itemTag, params).then(handleResponse).catch(handleError)
            default:
                // The generated full-history route cannot accept filters, while active/hour
                // have no generated route. Keep the legacy direct request for these ranges.
                return new Promise((resolve, reject) => {
                    let urlParams = new URLSearchParams()
                    if (itemFilter && Object.keys(itemFilter).length > 0) {
                        urlParams = new URLSearchParams(itemFilter)
                    }

                    httpApi.sendApiRequest({
                        type: RequestType.ITEM_PRICES,
                        data: '',
                        customRequestURL: getApiEndpoint() + `/item/price/${itemTag}/history/${fetchSpan}?${urlParams.toString()}`,
                        requestMethod: 'GET',
                        requestHeader: {
                            'Content-Type': 'application/json'
                        },
                        resolve: (data: any) => {
                            resolve(handleData(data))
                        },
                        reject: (error: any) => {
                            try {
                                handleError(error)
                            } catch (e) {
                                reject(e)
                            }
                        }
                    })
                })
        }
    }

    let getBazaarPrices = (itemTag: string, fetchSpan: DateRange): Promise<BazaarPrice[]> => {
        let handleData = (data: any) =>
            data ? data.map(parseBazaarPrice).sort((a: BazaarPrice, b: BazaarPrice) => a.timestamp.getTime() - b.timestamp.getTime()) : []
        let handleError = (error: any) => {
            apiErrorHandler(RequestType.BAZAAR_PRICES, error, {
                itemTag,
                fetchSpan
            })
            throw error
        }

        switch (String(fetchSpan)) {
            case 'hour':
                return getApiBazaarItemTagHistoryHour(itemTag).then(r => handleData(r.data)).catch(handleError)
            case 'day':
                return getApiBazaarItemTagHistoryDay(itemTag).then(r => handleData(r.data)).catch(handleError)
            case 'week':
                return getApiBazaarItemTagHistoryWeek(itemTag).then(r => handleData(r.data)).catch(handleError)
            default:
                // 'active'/month/year/full aren't served by these fixed-range routes - keep the
                // direct-fetch path (callers use getBazaarPricesByRange for month/full instead).
                return new Promise((resolve, reject) => {
                    httpApi.sendApiRequest({
                        type: RequestType.BAZAAR_PRICES,
                        data: '',
                        customRequestURL: getProperty('apiEndpoint') + `/bazaar/${itemTag}/history/${fetchSpan}`,
                        requestMethod: 'GET',
                        resolve: (data: any) => {
                            resolve(handleData(data))
                        },
                        reject: (error: any) => {
                            try {
                                handleError(error)
                            } catch (e) {
                                reject(e)
                            }
                        }
                    })
                })
        }
    }

    let getBazaarPricesByRange = (itemTag: string, startDate: Date | string | number, endDate: Date | string | number): Promise<BazaarPrice[]> => {
        let startDateIso = new Date(startDate).toISOString()
        let endDateIso = new Date(endDate).toISOString()

        return getApiBazaarItemTagHistory(itemTag, { start: startDateIso, end: endDateIso })
            .then(response => {
                let data = (response.data as any).filter(d => d.sell !== undefined && d.buy !== undefined)

                let buySort = [...data].sort((a, b) => a.buy - b.buy)
                let sellSort = [...data].sort((a, b) => a.sell - b.sell)

                let medianBuy = buySort.length > 0 ? buySort[Math.floor(buySort.length / 2)].buy : 0
                let medianSell = sellSort.length > 0 ? sellSort[Math.floor(sellSort.length / 2)].sell : 0

                let bazaarData: BazaarPrice[] = data
                    .map(parseBazaarPrice)
                    .sort((a: BazaarPrice, b: BazaarPrice) => a.timestamp.getTime() - b.timestamp.getTime())
                let normalizer = 8
                return bazaarData.filter(
                    b =>
                        b.buyData.max < medianBuy * normalizer &&
                        b.sellData.max < medianSell * normalizer &&
                        b.buyData.min > medianBuy / normalizer &&
                        b.sellData.min > medianSell / normalizer
                )
            })
            .catch(error => {
                apiErrorHandler(RequestType.BAZAAR_PRICES, error, {
                    itemTag,
                    startDateIso,
                    endDateIso
                })
                throw error
            })
    }

    let getAuctions = (uuid: string, page: number = 0, itemFilter?: ItemFilter): Promise<Auction[]> => {
        // the generated params type models the filter as a nested `filters` object, but its
        // (shared) URL builder just flattens every own key of whatever object it's given - so
        // itemFilter's keys need to live next to `page`, not nested, to match prior behaviour.
        let params = { page, ...(itemFilter || {}) } as any

        return getApiPlayerPlayerUuidAuctions(uuid, params)
            .then(response => {
                let auctions = response.data as any
                return returnSSRResponse ? auctions : auctions.map((auction: any) => parseAuction(auction))
            })
            .catch(error => {
                apiErrorHandler(RequestType.PLAYER_AUCTION, error, { uuid, page })
                throw error
            })
    }

    let getBids = (uuid: string, page: number = 0, itemFilter?: ItemFilter): Promise<BidForList[]> => {
        let params = { page, ...(itemFilter || {}) } as any

        return getApiPlayerPlayerUuidBids(uuid, params)
            .then(response => {
                let bids = response.data as any
                return bids.map((bid: any) => parseItemBidForList(bid))
            })
            .catch(error => {
                apiErrorHandler(RequestType.PLAYER_BIDS, error, { uuid, page })
                throw error
            })
    }

    let getEnchantments = (): Promise<Enchantment[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.ALL_ENCHANTMENTS,
                data: '',
                resolve: (enchantments: any) => {
                    let parsedEnchantments: Enchantment[] = enchantments.map(enchantment => {
                        return parseEnchantment({
                            type: enchantment.label,
                            id: enchantment.id
                        })
                    })
                    parsedEnchantments = parsedEnchantments
                        .filter(enchantment => {
                            return enchantment.name!.toLowerCase() !== 'unknown'
                        })
                        .sort(enchantmentAndReforgeCompare)
                    resolve(parsedEnchantments)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ALL_ENCHANTMENTS, error, '')
                    reject(error)
                }
            })
        })
    }

    let trackSearch = (fullSearchId: string, fullSearchType: string): void => {
        let requestData = {
            id: fullSearchId,
            type: fullSearchType
        }
        websocketHelper.sendRequest({
            type: RequestType.TRACK_SEARCH,
            data: requestData,
            resolve: () => { },
            reject: (error: any) => {
                apiErrorHandler(RequestType.TRACK_SEARCH, error, requestData)
            }
        })
    }

    let getAuctionDetails = (auctionUUID: string): Promise<{ parsed: AuctionDetails; original: any }> => {
        return new Promise((resolve, reject) => {
            getApiAuctionAuctionUuid(auctionUUID)
                .then(response => {
                    let auctionDetails = response.data as any
                    if (!auctionDetails) {
                        reject()
                        return
                    }
                    if (!auctionDetails.auctioneer) {
                        api.getPlayerName(auctionDetails.auctioneerId)
                            .then(name => {
                                auctionDetails.auctioneer = {
                                    name,
                                    uuid: auctionDetails.auctioneerId
                                }
                            })
                            .catch(e => {
                                console.error(`Error fetching playername for ${auctionDetails.auctioneerId}. ${JSON.stringify(e)}`)
                                auctionDetails.auctioneer = {
                                    name: '',
                                    uuid: auctionDetails.auctioneerId
                                }
                            })
                            .finally(() => {
                                resolve({ parsed: parseAuctionDetails(auctionDetails), original: auctionDetails })
                            })
                    } else {
                        resolve({ parsed: parseAuctionDetails(auctionDetails), original: auctionDetails })
                    }
                })
                .catch(error => {
                    reject(error)
                })
        })
    }

    let getPlayerName = (uuid: string): Promise<string> => {
        // Reduce amount of API calls during test runs
        if (properties.isTestRunner) {
            return Promise.resolve('TestRunnerUser')
        }
        if (!uuid) {
            return Promise.resolve('')
        }
        return getApiPlayerPlayerUuidName(uuid)
            .then(response => response.data as any)
            .catch(error => {
                apiErrorHandler(RequestType.PLAYER_NAME, error, uuid)
                throw error
            })
    }

    let getPlayerNames = (uuids: string[]): Promise<{ [key: string]: string }> => {
        // Reduce amount of API calls during test runs
        if (properties.isTestRunner) {
            let result = {}
            uuids.forEach(uuid => {
                result[uuid] = 'TestRunnerUser'
            })
            return Promise.resolve(result)
        }
        return postApiPlayerNames(uuids)
            .then(response => response.data as any)
            .catch(error => {
                apiErrorHandler(RequestType.PLAYER_NAMES, error, '')
                throw error
            })
    }

    let connectionId: string | null = null

    let setConnectionId = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            connectionId = connectionId || generateUUID()

            websocketHelper.sendRequest({
                type: RequestType.SET_CONNECTION_ID,
                data: connectionId,
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_CONNECTION_ID, error, connectionId)
                    reject(error)
                }
            })
        })
    }

    let getVersion = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.GET_VERSION,
                data: '',
                resolve: (response: any) => {
                    resolve(response.toString())
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_VERSION, error, '')
                    reject(error)
                }
            })
        })
    }

    let subscribe = (topic: string, types: SubscriptionType[], targets: NotificationTarget[], price?: number, filter?: ItemFilter): Promise<void> => {
        return notificationApi.createNotifier(topic, types, targets, price, filter)
    }

    let unsubscribe = (subscription: NotificationListener): Promise<void> => {
        return notificationApi.deleteNotifier(subscription)
    }

    let getNotificationListener = (): Promise<NotificationListener[]> => {
        return notificationApi.getNotificationListeners()
    }

    let loginWithToken = (id: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.LOGIN_WITH_TOKEN,
                data: id,
                resolve: token => {
                    resolve(token)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.LOGIN_WITH_TOKEN, error)
                    reject(error)
                }
            })
        })
    }


    let getRecentAuctions = (itemTag: string, itemFilter: ItemFilter): Promise<RecentAuction[]> => {
        let params = (itemFilter && Object.keys(itemFilter).length > 0 ? { ...itemFilter } : undefined) as any

        return getApiAuctionsTagItemTagRecentOverview(itemTag, params)
            .then(response => {
                let data = unwrapGeneratedApiArrayResponse<any>(response, 'The recent auctions service returned an invalid response.')
                return data.map(a => parseRecentAuction(a))
            })
            .catch(error => {
                apiErrorHandler(RequestType.RECENT_AUCTIONS, error, itemTag)
                throw error
            })
    }

    let getFlips = (): Promise<FlipAuction[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_FLIPS,
                data: '',
                resolve: (data: any) => {
                    resolve(data.map(a => parseFlipAuction(a)))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, '')
                    reject(error)
                }
            })
        })
    }

    let getPreloadFlips = (): Promise<FlipAuction[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.GET_FLIPS,
                data: '',
                resolve: (data: any) => {
                    returnSSRResponse ? resolve(data) : resolve(data.map(parseFlipAuction))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_FLIPS, error, '')
                }
            })
        })
    }

    let subscribeFlips = (
        restrictionList: FlipRestriction[],
        filter: FlipperFilter,
        flipSettings: FlipCustomizeSettings,
        flipCallback?: Function,
        soldCallback?: Function,
        nextUpdateNotificationCallback?: Function,
        onSubscribeSuccessCallback?: Function,
        onErrorCallback?: Function,
        forceSettingsUpdate: boolean = false
    ) => {
        websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_FLIPS)

        storeUsedTagsInLocalStorage(restrictionList)

        let requestData = mapSettingsToApiFormat(filter, flipSettings, restrictionList)

        websocketHelper.subscribe({
            type: RequestType.SUBSCRIBE_FLIPS,
            data: forceSettingsUpdate ? requestData : null,
            callback: function (response) {
                switch (response.type) {
                    case 'flip':
                        if (flipCallback) {
                            flipCallback(parseFlipAuction(response.data))
                        }
                        break
                    case 'nextUpdate':
                        if (nextUpdateNotificationCallback) {
                            nextUpdateNotificationCallback()
                        }
                        break
                    case 'sold':
                        if (soldCallback) {
                            soldCallback(response.data)
                        }
                        break
                    case 'flipSettings':
                        if (!response.data) {
                            api.subscribeFlips(
                                restrictionList,
                                filter,
                                flipSettings,
                                flipCallback,
                                soldCallback,
                                nextUpdateNotificationCallback,
                                undefined,
                                onErrorCallback,
                                true
                            )
                        } else {
                            setSettingsFromServerSide(response.data)
                        }
                        break
                    case 'settingsUpdate':
                        let data = response.data as any
                        if (data.changer === window.sessionStorage.getItem('sessionId')) {
                            return
                        }
                        setSettingsFromServerSide(response.data)
                        break
                    case 'ok':
                        if (onSubscribeSuccessCallback) {
                            onSubscribeSuccessCallback()
                        }
                        break
                    default:
                        break
                }
            },
            resubscribe: function (subscription) {
                let filter = getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {})
                let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
                subscribeFlips(
                    restrictions,
                    filter,
                    getFlipCustomizeSettings(),
                    flipCallback,
                    soldCallback,
                    nextUpdateNotificationCallback,
                    undefined,
                    onErrorCallback,
                    false
                )
            },
            onError: function (message) {
                toast.error(message)
                if (onErrorCallback) {
                    onErrorCallback()
                }
            }
        })
    }

    const debounceSubFlipAnonymFunction = (function () {
        let timerId

        return (
            restrictionList: FlipRestriction[],
            filter: FlipperFilter,
            flipSettings: FlipCustomizeSettings,
            flipCallback?: Function,
            soldCallback?: Function,
            nextUpdateNotificationCallback?: Function,
            onSubscribeSuccessCallback?: Function
        ) => {
            clearTimeout(timerId)
            timerId = setTimeout(() => {
                websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_FLIPS)

                let requestData = mapSettingsToApiFormat(filter, flipSettings, restrictionList)

                websocketHelper.subscribe({
                    type: RequestType.SUBSCRIBE_FLIPS_ANONYM,
                    data: requestData,
                    callback: function (response) {
                        switch (response.type) {
                            case 'flip':
                                if (flipCallback) {
                                    flipCallback(parseFlipAuction(response.data))
                                }
                                break
                            case 'nextUpdate':
                                if (nextUpdateNotificationCallback) {
                                    nextUpdateNotificationCallback()
                                }
                                break
                            case 'sold':
                                if (soldCallback) {
                                    soldCallback(response.data)
                                }
                                break
                            case 'ok':
                                if (onSubscribeSuccessCallback) {
                                    onSubscribeSuccessCallback()
                                }
                                break
                            default:
                                break
                        }
                    },
                    resubscribe: function (subscription) {
                        let filter = getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, {})
                        let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
                        subscribeFlipsAnonym(
                            restrictions,
                            filter,
                            getFlipCustomizeSettings(),
                            flipCallback,
                            soldCallback,
                            nextUpdateNotificationCallback,
                            undefined
                        )
                    },
                    onError: function (message) {
                        toast.error(message)
                    }
                })
            }, 2000)
        }
    })()

    let subscribeFlipsAnonym = (
        restrictionList: FlipRestriction[],
        filter: FlipperFilter,
        flipSettings: FlipCustomizeSettings,
        flipCallback?: Function,
        soldCallback?: Function,
        nextUpdateNotificationCallback?: Function,
        onSubscribeSuccessCallback?: Function
    ) => {
        debounceSubFlipAnonymFunction(
            restrictionList,
            filter,
            flipSettings,
            flipCallback,
            soldCallback,
            nextUpdateNotificationCallback,
            onSubscribeSuccessCallback
        )
    }

    let unsubscribeFlips = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.UNSUBSCRIBE_FLIPS,
                data: '',
                resolve: function (data) {
                    resolve()
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.ACTIVE_AUCTIONS, error, '')
                    reject(error)
                }
            })
        })
    }

    /**
     * Subscribes to live updates for a single auction. Whenever a new bid is placed on it, the backend
     * resends the full auction state and `onUpdate` is called with the freshly parsed details.
     * Only one live-update subscription (auction or sold) can be active per connection; this replaces any previous one.
     */
    let subscribeAuctionUpdates = (auctionUUID: string, onUpdate: (auctionDetails: AuctionDetails) => void, onErrorCallback?: Function): void => {
        websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_UPDATES)
        websocketHelper.subscribe({
            type: RequestType.SUBSCRIBE_UPDATES,
            data: { topic: `auction/${auctionUUID}` },
            callback: function (response) {
                if (response.type === 'auctionUpdate') {
                    onUpdate(parseAuctionDetails(response.data))
                }
            },
            resubscribe: function () {
                subscribeAuctionUpdates(auctionUUID, onUpdate, onErrorCallback)
            },
            onError: function (message) {
                if (onErrorCallback) {
                    onErrorCallback(message)
                }
            }
        })
    }

    /**
     * Subscribes to sold auctions of a given item tag. Whenever an auction of that tag is sold and matches the
     * given filter, `onSold` is called with the parsed recent auction.
     * Only one live-update subscription (auction or sold) can be active per connection; this replaces any previous one.
     */
    let subscribeSoldAuctions = (
        itemTag: string,
        itemFilter: ItemFilter,
        onSold: (auction: RecentAuction) => void,
        onErrorCallback?: Function
    ): void => {
        websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_UPDATES)
        // strip UI-only keys before sending (mirrors the notification subscribe)
        let filter = { ...(itemFilter || {}) } as { [key: string]: any }
        delete filter._hide
        delete filter._sellerName
        websocketHelper.subscribe({
            type: RequestType.SUBSCRIBE_UPDATES,
            data: { topic: `sold/${itemTag}`, filter },
            callback: function (response) {
                if (response.type === 'soldAuction') {
                    onSold(parseRecentAuction(response.data))
                }
            },
            resubscribe: function () {
                subscribeSoldAuctions(itemTag, itemFilter, onSold, onErrorCallback)
            },
            onError: function (message) {
                if (onErrorCallback) {
                    onErrorCallback(message)
                }
            }
        })
    }

    // Stops receiving live updates. This is a local-only cleanup: it drops the subscription so its
    // callback no longer fires and it isn't restored on reconnect. There is no backend round-trip -
    // the backend keeps a single slot per connection that is replaced by the next subscribe and freed
    // when the connection closes, so an explicit unsubscribe message (which could race a newer
    // subscribe, since the backend dispatches each socket message on its own task) isn't needed.
    let unsubscribeUpdates = (): void => {
        websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_UPDATES)
    }

    let getFilters = (tag: string): Promise<FilterOptions[]> => {
        return getApiFilterOptions({ itemTag: tag })
            .then(response => {
                let data = response.data as any
                return data.map(a => parseFilterOption(a))
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_FILTER, error, tag)
                throw error
            })
    }

    let getNewPlayers = (): Promise<Player[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.NEW_PLAYERS,
                    data: '',
                    resolve: function (data) {
                        returnSSRResponse ? resolve(data) : resolve(data.map(p => parsePlayer(p)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.NEW_PLAYERS, error, '')
                        reject(error)
                    }
                },
                5
            )
        })
    }

    let getNewItems = (): Promise<Item[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.NEW_ITEMS,
                    data: '',
                    resolve: function (data) {
                        returnSSRResponse ? resolve(data) : resolve(data.map(i => parseItem(i)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.NEW_ITEMS, error, '')
                        reject(error)
                    }
                },
                15
            )
        })
    }

    let getPopularSearches = (): Promise<PopularSearch[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.POPULAR_SEARCHES,
                    data: '',
                    resolve: function (data) {
                        returnSSRResponse ? resolve(data) : resolve(data.map(s => parsePopularSearch(s)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.POPULAR_SEARCHES, error, '')
                        reject(error)
                    }
                },
                5
            )
        })
    }

    let getEndedAuctions = (): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.ENDED_AUCTIONS,
                    data: '',
                    resolve: function (data) {
                        returnSSRResponse ? resolve(data) : resolve(data.map(a => parseAuction(a)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.ENDED_AUCTIONS, error, '')
                        reject(error)
                    }
                },
                1
            )
        })
    }

    let getNewAuctions = (): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.NEW_AUCTIONS,
                    data: '',
                    resolve: function (data) {
                        returnSSRResponse ? resolve(data) : resolve(data.map(a => parseAuction(a)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.NEW_AUCTIONS, error, '')
                        reject(error)
                    }
                },
                1
            )
        })
    }

    let getFlipBasedAuctions = (flipUUID: string): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.GET_FLIP_BASED_AUCTIONS,
                data: flipUUID,
                resolve: (data: any) => {
                    resolve(data.map(a => parseAuction(a)))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_FLIP_BASED_AUCTIONS, error, flipUUID)
                    reject(error)
                }
            })
        })
    }

    let termsRequest = async (
        locale: 'en' | 'de',
        request?: { version: string; hash: string; source: string },
        tokenOverride?: string
    ): Promise<TermsStatus> => {
        const token = tokenOverride ?? requireGoogleToken('manage agreement acceptance')
        if (!token) throw new Error('Not logged in')
        const response = request
            ? await postApiUserTerms(request, { locale }, googleTokenHeaders(token))
            : await getApiUserTerms({ locale }, googleTokenHeaders(token))
        if (response.status !== 200)
            throw new Error(typeof response.data === 'string' ? response.data : JSON.stringify(response.data) || 'Agreement request failed')
        return response.data
    }

    let getTermsStatus = (locale: 'en' | 'de', token?: string) => termsRequest(locale, undefined, token)
    let acceptTerms = (version: string, hash: string, source: string, locale: 'en' | 'de', token?: string) =>
        termsRequest(locale, { version, hash, source }, token)

    let purchaseWithCoflcoins = (
        productId: string,
        googleToken: string,
        count?: number,
        declaration?: ServicePurchaseDeclaration
    ): Promise<void> => {
        let data = { userId: googleToken, productId: productId }
        const requestId = generateUUID()

        return postApiServicePurchase(
            {
                count: count ?? 1,
                slug: productId,
                reference: `premium-${requestId}`,
                immediatePerformanceRequested: declaration !== undefined,
                withdrawalConsequenceAcknowledged: declaration !== undefined,
                declarationVersion: declaration?.version ?? null,
                legalLocale: declaration?.locale ?? null,
                declarationRequestId: declaration ? requestId : null
            },
            googleTokenHeaders(googleToken)
        )
            .then(response => {
                if (response.status < 200 || response.status >= 300)
                    throw new Error(typeof response.data === 'string' ? response.data : JSON.stringify(response.data) || 'Purchase failed')
            })
            .catch(error => {
                apiErrorHandler(RequestType.PURCHASE_WITH_COFLCOiNS, error, data)
                throw error
            })
    }

    let subscribeCoflCoinChange = () => {
        websocketHelper.subscribe({
            type: RequestType.SUBSCRIBE_EVENTS,
            data: '',
            resubscribe: function (subscription) {
                subscribeCoflCoinChange()
            },
            onError: function (message) {
                toast.error(message)
            },
            callback: function (response) {
                if (response.data.sourceType === 'purchase' || response.data.sourceType === 'topup') {

                    // CoflCoins shouldnt change below 0 with a purchase or topup change
                    let newCoflCoinAmount = getCurrentCoflCoins() + Math.round(response.data.data.amount);
                    if (newCoflCoinAmount < 0) {
                        newCoflCoinAmount = 0
                    }

                    document.dispatchEvent(
                        new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: newCoflCoinAmount } })
                    )
                }
            }
        })
    }

    let getCoflcoinBalance = (): Promise<number> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_COFLCOIN_BALANCE,
                data: '',
                resolve: function (response) {
                    resolve(parseInt(response))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_COFLCOIN_BALANCE, error, '')
                    reject(error)
                }
            })
        })
    }

    let getRefInfo = (): Promise<RefInfo> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to use the ref system.')
                reject()
                return
            }

            getApiReferralInfo(googleTokenHeaders(googleId))
                .then(response => {
                    resolve(parseRefInfo(response.data))
                })
                .catch(error => {
                    apiErrorHandler(RequestType.GET_REF_INFO, error, '')
                    reject(error)
                })
        })
    }

    let setRef = (refId: string, programVersion: string, locale: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to use the ref system.')
                reject()
                return
            }

            postApiReferralReferredBy({ refCode: refId, programVersion, locale }, googleTokenHeaders(googleId))
                .then(() => {
                    resolve()
                })
                .catch(error => {
                    apiErrorHandler(RequestType.SET_REF, error, '')
                    reject(error)
                })
        })
    }

    let getActiveAuctions = (item: Item, order: string, filter: ItemFilter = {}): Promise<RecentAuction[]> => {
        let params = { orderBy: order, ...filter } as any

        return getApiAuctionsTagItemTagActiveOverview(item.tag, params)
            .then(response => {
                let data = unwrapGeneratedApiArrayResponse<any>(response, 'The active auctions service returned an invalid response.')
                return data.map(a => parseRecentAuction(a))
            })
            .catch(error => {
                apiErrorHandler(RequestType.ACTIVE_AUCTIONS, error, {
                    tag: item.tag,
                    filter,
                    order
                })
                throw error
            })
    }

    let connectMinecraftAccount = (playerUUID: string): Promise<MinecraftConnectionInfo> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.CONNECT_MINECRAFT_ACCOUNT,
                data: playerUUID,
                resolve: function (data) {
                    resolve(parseMinecraftConnectionInfo(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.CONNECT_MINECRAFT_ACCOUNT, error, playerUUID)
                    reject(error)
                }
            })
        })
    }

    let accountInfo
    let getAccountInfo = (): Promise<AccountInfo> => {
        return new Promise((resolve, reject) => {
            if (accountInfo) {
                resolve(accountInfo)
                return
            }

            websocketHelper.sendRequest({
                type: RequestType.GET_ACCOUNT_INFO,
                data: '',
                resolve: function (accountInfo) {
                    let info = parseAccountInfo(accountInfo)
                    accountInfo = info
                    resolve(info)
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_ACCOUNT_INFO, error, '')
                }
            })
        })
    }

    let itemSearch = (searchText: string): Promise<SearchResultItem[]> => {
        return getApiItemSearchSearchVal(searchText)
            .then(response => {
                let data = response.data as any
                return data.map(a => parseSearchResultItem(a))
            })
            .catch(error => {
                apiErrorHandler(RequestType.ITEM_SEARCH, error, searchText)
                throw error
            })
    }

    let authenticateModConnection = async (conId: string, googleToken: string): Promise<void> => {
        let timeout = setTimeout(() => {
            toast.warn(
                <span>
                    The login seems to take longer that expected. Are you using Kaspersky? If so, the "Secure Browsing" feature seems to interfere with the
                    login
                </span>
            )
        }, 10000)
        return postApiModAuth({ newId: conId }, googleTokenHeaders(googleToken))
            .then(() => {
                clearTimeout(timeout)
            })
            .catch(error => {
                clearTimeout(timeout)
                apiErrorHandler(RequestType.AUTHENTICATE_MOD_CONNECTION, error, conId)
                throw error
            })
    }

    let getFlipUpdateTime = (): Promise<Date> => {
        return getApiFlipUpdateWhen()
            .then(response => new Date(response.data as any))
            .catch(error => {
                apiErrorHandler(RequestType.FLIP_UPDATE_TIME, error, '')
                throw error
            })
    }
    let playerSearch = (playerName: string): Promise<Player[]> => {
        return getApiSearchPlayerPlayerName(playerName)
            .then(response => {
                let players = response.data as any
                return players ? players.map(parsePlayer) : []
            })
            .catch(error => {
                apiErrorHandler(RequestType.PLAYER_SEARCH, error, playerName)
                throw error
            })
    }

    let getLowSupplyItems = (): Promise<LowSupplyItem[]> => {
        return getApiAuctionsSupplyLow()
            .then(response => {
                let items = response.data as any
                return returnSSRResponse ? items : items.map(item => parseLowSupplyItem(item))
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_LOW_SUPPLY_ITEMS, error, '')
                throw error
            })
    }

    let sendFeedback = (feedbackKey: string, feedback: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            let user
            let email
            if (googleId) {
                let parts = googleId.split('.')
                if (parts.length > 2) {
                    let obj = JSON.parse(atobUnicode(parts[1]))
                    user = obj.sub
                    email = obj.email
                }
            }

            // Mask last 2 characters of email local part if user ID isn't available
            let maskedEmail = ''
            if (email) {
                if (!user) {
                    let atIndex = email.indexOf('@')
                    if (atIndex > 2) {
                        maskedEmail = email.substring(0, atIndex - 2) + '**' + email.substring(atIndex)
                    } else {
                        maskedEmail = '**' + email.substring(atIndex)
                    }
                } else {
                    maskedEmail = email
                }
            }

            // Get active premium tier from cached products
            let premiumTier = ''
            try {
                let lastProducts = localStorage.getItem(LAST_PREMIUM_PRODUCTS)
                if (lastProducts) {
                    let products = JSON.parse(lastProducts)
                    let activeProducts = Object.keys(products).filter(key => new Date(products[key].expiresAt) > new Date())
                    if (activeProducts.length > 0) {
                        premiumTier = activeProducts.join(', ')
                    }
                }
            } catch { }

            let feedbackWithUserInfo = {
                ...feedback,
                _userEmail: maskedEmail,
                _userId: user || '',
                _premiumTier: premiumTier
            }

            let requestData = {
                Context: 'Skyblock',
                User: user || '',
                Feedback: JSON.stringify(feedbackWithUserInfo),
                FeedbackName: feedbackKey
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.SEND_FEEDBACK,
                    data: '',
                    customRequestURL: getProperty('feedbackEndpoint'),
                    requestMethod: 'POST',
                    requestHeader: {
                        'Content-Type': 'application/json'
                    },
                    resolve: function () {
                        resolve()
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.SEND_FEEDBACK, error, feedback)
                        reject(error)
                    }
                },
                JSON.stringify(requestData)
            )
        })
    }

    let getProfitableCrafts = (): Promise<ProfitableCraft[]> => {
        return getApiCraftProfit()
            .then(response => {
                let crafts = response.data as any
                return returnSSRResponse ? crafts : parseProfitableCrafts(crafts)
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_PROFITABLE_CRAFTS, error, '')
                throw error
            })
    }

    let getCraftAcquisitionPlan = (itemTag: string, quantity = 1, forceCraft = true): Promise<CraftAcquisitionPlan> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_CRAFT_ACQUISITION,
                customRequestURL: `${getApiEndpoint()}/${RequestType.GET_CRAFT_ACQUISITION}/${encodeURIComponent(itemTag)}?quantity=${quantity}&forceCraft=${forceCraft}`,
                data: '',
                resolve,
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_CRAFT_ACQUISITION, error, itemTag)
                    reject(error)
                }
            })
        })
    }

    let triggerPlayerNameCheck = (playerUUID: string): Promise<void> => {
        return postApiPlayerPlayerUuidName(playerUUID)
            .then(() => {})
            .catch(error => {
                apiErrorHandler(RequestType.TRIGGER_PLAYER_NAME_CHECK, error, '')
                throw error
            })
    }

    let getPlayerProfiles = (playerUUID): Promise<SkyblockProfile[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_PLAYER_PROFILES,
                data: playerUUID,
                resolve: function (result) {
                    resolve(
                        Object.keys(result.profiles).map(key => {
                            return parseSkyblockProfile(result.profiles[key])
                        })
                    )
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.TRIGGER_PLAYER_NAME_CHECK, error, playerUUID)
                }
            })
        })
    }

    let getCraftingRecipe = (itemTag: string): Promise<CraftingRecipe> => {
        return getApiCraftRecipeItemTag(itemTag)
            .then(response => parseCraftingRecipe(response.data))
            .catch(error => {
                apiErrorHandler(RequestType.GET_CRAFTING_RECIPE, error, itemTag)
                throw error
            })
    }

    let getLowestBin = (itemTag: string): Promise<LowestBin> => {
        return getApiItemPriceItemTagBin(itemTag)
            .then(response => {
                let data = response.data as any
                return {
                    lowest: data.lowest,
                    secondLowest: data.secondLowest
                }
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_LOWEST_BIN, error, itemTag)
                throw error
            })
    }

    let flipFilters = (tag: string): Promise<FilterOptions[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.FLIP_FILTERS,
                    data: tag,
                    resolve: function (data) {
                        resolve(data.map(a => parseFilterOption(a)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.FLIP_FILTERS, error, tag)
                        reject(error)
                    }
                },
                1
            )
        })
    }

    let getBazaarTags = (): Promise<string[]> => {
        return getApiItemsBazaarTags()
            .then(response => response.data as any)
            .catch(error => {
                apiErrorHandler(RequestType.GET_BAZAAR_TAGS, error, '')
                throw error
            })
    }

    let getItemPriceSummary = (itemTag: string, filter: ItemFilter): Promise<ItemPriceSummary> => {
        let params = (filter && Object.keys(filter).length > 0 ? { ...filter } : undefined) as any

        return getApiItemPriceItemTag(itemTag, params)
            .then(response => {
                let data = response.data as any
                return returnSSRResponse ? data : parseItemSummary(data)
            })
            .catch(error => {
                apiErrorHandler(RequestType.ITEM_PRICE_SUMMARY, error, '')
                throw error
            })
    }

    let setFlipSetting = (key: string, value: any): Promise<void> => {
        if (sessionStorage.getItem('googleId') === null) {
            return Promise.resolve()
        }

        storeUsedTagsInLocalStorage(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))

        return new Promise((resolve, reject) => {
            let data = {
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : value.toString(),
                changer: window.sessionStorage.getItem('sessionId')
            }

            websocketHelper.sendRequest({
                type: RequestType.SET_FLIP_SETTING,
                data: data,
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_FLIP_SETTING, error, data)
                }
            })
        })
    }

    let getKatFlips = (): Promise<KatFlip[]> => {
        return getApiKatProfit()
            .then(response => {
                let data = response.data as any
                return returnSSRResponse ? data : data.map(parseKatFlip)
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_KAT_FLIPS, error, '')
                throw error
            })
    }

    let getTrackedFlipsForPlayer = (playerUUID: string, from?: Date, to?: Date): Promise<FlipTrackingResponse> => {
        let params: any = {}
        if (from && to) {
            params.start = from.toISOString()
            params.end = to.toISOString()
        }

        let googleId = isClientSideRendering() ? sessionStorage.getItem('googleId') : null
        let requestOptions = googleId ? googleTokenHeaders(googleId) : undefined

        return getApiFlipStatsPlayerPlayerUuid(playerUUID, params, requestOptions)
            .then(response => {
                let data = response.data as any
                return returnSSRResponse ? data : parseFlipTrackingResponse(data)
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_TRACKED_FLIPS_FOR_PLAYER, error, playerUUID)
                throw error
            })
    }

    let transferCoflCoins = (email: string | undefined, mcId: string | undefined, amount: number, reference: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let data = {
                email: email,
                mcId: mcId,
                amount: amount,
                reference: reference
            }

            websocketHelper.sendRequest({
                type: RequestType.TRANSFER_COFLCOINS,
                data: data,
                resolve: function () {
                    resolve()
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.TRANSFER_COFLCOINS, error, data)
                    reject(error)
                }
            })
        })
    }

    let getBazaarSnapshot = (itemTag: string, timestamp: string | number | Date): Promise<BazaarSnapshot> => {
        let isoTimestamp = new Date(Math.round(new Date(timestamp).getTime() / 1000) * 1000).toISOString()

        return getApiBazaarItemTagSnapshot(itemTag, isoTimestamp ? { timestamp: isoTimestamp } : undefined)
            .then(response => {
                let data = response.data as any
                if (!data) {
                    return {
                        item: {
                            tag: ''
                        },
                        buyData: {
                            moving: 0,
                            orderCount: 0,
                            price: 0,
                            volume: 0
                        },
                        sellData: {
                            moving: 0,
                            orderCount: 0,
                            price: 0,
                            volume: 0
                        },
                        sellOrders: [],
                        buyOrders: [],
                        timeStamp: new Date()
                    }
                }
                return parseBazaarSnapshot(data)
            })
            .catch(error => {
                apiErrorHandler(RequestType.GET_BAZAAR_SNAPSHOT, error, { itemTag, timestamp: isoTimestamp })
                throw error
            })
    }

    let getPrivacySettings = (): Promise<PrivacySettings> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to configure privacy settings.')
                reject()
                return
            }

            getApiUserPrivacy(googleTokenHeaders(googleId))
                .then(response => {
                    resolve(parsePrivacySettings(response.data))
                })
                .catch(error => {
                    apiErrorHandler(RequestType.GET_PRIVACY_SETTINGS, error, '')
                    reject(error)
                })
        })
    }

    let setPrivacySettings = (settings: PrivacySettings): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to save privacy settings.')
                reject()
                return
            }

            postApiUserPrivacy(settings as any, googleTokenHeaders(googleId))
                .then(() => {
                    resolve()
                })
                .catch(error => {
                    apiErrorHandler(RequestType.SET_PRIVACY_SETTINGS, error, settings)
                    reject(error)
                })
        })
    }

    let checkRat = (hash: string): Promise<RatCheckingResponse> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.CHECK_FOR_RAT,
                data: '',
                customRequestURL: `https://isthisarat.com/api/signature/${hash}`,
                resolve: (data: RatCheckingResponse) => {
                    resolve(data)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.CHECK_FOR_RAT, error, hash)
                    reject(error)
                }
            })
        })
    }

    let getPremiumProducts = (): Promise<PremiumProduct[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load premium products.')
                reject()
                return
            }

            postApiPremiumUserOwns(
                PREMIUM_TYPES.map(type => type.productId),
                googleTokenHeaders(googleId)
            )
                .then(response => {
                    let products = response.data as any
                    localStorage.setItem(LAST_PREMIUM_PRODUCTS, JSON.stringify(products))
                    if (typeof window !== 'undefined') {
                        try {
                            window.dispatchEvent(new CustomEvent('premium.products.updated'))
                        } catch (e) { }
                    }
                    resolve(parsePremiumProducts(products))
                })
                .catch(error => {
                    apiErrorHandler(RequestType.GET_PREMIUM_PRODUCTS, error, '')
                    reject(error)
                })
        })
    }

    /**
     * Uses the last loaded premium products (if available) to instantly call the callback function
     * The newest premium products are loaded after that and the callback is executed again
     */
    let refreshLoadPremiumProducts = (callback: (products: PremiumProduct[]) => void, onError: () => void) => {
        let lastPremiumProducts = localStorage.getItem(LAST_PREMIUM_PRODUCTS)
        if (lastPremiumProducts) {
            try {
                callback(parsePremiumProducts(JSON.parse(lastPremiumProducts)))
            } catch {
                callback([])
            }
        }
        getPremiumProducts().then(prodcuts => {
            callback(prodcuts)
        }).catch(() => {
            onError()
        })
    }


    let getItemNames = (items: Item[]): Promise<{ [key: string]: string }> => {
        return postApiItemsNames(items.map(item => item.tag))
            .then(response => response.data as any)
            .catch(error => {
                apiErrorHandler(RequestType.GET_ITEM_NAMES, error, items)
                throw error
            })
    }

    let checkFilter = (auction: AuctionDetails, filter: ItemFilter): Promise<boolean> => {
        return postApiFilter({ filters: filter, auction: auction } as any)
            .then(response => response.data as any)
            .catch(error => {
                apiErrorHandler(RequestType.CHECK_FILTER, error, { auction, filter })
                throw error
            })
    }

    let getRelatedItems = (tag: string): Promise<Item[]> => {
        return getApiItemItemTagSimilar(tag)
            .then(response => {
                let data = response.data as any
                return data.map(item => parseItem(item))
            })
            .catch(error => {
                apiErrorHandler(RequestType.RELATED_ITEMS, error, tag)
                throw error
            })
    }

    let getOwnerHistory = (uid: string): Promise<OwnerHistory[]> => {
        return getApiAuctionsUidUidSold(uid)
            .then(response => {
                let data = response.data as any
                return data.map(parseOwnerHistory)
            })
            .catch(error => {
                apiErrorHandler(RequestType.OWNER_HISOTRY, error, uid)
                throw error
            })
    }

    const HOUR_IN_MS = 60 * 60 * 1000
    const MAYOR_FAILURE_COOLDOWN_MS = 2 * 60 * 1000
    const mayorDataCache = new Map<string, MayorData[]>()
    const mayorDataRequestCache = new Map<string, Promise<MayorData[]>>()
    const mayorDataFailureCache = new Map<string, number>()

    let normaliseMayorRange = (start: Date, end: Date) => {
        let from = new Date(start.getTime())
        let to = new Date(end.getTime())

        if (to < from) {
            ;[from, to] = [to, from]
        }

        from.setMinutes(0, 0, 0)
        to.setMinutes(0, 0, 0)

        if (to.getTime() <= from.getTime()) {
            to = new Date(from.getTime() + HOUR_IN_MS)
        } else if (to.getTime() < end.getTime()) {
            to = new Date(to.getTime() + HOUR_IN_MS)
        }

        return { from, to }
    }

    let getMayorCacheKey = (from: Date, to: Date) => `${from.toISOString()}_${to.toISOString()}`

    let getMayorData = (start: Date, end: Date): Promise<MayorData[]> => {
        let { from, to } = normaliseMayorRange(start, end)
        let cacheKey = getMayorCacheKey(from, to)

        let cached = mayorDataCache.get(cacheKey)
        if (cached) {
            return Promise.resolve(cached)
        }

        let inFlight = mayorDataRequestCache.get(cacheKey)
        if (inFlight) {
            return inFlight
        }

        let lastFailure = mayorDataFailureCache.get(cacheKey)
        if (lastFailure && Date.now() - lastFailure < MAYOR_FAILURE_COOLDOWN_MS) {
            return Promise.reject(new Error('Mayor data request suppressed after recent failure.'))
        }

        let requestPromise = getApiMayor({ from: from.toISOString(), to: to.toISOString() })
            .then(response => {
                mayorDataRequestCache.delete(cacheKey)
                mayorDataFailureCache.delete(cacheKey)

                let parsed = (response.data as any).map(parseMayorData)
                mayorDataCache.set(cacheKey, parsed)
                return parsed
            })
            .catch(error => {
                mayorDataRequestCache.delete(cacheKey)
                mayorDataFailureCache.set(cacheKey, Date.now())

                // temporarly don't show mayor errors
                //apiErrorHandler(RequestType.MAYOR_DATA, error, { start, end })
                throw error
            })

        mayorDataRequestCache.set(cacheKey, requestPromise)
        return requestPromise
    }

    let getTransactions = (): Promise<Transaction[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load transactions.')
                reject()
                return
            }

            getApiPremiumTransactions(googleTokenHeaders(googleId))
                .then(response => {
                    let data = response.data as any
                    resolve(data ? data.map(parseTransaction) : [])
                })
                .catch(error => {
                    apiErrorHandler(RequestType.STRIPE_PAYMENT_SESSION, error, '')
                    reject(error)
                })
        })
    }

    let getPlayerInventory = (): Promise<InventoryData[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load the inventory.')
                reject()
                return
            }
            getApiInventory(googleTokenHeaders(googleId))
                .then(response => {
                    let data = response.data as any
                    resolve(data ? (data as TradeObject[]).slice(Math.max(data.length - 36, 0)).map(parseInventoryData) : [])
                })
                .catch(error => {
                    apiErrorHandler(RequestType.INVENTORY_DATA, error)
                    reject(error)
                })
        })
    }

    let createTradeOffer = (playerUUID: string, offer?: InventoryData, wantedItems: WantedItem[] = [], offeredCoins?: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load the inventory.')
                reject()
                return
            }
            postApiTrades(
                [
                    {
                        playerUuid: playerUUID,
                        item: offer,
                        coins: offeredCoins,
                        wantedItems: wantedItems
                    } as any
                ],
                googleTokenHeaders(googleId)
            )
                .then(() => {
                    resolve()
                })
                .catch(error => {
                    apiErrorHandler(RequestType.CREATE_TRADE_OFFER, error)
                    reject(error)
                })
        })
    }

    let deleteTradeOffer = (tradeId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to delete your trades.')
                reject()
                return
            }
            deleteApiTradesId(tradeId, googleTokenHeaders(googleId))
                .then(() => {
                    resolve()
                })
                .catch(error => {
                    apiErrorHandler(RequestType.DELETE_TRADE_OFFER, error, tradeId)
                    reject(error)
                })
        })
    }

    // NOT migrated: the generated `getApiTrades` sends its filter as a JSON body on a GET
    // request, which the Fetch API rejects outright in browsers ("Request with GET/HEAD
    // method cannot have body"), so it can't be used as a drop-in replacement here.
    let getTradeOffers = (onlyOwn: boolean, filter?: ItemFilter): Promise<TradeObject[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to use the trade feature.')
                reject()
                return
            }
            let params = new URLSearchParams()
            if (filter) {
                params = new URLSearchParams({
                    filters: JSON.stringify(filter)
                })
            }

            httpApi.sendApiRequest({
                type: RequestType.GET_TRADES,
                customRequestURL: `${getApiEndpoint()}/trades${onlyOwn ? '/own' : ''}?${filter ? `${params.toString()}` : ''}`,
                data: '',
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                resolve: data => {
                    resolve(data ? data.map(parseTradeObject) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_TRADES, error)
                    reject(error)
                }
            })
        })
    }

    let getNotificationTargets = (): Promise<NotificationTarget[]> => {
        return notificationApi.getNotificationTargets()
    }

    let addNotificationTarget = (target: NotificationTarget): Promise<NotificationTarget> => {
        return notificationApi.addNotificationTarget(target)
    }

    let deleteNotificationTarget = (target: NotificationTarget): Promise<void> => {
        return notificationApi.deleteNotificationTarget(target)
    }

    let updateNotificationTarget = (target: NotificationTarget): Promise<NotificationTarget> => {
        return notificationApi.updateNotificationTarget(target)
    }

    let sendTestNotification = (target: NotificationTarget): Promise<void> => {
        return notificationApi.sendTestNotification(target)
    }

    let getNotificationSubscriptions = (): Promise<NotificationSubscription[]> => {
        return notificationApi.getNotificationSubscriptions()
    }

    let createNotificationSubscription = (subscription: NotificationSubscription): Promise<NotificationSubscription> => {
        return notificationApi.createNotificationSubscription(subscription)
    }

    let deleteNotificationSubscription = (subscription: NotificationSubscription): Promise<void> => {
        return notificationApi.deleteNotificationSubscription(subscription)
    }

    let getPublishedConfigs = (): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_PUBLISHED_CONFIGS,
                data: '',
                resolve: (configs: any) => {
                    resolve(configs)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_PUBLISHED_CONFIGS, error, '')
                    reject(error)
                }
            })
        })
    }

    let loadConfig = (configName: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.LOAD_CONFIG,
                data: { configName },
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.LOAD_CONFIG, error, configName)
                    reject(error)
                }
            })
        })
    }

    let updateConfig = (configName: string, updateNotes: string = ''): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.UPDATE_CONFIG,
                data: { configName, updateNotes },
                resolve: (configs: any) => {
                    resolve(configs)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.UPDATE_CONFIG, error, '')
                    reject(error)
                }
            })
        })
    }

    let requestArchivedAuctions = (itemTag: string, itemFilter?: ItemFilter): Promise<ArchivedAuctionResponse> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to request archived auctions.')
                reject()
                return
            }

            let params = (itemFilter && Object.keys(itemFilter).length > 0 ? { ...itemFilter } : undefined) as any

            getApiAuctionsTagItemTagArchiveOverview(itemTag, params, googleTokenHeaders(googleId))
                .then(response => {
                    resolve(parseArchivedAuctions(response.data))
                })
                .catch(error => {
                    apiErrorHandler(RequestType.ARCHIVED_AUCTIONS, error, { itemTag, itemFilter })
                    reject(error)
                })
        })
    }

    let exportArchivedAuctionsData = (itemTag: string, itemFilter: ItemFilter, discordWebhookUrl: string, flags: string[]): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to export archived auctions.')
                reject()
                return
            }

            postApiAuctionsTagItemTagArchiveExport(
                itemTag,
                {
                    filters: itemFilter,
                    discordWebhookUrl: discordWebhookUrl,
                    flags: flags.length > 0 ? flags.toString() : undefined
                } as any,
                googleTokenHeaders(googleId)
            )
                .then(() => {
                    resolve()
                })
                .catch(error => {
                    apiErrorHandler(RequestType.EXPORT_ARCHIVED_AUCTIONS, error, { itemTag, itemFilter })
                    reject(error)
                })
        })
    }

    let getLinkvertiseLink = (provider: string = 'linkvertise'): Promise<string> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to do linkvertise tasks.')
                reject()
                return
            }

            getApiLinkvertise({ provider }, googleTokenHeaders(googleId))
                .then(response => {
                    const status = response.status as number
                    if (status < 200 || status >= 300) {
                        const error = response.data as any
                        reject(error)
                        return
                    }
                    resolve(response.data as any)
                })
                .catch(error => {
                    reject(error)
                })
        })
    }

    let purchasePremiumSubscription = (productSlug: string, googleToken: string): Promise<PaymentResponse> => {
        return postApiPremiumSubscriptionSubscriptionSlug(productSlug, undefined, googleTokenHeaders(googleToken))
            .then(response => parsePaymentResponse(response.data))
            .catch(error => {
                apiErrorHandler(RequestType.PURCHASE_PREMIUM_SUBSCRIPTION, error)
                throw error
            })
    }

    let getPremiumSubscriptions = (): Promise<PremiumSubscription[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to create a premium subscription.')
                reject()
                return
            }

            getApiPremiumSubscription(googleTokenHeaders(googleId))
                .then(response => {
                    let subscriptions = (response.data as any) ?? []
                    resolve(subscriptions.map(parsePremiumSubscription))
                })
                .catch(error => {
                    apiErrorHandler(RequestType.CREATE_PREMIUM_SUBSCRIPTION, error)
                    reject(error)
                })
        })
    }

    let cancelPremiumSubscription = (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to cancel a premium subscription.')
                reject()
                return
            }

            deleteApiPremiumSubscriptionExternalId(id, googleTokenHeaders(googleId))
                .then(() => {
                    resolve()
                })
                .catch(error => {
                    apiErrorHandler(RequestType.DELETE_PREMIUM_SUBSCRIPTION, error)
                    reject(error)
                })
        })
    }

    let deleteAccount = (): Promise<AccountDeletionResult> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to delete your account.')
                reject()
                return
            }

            httpApi.sendApiRequest({
                type: RequestType.DELETE_ACCOUNT,
                customRequestURL: `${getApiEndpoint()}/user/me`,
                requestMethod: 'DELETE',
                data: '',
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                resolve: (data: AccountDeletionResult) => {
                    resolve(data)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.DELETE_ACCOUNT, error)
                    reject(error)
                }
            })
        })
    }

    let getCraftInstructions = (itemTag: string): Promise<CraftingInstructions> => {
        return getApiCraftItemTagInstructions(itemTag)
            .then(response => parseCraftingInstructions(response.data))
            .catch(error => {
                apiErrorHandler(RequestType.GET_CRAFTING_INSTRUCTIONS, error, itemTag)
                throw error
            })
    }

    return {
        search,
        trackSearch,
        getItemDetails,
        getItemPrices,
        getAuctions,
        getBids,
        getEnchantments,
        getAuctionDetails,
        getItemImageUrl,
        getPlayerName,
        getPlayerNames,
        setConnectionId,
        getVersion,
        subscribe,
        unsubscribe,
        getNotificationListener,
        loginWithToken,
        getRecentAuctions,
        getFlips,
        subscribeFlips,
        subscribeAuctionUpdates,
        subscribeSoldAuctions,
        unsubscribeUpdates,
        getFilters,
        getNewPlayers,
        getNewItems,
        getPopularSearches,
        getEndedAuctions,
        getNewAuctions,
        getFlipBasedAuctions,
        getRefInfo,
        setRef,
        getActiveAuctions,
        connectMinecraftAccount,
        getAccountInfo,
        unsubscribeFlips,
        itemSearch,
        authenticateModConnection,
        getFlipUpdateTime,
        playerSearch,
        getProfitableCrafts,
        getCraftAcquisitionPlan,
        getLowSupplyItems,
        sendFeedback,
        triggerPlayerNameCheck,
        getPlayerProfiles,
        getCraftingRecipe,
        getLowestBin,
        flipFilters,
        getBazaarTags,
        getPreloadFlips,
        getItemPriceSummary,
        purchaseWithCoflcoins,
        getTermsStatus,
        acceptTerms,
        subscribeCoflCoinChange,
        getCoflcoinBalance,
        setFlipSetting,
        getKatFlips,
        getTrackedFlipsForPlayer,
        transferCoflCoins,
        getBazaarSnapshot,
        getBazaarPrices,
        getBazaarPricesByRange,
        subscribeFlipsAnonym,
        getPrivacySettings,
        setPrivacySettings,
        checkRat,
        getPremiumProducts,
        getItemNames,
        checkFilter,
        refreshLoadPremiumProducts,
        getRelatedItems,
        getOwnerHistory,
        getMayorData,
        getPlayerInventory,
        createTradeOffer,
        getTradeOffers,
        deleteTradeOffer,
        getTransactions,
        getNotificationTargets,
        addNotificationTarget,
        deleteNotificationTarget,
        updateNotificationTarget,
        sendTestNotification,
        createNotificationSubscription,
        deleteNotificationSubscription,
        getNotificationSubscriptions,
        getPublishedConfigs,
        loadConfig,
        updateConfig,
        requestArchivedAuctions,
        exportArchivedAuctionsData,
        getLinkvertiseLink,
        getPremiumSubscriptions,
        cancelPremiumSubscription,
        purchasePremiumSubscription,
        getCraftInstructions,
        deleteAccount
    }
}

let api = initAPI()

export default api
