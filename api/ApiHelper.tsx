import { toast } from 'react-toastify'
import { v4 as generateUUID } from 'uuid'
import { atobUnicode } from '../utils/Base64Utils'
import cacheUtils from '../utils/CacheUtils'
import { getFlipCustomizeSettings } from '../utils/FlipUtils'
import { enchantmentAndReforgeCompare } from '../utils/Formatter'
import {
    parseAccountInfo,
    parseAuction,
    parseAuctionDetails,
    parseBazaarPrice,
    parseBazaarSnapshot,
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
    parsePaymentResponse,
    parsePlayer,
    parsePopularSearch,
    parsePremiumProducts,
    parsePrivacySettings,
    parseProfitableCraft,
    parseRecentAuction,
    parseRefInfo,
    parseSearchResultItem,
    parseSkyblockProfile,
    parseSubscription,
    parseTradeObject,
    parseTransaction
} from '../utils/Parser/APIResponseParser'
import { PREMIUM_TYPES } from '../utils/PremiumTypeUtils'
import { getProperty } from '../utils/PropertiesUtils'
import {
    FLIPPER_FILTER_KEY,
    getSettingsObject,
    LAST_PREMIUM_PRODUCTS,
    mapSettingsToApiFormat,
    RESTRICTIONS_SETTINGS_KEY,
    setSettingsFromServerSide,
    storeUsedTagsInLocalStorage
} from '../utils/SettingsUtils'
import { isClientSideRendering } from '../utils/SSRUtils'
import { HttpApi, RequestType, Subscription, SubscriptionType } from './ApiTypes.d'
import { initHttpHelper } from './HttpHelper'
import { websocketHelper } from './WebsocketHelper'
import { canUseClipBoard, writeToClipboard } from '../utils/ClipboardUtils'
import properties from '../properties'

function getApiEndpoint() {
    return isClientSideRendering() ? getProperty('apiEndpoint') : process.env.API_ENDPOINT || getProperty('apiEndpoint')
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
            toast.error(error.message, {
                onClick: () => {
                    if (error.Trace && canUseClipBoard()) {
                        writeToClipboard(error.Trace)
                    }
                }
            })
        }
        console.log('RequestType: ' + requestType)
        console.log('ErrorMessage: ' + error.message)
        console.log('RequestData: ')
        console.log(requestData)
        console.log('------------------------------\n')
    }

    let search = (searchText: string): Promise<SearchResultItem[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.SEARCH,
                data: searchText,
                resolve: (items: any) => {
                    resolve(
                        !items
                            ? []
                            : items.map((item: any) => {
                                  return parseSearchResultItem(item)
                              })
                    )
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SEARCH, error, searchText)
                    reject(error)
                }
            })
        })
    }

    let getItemImageUrl = (item: Item): string => {
        return 'https://sky.coflnet.com/static/icon/' + item.tag
    }

    let getItemDetails = (itemTag: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.ITEM_DETAILS,
                customRequestURL: `${getApiEndpoint()}/item/${itemTag}/details`,
                data: '',
                resolve: (item: any) => {
                    returnSSRResponse ? resolve(item) : resolve(parseItem(item))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_DETAILS, error, itemTag)
                    reject(error)
                }
            })
        })
    }

    let getItemPrices = (itemTag: string, fetchSpan: DateRange, itemFilter?: ItemFilter): Promise<ItemPrice[]> => {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams()
            if (itemFilter && Object.keys(itemFilter).length > 0) {
                params = new URLSearchParams(itemFilter)
            }

            httpApi.sendApiRequest({
                type: RequestType.ITEM_PRICES,
                data: '',
                customRequestURL: getApiEndpoint() + `/item/price/${itemTag}/history/${fetchSpan}?${params.toString()}`,
                requestMethod: 'GET',
                requestHeader: {
                    'Content-Type': 'application/json'
                },
                resolve: (data: any) => {
                    if (returnSSRResponse) {
                        resolve(data)
                        return
                    }
                    resolve(data ? data.map(parseItemPrice).sort((a: ItemPrice, b: ItemPrice) => a.time.getTime() - b.time.getTime()) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_PRICES, error, {
                        itemTag,
                        fetchSpan,
                        itemFilter
                    })
                    reject(error)
                }
            })
        })
    }

    let getBazaarPrices = (itemTag: string, fetchSpan: DateRange): Promise<BazaarPrice[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.BAZAAR_PRICES,
                data: '',
                customRequestURL: getProperty('apiEndpoint') + `/bazaar/${itemTag}/history/${fetchSpan}`,
                requestMethod: 'GET',
                resolve: (data: any) => {
                    resolve(data ? data.map(parseBazaarPrice).sort((a: BazaarPrice, b: BazaarPrice) => a.timestamp.getTime() - b.timestamp.getTime()) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.BAZAAR_PRICES, error, {
                        itemTag,
                        fetchSpan
                    })
                    reject(error)
                }
            })
        })
    }

    let getBazaarPricesByRange = (itemTag: string, startDate: Date | string | number, endDate: Date | string | number): Promise<BazaarPrice[]> => {
        return new Promise((resolve, reject) => {
            let startDateIso = new Date(startDate).toISOString()
            let endDateIso = new Date(endDate).toISOString()

            httpApi.sendApiRequest({
                type: RequestType.BAZAAR_PRICES,
                data: '',
                customRequestURL: getProperty('apiEndpoint') + `/bazaar/${itemTag}/history/?start=${startDateIso}&end=${endDateIso}`,
                requestMethod: 'GET',
                resolve: (data: any) => {
                    data = data.filter(d => d.sell !== undefined && d.buy !== undefined)

                    let sumBuy = 0
                    let sumSell = 0
                    data.forEach(d => {
                        sumBuy += d.buy
                        sumSell += d.sell
                    })
                    let avgBuy = sumBuy / data.length
                    let avgSell = sumSell / data.length

                    let bazaarData: BazaarPrice[] = data
                        .map(parseBazaarPrice)
                        .sort((a: BazaarPrice, b: BazaarPrice) => a.timestamp.getTime() - b.timestamp.getTime())
                    let normalizer = 8
                    resolve(
                        bazaarData.filter(
                            b =>
                                b.buyData.max < avgBuy * normalizer &&
                                b.sellData.max < avgSell * normalizer &&
                                b.buyData.min > avgBuy / normalizer &&
                                b.sellData.min > avgSell / normalizer
                        )
                    )
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.BAZAAR_PRICES, error, {
                        itemTag,
                        startDateIso,
                        endDateIso
                    })
                    reject(error)
                }
            })
        })
    }

    let getAuctions = (uuid: string, page: number = 0, itemFilter?: ItemFilter): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams()
            params.append('page', page.toString())

            if (itemFilter && Object.keys(itemFilter).length > 0) {
                Object.keys(itemFilter).forEach(key => {
                    params.append(key, itemFilter[key])
                })
            }

            httpApi.sendApiRequest({
                type: RequestType.PLAYER_AUCTION,
                customRequestURL: `${getApiEndpoint()}/player/${uuid}/auctions?${params.toString()}`,
                data: '',
                resolve: (auctions: any) => {
                    returnSSRResponse
                        ? resolve(auctions)
                        : resolve(
                              auctions.map((auction: any) => {
                                  return parseAuction(auction)
                              })
                          )
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_AUCTION, error, { uuid, page })
                    reject(error)
                }
            })
        })
    }

    let getBids = (uuid: string, page: number = 0, itemFilter?: ItemFilter): Promise<BidForList[]> => {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams()
            params.append('page', page.toString())

            if (itemFilter && Object.keys(itemFilter).length > 0) {
                Object.keys(itemFilter).forEach(key => {
                    params.append(key, itemFilter[key])
                })
            }

            httpApi.sendApiRequest({
                type: RequestType.PLAYER_BIDS,
                customRequestURL: `${getApiEndpoint()}/player/${uuid}/bids?${params.toString()}`,
                data: '',
                resolve: (bids: any) => {
                    resolve(
                        bids.map((bid: any) => {
                            return parseItemBidForList(bid)
                        })
                    )
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_BIDS, error, { uuid, page })
                    reject(error)
                }
            })
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
            resolve: () => {},
            reject: (error: any) => {
                apiErrorHandler(RequestType.TRACK_SEARCH, error, requestData)
            }
        })
    }

    let getAuctionDetails = (auctionUUID: string): Promise<{ parsed: AuctionDetails; original: any }> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.AUCTION_DETAILS,
                data: auctionUUID,
                resolve: auctionDetails => {
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
                },
                reject: (error: any) => {
                    reject(error)
                }
            })
        })
    }

    let getPlayerName = (uuid: string): Promise<string> => {
        // Reduce amount of API calls during test runs
        if (properties.isTestRunner) {
            return Promise.resolve('TestRunnerUser')
        }
        return new Promise((resolve, reject) => {
            if (!uuid) {
                resolve('')
                return
            }
            httpApi.sendApiRequest({
                type: RequestType.PLAYER_NAME,
                customRequestURL: `${getApiEndpoint()}/player/${uuid}/name`,
                data: '',
                resolve: name => {
                    resolve(name)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_NAME, error, uuid)
                    reject(error)
                }
            })
        })
    }

    let connectionId = null

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

    let subscribe = (topic: string, types: SubscriptionType[], price?: number, filter?: ItemFilter): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to create a notification listeners')
                reject()
                return
            }

            let typesToSend: SubscriptionType[] = [...types]
            typesToSend.push(SubscriptionType.NONE)

            if (filter) {
                filter._hide = undefined
                filter._sellerName = undefined
            }

            let requestData = {
                topicId: topic,
                price: price || undefined,
                type: typesToSend.reduce((a, b) => {
                    let aNum: number = typeof a === 'number' ? (a as number) : parseInt(SubscriptionType[a])
                    let bNum: number = typeof b === 'number' ? (b as number) : parseInt(SubscriptionType[b])
                    return aNum + bNum
                }),
                filter: filter ? JSON.stringify(filter) : undefined
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.SUBSCRIBE,
                    customRequestURL: `${getApiEndpoint()}/notifications/listeners`,
                    data: '',
                    requestMethod: 'DELETE',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: () => {
                        resolve()
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.SUBSCRIBE, error)
                        reject(error)
                    }
                },
                JSON.stringify(requestData)
            )
        })
    }

    let unsubscribe = (subscription: Subscription): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to delete notification listeners')
                reject()
                return
            }

            let typesToSend: SubscriptionType[] = [...subscription.types]
            typesToSend.push(SubscriptionType.NONE)

            let filterToSend = { ...subscription.filter }

            if (subscription.filter) {
                filterToSend._hide = undefined
                filterToSend._sellerName = undefined
            }

            let requestData = {
                topicId: subscription.topicId,
                price: subscription.price || undefined,
                type: typesToSend.reduce((a, b) => {
                    let aNum: number = typeof a === 'number' ? (a as number) : parseInt(SubscriptionType[a])
                    let bNum: number = typeof b === 'number' ? (b as number) : parseInt(SubscriptionType[b])
                    return aNum + bNum
                }),
                filter: filterToSend ? JSON.stringify(filterToSend) : undefined
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.UNSUBSCRIBE,
                    customRequestURL: `${getApiEndpoint()}/notifications/listeners`,
                    data: '',
                    requestMethod: 'DELETE',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: () => {
                        resolve()
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.UNSUBSCRIBE, error)
                        reject(error)
                    }
                },
                JSON.stringify(requestData)
            )
        })
    }

    let getSubscriptions = (): Promise<Subscription[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to get notification listeners')
                reject()
                return
            }

            httpApi.sendApiRequest({
                type: RequestType.GET_SUBSCRIPTIONS,
                customRequestURL: `${getApiEndpoint()}/notifications/listeners`,
                data: '',
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                resolve: data => {
                    resolve(data ? data.map(parseSubscription) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_SUBSCRIPTIONS, error)
                    reject(error)
                }
            })
        })
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

    let setToken = (token: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.FCM_TOKEN,
                data: {
                    name: '',
                    token: token
                },
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.FCM_TOKEN, error, token)
                    reject(error)
                }
            })
        })
    }

    let getRecentAuctions = (itemTag: string, itemFilter: ItemFilter): Promise<RecentAuction[]> => {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams()
            if (itemFilter && Object.keys(itemFilter).length > 0) {
                params = new URLSearchParams(itemFilter)
            }

            httpApi.sendApiRequest({
                type: RequestType.RECENT_AUCTIONS,
                customRequestURL: getApiEndpoint() + `/auctions/tag/${itemTag}/recent/overview?${params.toString()}`,
                data: '',
                resolve: (data: any) => {
                    resolve(data ? data.map(a => parseRecentAuction(a)) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, itemTag)
                    reject(error)
                }
            })
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

    let getFilters = (tag: string): Promise<FilterOptions[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_FILTER,
                customRequestURL: `${getApiEndpoint()}/filter/options?itemTag=${tag}`,
                data: '',
                resolve: (data: any) => {
                    resolve(data.map(a => parseFilterOption(a)))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_FILTER, error, tag)
                }
            })
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

    let stripePurchase = (productId: string, coinAmount?: number): Promise<PaymentResponse> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to purchase something.')
                reject()
                return
            }

            let data = {
                userId: googleId,
                productId: productId
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.STRIPE_PAYMENT_SESSION,
                    requestMethod: 'POST',
                    requestHeader: {
                        GoogleToken: data.userId,
                        'Content-Type': 'application/json'
                    },
                    data: data.productId,
                    resolve: (data: any) => {
                        resolve(parsePaymentResponse(data))
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.STRIPE_PAYMENT_SESSION, error, data)
                        reject(error)
                    }
                },
                JSON.stringify({
                    coinAmount
                })
            )
        })
    }

    let paypalPurchase = (productId: string, coinAmount?: number): Promise<PaymentResponse> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to purchase something.')
                reject()
                return
            }

            let data = {
                userId: googleId,
                productId: productId
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.PAYPAL_PAYMENT,
                    requestMethod: 'POST',
                    data: data.productId,
                    requestHeader: {
                        GoogleToken: data.userId,
                        'Content-Type': 'application/json'
                    },
                    resolve: (response: any) => {
                        resolve(parsePaymentResponse(response))
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.PAYPAL_PAYMENT, error, data)
                        reject(error)
                    }
                },
                JSON.stringify({
                    coinAmount
                })
            )
        })
    }

    let lemonsqueezyPurchase = (productId: string, coinAmount?: number): Promise<PaymentResponse> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to purchase something.')
                reject()
                return
            }

            let data = {
                userId: googleId,
                productId: productId
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.LEMONSQUEEZY_PAYMENT,
                    requestMethod: 'POST',
                    data: data.productId,
                    requestHeader: {
                        GoogleToken: data.userId,
                        'Content-Type': 'application/json'
                    },
                    resolve: (response: any) => {
                        resolve(parsePaymentResponse(response))
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.LEMONSQUEEZY_PAYMENT, error, data)
                        reject(error)
                    }
                },
                JSON.stringify({
                    coinAmount
                })
            )
        })
    }

    let purchaseWithCoflcoins = (productId: string, googleToken: string, count?: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            let data = {
                userId: googleToken,
                productId: productId
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.PURCHASE_WITH_COFLCOiNS,
                    data: '',
                    requestMethod: 'POST',
                    requestHeader: {
                        GoogleToken: data.userId,
                        'Content-Type': 'application/json'
                    },
                    resolve: function () {
                        resolve()
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.PURCHASE_WITH_COFLCOiNS, error, data)
                        reject(error)
                    }
                },
                JSON.stringify({
                    count: count,
                    slug: productId
                })
            )
        })
    }

    let subscribeCoflCoinChange = () => {
        // TODO: Has yet to be implemented by the backend
        /*
        websocketHelper.subscribe({
            type: RequestType.SUBSCRIBE_COFLCOINS,
            data: '',
            callback: function (response) {
                switch (response.type) {
                    case 'coflCoinUpdate':
                        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.COFLCOIN_UPDATE, { detail: { coflCoins: response.data } }))
                        break
                    default:
                        break
                }
            }
        })
        */
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

            httpApi.sendApiRequest({
                type: RequestType.GET_REF_INFO,
                data: '',
                requestHeader: {
                    GoogleToken: googleId
                },
                resolve: (response: any) => {
                    resolve(parseRefInfo(response))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_REF_INFO, error, '')
                    reject(error)
                }
            })
        })
    }

    let setRef = (refId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to use the ref system.')
                reject()
                return
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.SET_REF,
                    data: '',
                    requestMethod: 'POST',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: () => {
                        resolve()
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.SET_REF, error, '')
                        reject(error)
                    }
                },
                JSON.stringify({
                    refCode: refId
                })
            )
        })
    }

    let getActiveAuctions = (item: Item, order: string, filter: ItemFilter = {}): Promise<RecentAuction[]> => {
        return new Promise((resolve, reject) => {
            let params = {
                orderBy: order
            }
            Object.keys(filter).forEach(key => {
                params[key] = filter[key].toString()
            })

            httpApi.sendApiRequest({
                type: RequestType.ACTIVE_AUCTIONS,
                customRequestURL: `${getApiEndpoint()}/auctions/tag/${item.tag}/active/overview?${new URLSearchParams(params).toString()}`,
                data: '',
                resolve: function (data) {
                    resolve(data.map(a => parseRecentAuction(a)))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.ACTIVE_AUCTIONS, error, {
                        tag: item.tag,
                        filter,
                        order
                    })
                    reject(error)
                }
            })
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
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.ITEM_SEARCH,
                data: searchText,
                resolve: function (data) {
                    resolve(data.map(a => parseSearchResultItem(a)))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.ITEM_SEARCH, error, searchText)
                    reject(error)
                }
            })
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
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.AUTHENTICATE_MOD_CONNECTION,
                requestMethod: 'POST',
                data: '',
                requestHeader: {
                    GoogleToken: googleToken,
                    'Content-Type': 'application/json'
                },
                customRequestURL: `${getApiEndpoint()}/mod/auth?newId=${encodeURIComponent(conId)}`,
                resolve: function () {
                    clearTimeout(timeout)
                    resolve()
                },
                reject: function (error) {
                    clearTimeout(timeout)
                    apiErrorHandler(RequestType.AUTHENTICATE_MOD_CONNECTION, error, conId)
                    reject(error)
                }
            })
        })
    }

    let getFlipUpdateTime = (): Promise<Date> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.FLIP_UPDATE_TIME,
                data: '',
                resolve: function (data) {
                    resolve(new Date(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.FLIP_UPDATE_TIME, error, '')
                }
            })
        })
    }
    let playerSearch = (playerName: string): Promise<Player[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.PLAYER_SEARCH,
                data: playerName,
                resolve: function (players) {
                    resolve(players ? players.map(parsePlayer) : [])
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.PLAYER_SEARCH, error, playerName)
                    reject(error)
                }
            })
        })
    }

    let getLowSupplyItems = (): Promise<LowSupplyItem[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_LOW_SUPPLY_ITEMS,
                data: '',
                resolve: function (items) {
                    returnSSRResponse
                        ? resolve(items)
                        : resolve(
                              items.map(item => {
                                  let lowSupplyItem = parseLowSupplyItem(item)
                                  return lowSupplyItem
                              })
                          )
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_LOW_SUPPLY_ITEMS, error, '')
                    reject(error)
                }
            })
        })
    }

    let sendFeedback = (feedbackKey: string, feedback: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            let user
            if (googleId) {
                let parts = googleId.split('.')
                if (parts.length > 2) {
                    let obj = JSON.parse(atobUnicode(parts[1]))
                    user = obj.sub
                }
            }

            let requestData = {
                Context: 'Skyblock',
                User: user || '',
                Feedback: JSON.stringify(feedback),
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

    let getProfitableCrafts = (playerId?: string, profileId?: string): Promise<ProfitableCraft[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_PROFITABLE_CRAFTS,
                customRequestURL:
                    playerId && profileId ? getApiEndpoint() + '/' + RequestType.GET_PROFITABLE_CRAFTS + `?profile=${profileId}&player=${playerId}` : undefined,
                data: '',
                resolve: function (crafts) {
                    returnSSRResponse ? resolve(crafts) : resolve(crafts.map(parseProfitableCraft))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_PROFITABLE_CRAFTS, error, '')
                    reject(error)
                }
            })
        })
    }

    let triggerPlayerNameCheck = (playerUUID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.TRIGGER_PLAYER_NAME_CHECK,
                data: '',
                customRequestURL: getApiEndpoint() + '/player/' + playerUUID + '/name',
                requestMethod: 'POST',
                resolve: function () {
                    resolve()
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.TRIGGER_PLAYER_NAME_CHECK, error, '')
                    reject(error)
                }
            })
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
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_CRAFTING_RECIPE,
                data: itemTag,
                resolve: function (data) {
                    resolve(parseCraftingRecipe(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_CRAFTING_RECIPE, error, itemTag)
                    reject(error)
                }
            })
        })
    }

    let getLowestBin = (itemTag: string): Promise<LowestBin> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_LOWEST_BIN,
                customRequestURL: 'item/price/' + itemTag + '/bin',
                data: itemTag,
                resolve: function (data) {
                    resolve({
                        lowest: data.lowest,
                        secondLowest: data.secondLowest
                    })
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_LOWEST_BIN, error, itemTag)
                    reject(error)
                }
            })
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
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_BAZAAR_TAGS,
                data: '',
                resolve: function (data) {
                    resolve(data)
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_BAZAAR_TAGS, error, '')
                    reject(error)
                }
            })
        })
    }

    let getItemPriceSummary = (itemTag: string, filter: ItemFilter): Promise<ItemPriceSummary> => {
        let getParams = new URLSearchParams(filter).toString()

        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.ITEM_PRICE_SUMMARY,
                customRequestURL: `${getApiEndpoint()}/${RequestType.ITEM_PRICE_SUMMARY}/${itemTag}?${getParams}`,
                data: '',
                resolve: function (data) {
                    returnSSRResponse ? resolve(data) : resolve(parseItemSummary(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.ITEM_PRICE_SUMMARY, error, '')
                    reject(error)
                }
            })
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
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_KAT_FLIPS,
                data: '',
                resolve: function (data) {
                    returnSSRResponse ? resolve(data) : resolve(data.map(parseKatFlip))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_KAT_FLIPS, error, '')
                }
            })
        })
    }

    let getTrackedFlipsForPlayer = (playerUUID: string, from?: Date, to?: Date): Promise<FlipTrackingResponse> => {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams()
            if (from && to) {
                params.set('start', from.toISOString())
                params.set('end', to.toISOString())
            }

            let googleId = isClientSideRendering() ? sessionStorage.getItem('googleId') : null
            let requestHeader = googleId ? { GoogleToken: googleId } : {}

            httpApi.sendApiRequest({
                customRequestURL: `${getApiEndpoint()}/flip/stats/player/${playerUUID}?${params.toString()}`,
                type: RequestType.GET_TRACKED_FLIPS_FOR_PLAYER,
                requestHeader: requestHeader,
                data: playerUUID,
                resolve: function (data) {
                    returnSSRResponse ? resolve(data) : resolve(parseFlipTrackingResponse(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_TRACKED_FLIPS_FOR_PLAYER, error, playerUUID)
                    reject(error)
                }
            })
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
                type: RequestType.TRASFER_COFLCOINS,
                data: data,
                resolve: function () {
                    resolve()
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.TRASFER_COFLCOINS, error, data)
                    reject(error)
                }
            })
        })
    }

    let getBazaarSnapshot = (itemTag: string, timestamp: string | number | Date): Promise<BazaarSnapshot> => {
        return new Promise((resolve, reject) => {
            let isoTimestamp = new Date(timestamp).toISOString()

            httpApi.sendApiRequest({
                type: RequestType.GET_BAZAAR_SNAPSHOT,
                customRequestURL: getProperty('apiEndpoint') + `/bazaar/${itemTag}/snapshot${isoTimestamp ? `?timestamp=${isoTimestamp}` : ''}`,
                data: '',
                resolve: function (data) {
                    if (!data) {
                        resolve({
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
                        })
                        return
                    }
                    resolve(parseBazaarSnapshot(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_BAZAAR_SNAPSHOT, error, { itemTag, timestamp: isoTimestamp })
                    reject(error)
                }
            })
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

            httpApi.sendApiRequest({
                type: RequestType.GET_PRIVACY_SETTINGS,
                data: '',
                customRequestURL: `${getApiEndpoint()}/user/privacy`,
                requestHeader: {
                    GoogleToken: googleId
                },
                resolve: (data: any) => {
                    resolve(parsePrivacySettings(data))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_PRIVACY_SETTINGS, error, '')
                    reject(error)
                }
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

            httpApi.sendApiRequest(
                {
                    type: RequestType.SET_PRIVACY_SETTINGS,
                    data: '',
                    requestMethod: 'POST',
                    customRequestURL: `${getApiEndpoint()}/user/privacy`,
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: () => {
                        resolve()
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.SET_PRIVACY_SETTINGS, error, settings)
                        reject(error)
                    }
                },
                JSON.stringify(settings)
            )
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
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load premium products.')
                reject()
                return
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.GET_PREMIUM_PRODUCTS,
                    data: '',
                    requestMethod: 'POST',
                    customRequestURL: `${getApiEndpoint()}/premium/user/owns`,
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: products => {
                        localStorage.setItem(LAST_PREMIUM_PRODUCTS, JSON.stringify(products))
                        resolve(parsePremiumProducts(products))
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.GET_PREMIUM_PRODUCTS, error, '')
                        reject(error)
                    }
                },
                JSON.stringify(PREMIUM_TYPES.map(type => type.productId))
            )
        })
    }

    /**
     * Uses the last loaded premium products (if available) to instantly call the callback function
     * The newest premium products are loaded after that and the callback is executed again
     */
    let refreshLoadPremiumProducts = (callback: (products: PremiumProduct[]) => void) => {
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
        })
    }

    let unsubscribeAll = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.UNSUBSCRIBE_ALL,
                data: '',
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.UNSUBSCRIBE_ALL, error, '')
                    reject(error)
                }
            })
        })
    }

    let getItemNames = (items: Item[]): Promise<{ [key: string]: string }> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest(
                {
                    type: RequestType.GET_ITEM_NAMES,
                    requestMethod: 'POST',
                    requestHeader: {
                        'Content-Type': 'application/json'
                    },
                    data: '',
                    resolve: data => {
                        resolve(data)
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.GET_ITEM_NAMES, error, items)
                        reject(error)
                    }
                },
                JSON.stringify(items.map(item => item.tag))
            )
        })
    }

    let checkFilter = (auction: AuctionDetails, filter: ItemFilter): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest(
                {
                    type: RequestType.CHECK_FILTER,
                    requestMethod: 'POST',
                    customRequestURL: `${getApiEndpoint()}/Filter`,
                    requestHeader: {
                        'Content-Type': 'application/json'
                    },
                    data: '',
                    resolve: data => {
                        resolve(data)
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.CHECK_FILTER, error, { auction, filter })
                        reject(error)
                    }
                },
                JSON.stringify({ filters: filter, auction: auction })
            )
        })
    }

    let getRelatedItems = (tag: string): Promise<Item[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.RELATED_ITEMS,
                customRequestURL: `${getApiEndpoint()}/item/${tag}/similar`,
                data: '',
                resolve: data => {
                    resolve(data.map(item => parseItem(item)))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RELATED_ITEMS, error, tag)
                    reject(error)
                }
            })
        })
    }

    let getOwnerHistory = (uid: string): Promise<OwnerHistory[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.OWNER_HISOTRY,
                customRequestURL: `${getApiEndpoint()}/auctions/uid/${uid}/sold`,
                data: '',
                resolve: data => {
                    resolve(data)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.OWNER_HISOTRY, error, uid)
                    reject(error)
                }
            })
        })
    }

    let getMayorData = (start: Date, end: Date): Promise<MayorData[]> => {
        let params = new URLSearchParams()
        params.set('from', start.toISOString())
        params.set('to', end.toISOString())

        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.MAYOR_DATA,
                customRequestURL: `${getApiEndpoint()}/mayor?${params.toString()}`,
                data: '',
                resolve: data => {
                    resolve(data.map(parseMayorData))
                },
                reject: (error: any) => {
                    // temporarly don't show mayor errors
                    //apiErrorHandler(RequestType.MAYOR_DATA, error, { start, end })
                    reject(error)
                }
            })
        })
    }

    let getTransactions = (): Promise<Transaction[]> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load transactions.')
                reject()
                return
            }

            httpApi.sendApiRequest({
                type: RequestType.GET_TRANSACTIONS,
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                customRequestURL: `${getApiEndpoint()}/premium/transactions`,
                data: '',
                resolve: (data: any) => {
                    if (!data) {
                        return []
                    }
                    resolve(data.map(parseTransaction))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.STRIPE_PAYMENT_SESSION, error, '')
                    reject(error)
                }
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
            httpApi.sendApiRequest({
                type: RequestType.INVENTORY_DATA,
                customRequestURL: `${getApiEndpoint()}/inventory`,
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                data: '',
                resolve: data => {
                    console.log(data)
                    resolve(data ? (data as TradeObject[]).slice(Math.max(data.length - 36, 0)).map(parseInventoryData) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.INVENTORY_DATA, error)
                    reject(error)
                }
            })
        })
    }

    let createTradeOffer = (playerUUID: string, offer: InventoryData, wantedItems: WantedItem[], offeredCoins: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load the inventory.')
                reject()
                return
            }
            httpApi.sendApiRequest(
                {
                    type: RequestType.CREATE_TRADE_OFFER,
                    requestMethod: 'POST',
                    customRequestURL: `${getApiEndpoint()}/trades`,
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    data: '',
                    resolve: () => {
                        resolve()
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.CREATE_TRADE_OFFER, error)
                        reject(error)
                    }
                },
                JSON.stringify([
                    {
                        playerUuid: playerUUID,
                        item: offer,
                        coins: offeredCoins,
                        wantedItems: wantedItems
                    }
                ])
            )
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
            httpApi.sendApiRequest({
                type: RequestType.DELETE_TRADE_OFFER,
                requestMethod: 'DELETE',
                customRequestURL: `${getApiEndpoint()}/trades/${tradeId}`,
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                data: '',
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.DELETE_TRADE_OFFER, error, tradeId)
                    reject(error)
                }
            })
        })
    }

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
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to load notification targets')
                reject()
                return
            }

            httpApi.sendApiRequest({
                type: RequestType.GET_NOTIFICATION_TARGETS,
                customRequestURL: `${getApiEndpoint()}/notifications/targets`,
                data: '',
                requestHeader: {
                    GoogleToken: googleId,
                    'Content-Type': 'application/json'
                },
                resolve: data => {
                    resolve(data ? data : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_NOTIFICATION_TARGETS, error)
                    reject(error)
                }
            })
        })
    }

    let addNotificationTarget = (target: NotificationTarget): Promise<NotificationTarget> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to add a notification targets')
                reject()
                return
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.ADD_NOTIFICATION_TARGETS,
                    customRequestURL: `${getApiEndpoint()}/notifications/targets`,
                    requestMethod: 'POST',
                    data: '',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: data => {
                        resolve(data ? data : [])
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.ADD_NOTIFICATION_TARGETS, error)
                        reject(error)
                    }
                },
                JSON.stringify(target)
            )
        })
    }

    let deleteNotificationTarget = (target: NotificationTarget): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to delete a notification targets')
                reject()
                return
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.ADD_NOTIFICATION_TARGETS,
                    customRequestURL: `${getApiEndpoint()}/notifications/targets`,
                    requestMethod: 'DELETE',
                    data: '',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: data => {
                        resolve(data ? data : [])
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.ADD_NOTIFICATION_TARGETS, error)
                        reject(error)
                    }
                },
                JSON.stringify(target)
            )
        })
    }

    let updateNotificationTarget = (target: NotificationTarget): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to update a notification targets')
                reject()
                return
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.UPDATE_NOTIFICATION_TARGET,
                    customRequestURL: `${getApiEndpoint()}/notifications/targets`,
                    requestMethod: 'UPDATE',
                    data: '',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: data => {
                        resolve(data ? data : [])
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.ADD_NOTIFICATION_TARGETS, error)
                        reject(error)
                    }
                },
                JSON.stringify(target)
            )
        })
    }

    let sendTestNotification = (target: NotificationTarget): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = sessionStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to send a test notification')
                reject()
                return
            }

            httpApi.sendApiRequest(
                {
                    type: RequestType.SEND_TEST_NOTIFICATION,
                    customRequestURL: `${getApiEndpoint()}/notifications/targets/test`,
                    data: '',
                    requestMethod: 'POST',
                    requestHeader: {
                        GoogleToken: googleId,
                        'Content-Type': 'application/json'
                    },
                    resolve: () => {
                        resolve()
                    },
                    reject: (error: any) => {
                        apiErrorHandler(RequestType.SEND_TEST_NOTIFICATION, error)
                        reject(error)
                    }
                },
                JSON.stringify(target)
            )
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
        setConnectionId,
        getVersion,
        subscribe,
        unsubscribe,
        getSubscriptions,
        loginWithToken,
        stripePurchase,
        setToken,
        getRecentAuctions,
        getFlips,
        subscribeFlips,
        getFilters,
        getNewPlayers,
        getNewItems,
        getPopularSearches,
        getEndedAuctions,
        getNewAuctions,
        getFlipBasedAuctions,
        paypalPurchase,
        lemonsqueezyPurchase,
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
        unsubscribeAll,
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
        sendTestNotification
    }
}

let api = initAPI()

export default api
