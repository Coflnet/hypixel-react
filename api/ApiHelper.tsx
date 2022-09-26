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
    parseItem,
    parseItemBidForList,
    parseItemPrice,
    parseItemSummary,
    parseKatFlip,
    parseLowSupplyItem,
    parseMinecraftConnectionInfo,
    parsePaymentResponse,
    parsePlayer,
    parsePopularSearch,
    parsePremiumProducts,
    parsePrivacySettings,
    parseProfitableCraft,
    parseRecentAuction,
    parseRefInfo,
    parseReforge,
    parseSearchResultItem,
    parseSkyblockProfile,
    parseSubscription,
    parseTEMItem,
    parseTEMPlayer
} from '../utils/Parser/APIResponseParser'
import { RequestType, SubscriptionType, Subscription, HttpApi } from './ApiTypes.d'
import { websocketHelper } from './WebsocketHelper'
import { v4 as generateUUID } from 'uuid'
import { enchantmentAndReforgeCompare } from '../utils/Formatter'
import { toast } from 'react-toastify'
import cacheUtils from '../utils/CacheUtils'
import { checkForExpiredPremium } from '../utils/ExpiredPremiumReminderUtils'
import { getFlipCustomizeSettings } from '../utils/FlipUtils'
import { getProperty } from '../utils/PropertiesUtils'
import { isClientSideRendering } from '../utils/SSRUtils'
import { FLIPPER_FILTER_KEY, getSettingsObject, mapSettingsToApiFormat, RESTRICTIONS_SETTINGS_KEY, setSettingsChangedData } from '../utils/SettingsUtils'
import { initHttpHelper } from './HttpHelper'
import { atobUnicode } from '../utils/Base64Utils'
import { PREMIUM_TYPES } from '../utils/PremiumTypeUtils'

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
        if (!error || !error.Message) {
            return
        }
        toast.error(error.Message)
        console.log('RequestType: ' + requestType)
        console.log('ErrorMessage: ' + error.Message)
        console.log('RequestData: ')
        console.log(requestData)
        console.log('------------------------------')
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
                    reject()
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
                    reject()
                }
            })
        })
    }

    let getItemPrices = (itemTag: string, fetchSpan: DateRange, itemFilter?: ItemFilter): Promise<ItemPrice[]> => {
        return new Promise((resolve, reject) => {
            let query = ''
            if (!itemFilter || Object.keys(itemFilter).length === 0) {
                itemFilter = undefined
            } else {
                Object.keys(itemFilter).forEach(key => {
                    query += `${key}=${itemFilter[key]}&`
                })
            }

            httpApi.sendApiRequest({
                type: RequestType.ITEM_PRICES,
                data: '',
                customRequestURL: getApiEndpoint() + `/item/price/${itemTag}/history/${fetchSpan}?${query}`,
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
                    reject()
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
                    reject()
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
                    reject()
                }
            })
        })
    }

    let getAuctions = (uuid: string, amount: number, offset: number): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                uuid: uuid,
                amount: amount,
                offset: offset
            }
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.PLAYER_AUCTION,
                    data: requestData,
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
                        apiErrorHandler(RequestType.PLAYER_AUCTION, error, requestData)
                        reject()
                    }
                },
                2
            )
        })
    }

    let getBids = (uuid: string, amount: number, offset: number): Promise<BidForList[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                uuid: uuid,
                amount: amount,
                offset: offset
            }
            httpApi.sendLimitedCacheRequest({
                type: RequestType.PLAYER_BIDS,
                data: requestData,
                resolve: (bids: any) => {
                    resolve(
                        bids.map((bid: any) => {
                            return parseItemBidForList(bid)
                        })
                    )
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_BIDS, error, requestData)
                    reject()
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
                    reject()
                }
            })
        })
    }

    let getReforges = (): Promise<Reforge[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.ALL_REFORGES,
                data: '',
                resolve: (reforges: any) => {
                    let parsedReforges: Reforge[] = reforges.map(reforge => {
                        return parseReforge({
                            name: reforge.label,
                            id: reforge.id
                        })
                    })
                    parsedReforges = parsedReforges
                        .filter(reforge => {
                            return reforge.name!.toLowerCase() !== 'unknown'
                        })
                        .sort(enchantmentAndReforgeCompare)
                    resolve(parsedReforges)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ALL_ENCHANTMENTS, error, '')
                    reject()
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

    let getAuctionDetails = (auctionUUID: string): Promise<AuctionDetails> => {
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
                        api.getPlayerName(auctionDetails.auctioneerId).then(name => {
                            auctionDetails.auctioneer = {
                                name,
                                uuid: auctionDetails.auctioneerId
                            }
                            returnSSRResponse ? resolve(auctionDetails) : resolve(parseAuctionDetails(auctionDetails))
                        })
                    } else {
                        returnSSRResponse ? resolve(auctionDetails) : resolve(parseAuctionDetails(auctionDetails))
                    }
                },
                reject: (error: any) => {
                    reject(error)
                }
            })
        })
    }

    let getPlayerName = (uuid: string): Promise<string> => {
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
                    reject()
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
                    reject()
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
                    reject()
                }
            })
        })
    }

    let subscribe = (topic: string, types: SubscriptionType[], price?: number, filter?: ItemFilter): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Add none, so reduce works (doesnt change the result)
            types.push(SubscriptionType.NONE)

            if (filter) {
                filter._hide = undefined
                filter._sellerName = undefined
            }

            let requestData = {
                topic: topic,
                price: price || undefined,
                type: types.reduce((a, b) => {
                    let aNum: number = typeof a === 'number' ? (a as number) : parseInt(SubscriptionType[a])
                    let bNum: number = typeof b === 'number' ? (b as number) : parseInt(SubscriptionType[b])
                    return aNum + bNum
                }),
                filter: filter ? JSON.stringify(filter) : undefined
            }
            websocketHelper.sendRequest({
                type: RequestType.SUBSCRIBE,
                data: requestData,
                resolve: () => {
                    resolve()
                },
                reject: error => {
                    reject(error)
                }
            })
        })
    }

    let unsubscribe = (subscription: Subscription): Promise<Number> => {
        return new Promise((resolve, reject) => {
            // Add none, so reduce works (doesnt change the result)
            subscription.types.push(SubscriptionType.NONE)

            let requestData = {
                topic: subscription.topicId,
                price: subscription.price,
                type: subscription.types.reduce((a, b) => {
                    let aNum: number = typeof a === 'number' ? (a as number) : parseInt(SubscriptionType[a])
                    let bNum: number = typeof b === 'number' ? (b as number) : parseInt(SubscriptionType[b])
                    return aNum + bNum
                }),
                filter: subscription.filter ? JSON.stringify(subscription.filter) : undefined
            }

            websocketHelper.sendRequest({
                type: RequestType.UNSUBSCRIBE,
                data: requestData,
                resolve: (response: any) => {
                    resolve(parseInt(response))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.UNSUBSCRIBE, error, '')
                    reject()
                }
            })
        })
    }

    let getSubscriptions = (): Promise<Subscription[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_SUBSCRIPTIONS,
                data: '',
                resolve: (response: any[]) => {
                    resolve(
                        response.map(s => {
                            return parseSubscription(s)
                        })
                    )
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_SUBSCRIPTIONS, error, '')
                    reject()
                }
            })
        })
    }

    let setGoogle = (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.SET_GOOGLE,
                data: id,
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_GOOGLE, error)
                    reject()
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
                    reject()
                }
            })
        })
    }

    let getRecentAuctions = (itemTag: string, itemFilter: ItemFilter): Promise<RecentAuction[]> => {
        return new Promise((resolve, reject) => {
            let query = ''
            if (!itemFilter || Object.keys(itemFilter).length === 0) {
                itemFilter = undefined
            } else {
                Object.keys(itemFilter).forEach(key => {
                    query += `${key}=${itemFilter[key]}&`
                })
            }

            httpApi.sendApiRequest({
                type: RequestType.RECENT_AUCTIONS,
                customRequestURL: getApiEndpoint() + `/auctions/tag/${itemTag}/recent/overview?${query}`,
                data: '',
                resolve: (data: any) => {
                    resolve(data ? data.map(a => parseRecentAuction(a)) : [])
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, itemTag)
                    reject()
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
                    reject()
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
        forceSettingsUpdate: boolean = false
    ) => {
        websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_FLIPS)

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
                                true
                            )
                        } else {
                            setSettingsChangedData(response.data)
                        }
                        break
                    case 'settingsUpdate':
                        let data = response.data as any
                        if (data.changer === window.sessionStorage.getItem('sessionId')) {
                            return
                        }
                        setSettingsChangedData(response.data)
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
                subscribeFlips(restrictions, filter, getFlipCustomizeSettings(), flipCallback, soldCallback, nextUpdateNotificationCallback, undefined, false)
            }
        })
    }

    let subscribeFlipsAnonym = (
        restrictionList: FlipRestriction[],
        filter: FlipperFilter,
        flipSettings: FlipCustomizeSettings,
        flipCallback?: Function,
        soldCallback?: Function,
        nextUpdateNotificationCallback?: Function,
        onSubscribeSuccessCallback?: Function
    ) => {
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
                subscribeFlips(restrictions, filter, getFlipCustomizeSettings(), flipCallback, soldCallback, nextUpdateNotificationCallback, undefined, false)
            }
        })
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
                    reject()
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
                        reject()
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
                        reject()
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
                        reject()
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
                        reject()
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
                        reject()
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
                    reject()
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
                        reject()
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

    let purchaseWithCoflcoins = (productId: string, count?: number): Promise<void> => {
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
                        reject()
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
                    reject()
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
                    reject()
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
                    reject()
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

    let itemSearch = (searchText: string): Promise<FilterOptions[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.ITEM_SEARCH,
                data: searchText,
                resolve: function (data) {
                    resolve(data.map(a => parseSearchResultItem(a)))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.ITEM_SEARCH, error, searchText)
                    reject()
                }
            })
        })
    }

    let authenticateModConnection = (conId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.AUTHENTICATE_MOD_CONNECTION,
                data: conId,
                resolve: function () {
                    resolve()
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.AUTHENTICATE_MOD_CONNECTION, error, conId)
                    reject()
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
                    reject()
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
                    reject()
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
                        reject()
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
                    reject()
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
                    reject()
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
                    reject()
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
                    reject()
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
                        reject()
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
                    reject()
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
                    reject()
                }
            })
        })
    }

    let setFlipSetting = (key: string, value: any): Promise<void> => {
        if (sessionStorage.getItem('googleId') === null) {
            return Promise.resolve()
        }
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

    let getTrackedFlipsForPlayer = (playerUUID: string): Promise<FlipTrackingResponse> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_TRACKED_FLIPS_FOR_PLAYER,
                data: playerUUID,
                resolve: function (data) {
                    returnSSRResponse ? resolve(data) : resolve(parseFlipTrackingResponse(data))
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.GET_TRACKED_FLIPS_FOR_PLAYER, error, playerUUID)
                    reject()
                }
            })
        })
    }

    let transferCoflCoins = (email: string, mcId: string, amount: number, reference: string): Promise<void> => {
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
                    reject()
                }
            })
        })
    }

    let getBazaarSnapshot = (itemTag: string, timestamp?: string | number | Date): Promise<BazaarSnapshot> => {
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
                    reject()
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

    let getTEMPlayerData = (playerUUID: string): Promise<TEM_Player> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_TEM_PLAYER_DATA,
                data: '',
                requestMethod: 'GET',
                customRequestURL: `${getApiEndpoint()}/tem/player/${playerUUID}`,
                resolve: player => {
                    resolve(parseTEMPlayer(player))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_TEM_PLAYER_DATA, error, playerUUID)
                    reject(error)
                }
            })
        })
    }

    let getTEMPlayerDataByProfileUUID = (profileUUID: string): Promise<TEM_Player> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_TEM_PLAYER_DATA_BY_PROFILE,
                data: '',
                requestMethod: 'GET',
                customRequestURL: `${getApiEndpoint()}/tem/playerProfile/${profileUUID}`,
                resolve: player => {
                    resolve(parseTEMPlayer(player))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_TEM_PLAYER_DATA_BY_PROFILE, error, profileUUID)
                    reject(error)
                }
            })
        })
    }

    let getTEMItemData = (itemUid: string): Promise<TEM_Item> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.GET_TEM_PLAYER_DATA,
                data: '',
                requestMethod: 'GET',
                customRequestURL: `${getApiEndpoint()}/tem/coflItem/${itemUid}`,
                resolve: player => {
                    resolve(returnSSRResponse ? player : parseTEMItem(player))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_TEM_PLAYER_DATA, error, itemUid)
                    reject(error)
                }
            })
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
                    reject()
                }
            })
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
        getReforges,
        getAuctionDetails,
        getItemImageUrl,
        getPlayerName,
        setConnectionId,
        getVersion,
        subscribe,
        unsubscribe,
        getSubscriptions,
        setGoogle,
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
        getTEMItemData,
        getTEMPlayerData,
        getTEMPlayerDataByProfileUUID,
        unsubscribeAll
    }
}

let api = initAPI()

export default api
