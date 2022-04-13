import {
    parseAccountInfo,
    parseAuction,
    parseAuctionDetails,
    parseCraftingRecipe,
    parseEnchantment,
    parseFilterOption,
    parseFlipAuction,
    parseFlipTrackingResponse,
    parseItem,
    parseItemBidForList,
    parseItemPriceData,
    parseItemSummary,
    parseKatFlip,
    parseLowSupplyItem,
    parseMinecraftConnectionInfo,
    parsePaymentResponse,
    parsePlayer,
    parsePopularSearch,
    parseProfitableCraft,
    parseRecentAuction,
    parseRefInfo,
    parseReforge,
    parseSearchResultItem,
    parseSkyblockProfile,
    parseSubscription
} from '../utils/Parser/APIResponseParser'
import { RequestType, SubscriptionType, Subscription, CUSTOM_EVENTS } from './ApiTypes.d'
import { websocketHelper } from './WebsocketHelper'
import { v4 as generateUUID } from 'uuid'
import { Stripe } from '@stripe/stripe-js'
import { enchantmentAndReforgeCompare } from '../utils/Formatter'
import { googlePlayPackageName } from '../utils/GoogleUtils'
import { toast } from 'react-toastify'
import cacheUtils from '../utils/CacheUtils'
import { checkForExpiredPremium } from '../utils/ExpiredPremiumReminderUtils'
import { getFlipCustomizeSettings } from '../utils/FlipUtils'
import { getProperty } from '../utils/PropertiesUtils'
import { Base64 } from 'js-base64'
import { isClientSideRendering } from '../utils/SSRUtils'
import { initHttpHelper } from './HttpHelper'

export function initAPI(returnSSRResponse: boolean = false): API {
    let httpApi
    if (isClientSideRendering()) {
        httpApi = initHttpHelper()
    } else {
        let commandEndpoint = process.env.COMMAND_ENDPOINT
        let apiEndpoint = process.env.API_ENDPOINT
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

    let getItemDetails = (itemTagOrName: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.ITEM_DETAILS,
                data: itemTagOrName,
                resolve: (item: any) => {
                    returnSSRResponse ? resolve(item) : resolve(parseItem(item))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_DETAILS, error, itemTagOrName)
                    reject()
                }
            })
        })
    }

    let getItemPrices = (itemTagOrName: string, fetchStart: number, itemFilter?: ItemFilter): Promise<ItemPriceData> => {
        return new Promise((resolve, reject) => {
            if (!itemFilter || Object.keys(itemFilter).length === 0) {
                itemFilter = undefined
            }

            let requestData = {
                name: itemTagOrName,
                start: Math.round(fetchStart / 100000) * 100,
                filter: itemFilter
            }
            httpApi.sendRequest({
                type: RequestType.ITEM_PRICES,
                data: requestData,
                resolve: (data: any) => {
                    resolve(parseItemPriceData(data))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_PRICES, error, requestData)
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

    let getAuctionDetails = (auctionUUID: string, ignoreCache?: number): Promise<AuctionDetails> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheApiRequest(
                {
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
                },
                ignoreCache ? 3 + ignoreCache : 2
            )
        })
    }

    let getPlayerName = (uuid: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.PLAYER_NAME,
                data: uuid,
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

    let setConnectionId = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            let websocketUUID = generateUUID()

            websocketHelper.sendRequest({
                type: RequestType.SET_CONNECTION_ID,
                data: websocketUUID,
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_CONNECTION_ID, error, websocketUUID)
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
                filter._label = undefined
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

    let hasPremium = (googleId: string): Promise<Date> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.PREMIUM_EXPIRATION,
                data: googleId,
                resolve: premiumUntil => {
                    checkForExpiredPremium(new Date(premiumUntil))
                    resolve(new Date(premiumUntil))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PREMIUM_EXPIRATION, error, googleId)
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

    let getRecentAuctions = (itemTagOrName: string, fetchStart: number, itemFilter?: ItemFilter): Promise<RecentAuction[]> => {
        return new Promise((resolve, reject) => {
            if (!itemFilter || Object.keys(itemFilter).length === 0) {
                itemFilter = undefined
            }

            let requestData = {
                name: itemTagOrName,
                start: Math.round(fetchStart / 100000) * 100,
                filter: itemFilter
            }
            httpApi.sendLimitedCacheRequest({
                type: RequestType.RECENT_AUCTIONS,
                data: requestData,
                resolve: (data: any) => {
                    resolve(data.map(a => parseRecentAuction(a)))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, requestData)
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
                    apiErrorHandler(RequestType.GET_FILTER, error, '')
                }
            })
        })
    }

    let subscribeFlips = (
        flipCallback: Function,
        restrictionList: FlipRestriction[],
        filter: FlipperFilter,
        soldCallback?: Function,
        nextUpdateNotificationCallback?: Function
    ) => {
        websocketHelper.removeOldSubscriptionByType(RequestType.SUBSCRIBE_FLIPS)

        let flipSettings = getFlipCustomizeSettings()

        let requestData = {
            whitelist: restrictionList
                .filter(restriction => restriction.type === 'whitelist')
                .map(restriction => {
                    return { tag: restriction.item?.tag, filter: restriction.itemFilter }
                }),
            blacklist: restrictionList
                .filter(restriction => restriction.type === 'blacklist')
                .map(restriction => {
                    return { tag: restriction.item?.tag, filter: restriction.itemFilter }
                }),
            minProfit: filter.minProfit || 0,
            minProfitPercent: filter.minProfitPercent || 0,
            minVolume: filter.minVolume || 0,
            maxCost: filter.maxCost || 0,
            filters: {},
            lbin: flipSettings.useLowestBinForProfit,
            mod: {
                justProfit: flipSettings.justProfit,
                soundOnFlip: flipSettings.soundOnFlip,
                shortNumbers: flipSettings.shortNumbers,
                blockTenSecMsg: flipSettings.blockTenSecMsg,
                format: flipSettings.modFormat,
                chat: !flipSettings.hideModChat
            },
            visibility: {
                cost: !flipSettings.hideCost,
                estProfit: !flipSettings.hideEstimatedProfit,
                lbin: !flipSettings.hideLowestBin,
                slbin: !flipSettings.hideSecondLowestBin,
                medPrice: !flipSettings.hideMedianPrice,
                seller: !flipSettings.hideSeller,
                volume: !flipSettings.hideVolume,
                extraFields: flipSettings.maxExtraInfoFields,
                profitPercent: !flipSettings.hideProfitPercent,
                sellerOpenBtn: !flipSettings.hideSellerOpenBtn,
                lore: !flipSettings.hideLore
            },
            finders: flipSettings.finders?.reduce((a, b) => +a + +b, 0)
        }

        if (filter.onlyBin) {
            requestData.filters = { Bin: 'true' }
        }

        websocketHelper.subscribe({
            type: RequestType.SUBSCRIBE_FLIPS,
            data: requestData,
            callback: function (response) {
                switch (response.type) {
                    case 'flip':
                        flipCallback(parseFlipAuction(response.data))
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
                    default:
                        break
                }
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

    let getFilter = (name: string): Promise<FilterOptions> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.GET_FILTER,
                data: name,
                resolve: (data: any) => {
                    resolve(data)
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_FILTER, error, name)
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

    let stripePurchase = (productId: string): Promise<PaymentResponse> => {
        return new Promise((resolve, reject) => {
            let googleId = localStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to purchase something.')
                reject()
                return
            }

            let data = {
                userId: googleId,
                productId: productId
            }

            httpApi.sendApiRequest({
                type: RequestType.STRIPE_PAYMENT_SESSION,
                requestMethod: 'POST',
                requestHeader: {
                    GoogleToken: data.userId
                },
                data: data.productId,
                resolve: (data: any) => {
                    resolve(parsePaymentResponse(data))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.STRIPE_PAYMENT_SESSION, error, data)
                    reject()
                }
            })
        })
    }

    let paypalPurchase = (productId: string): Promise<PaymentResponse> => {
        return new Promise((resolve, reject) => {
            let googleId = localStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to purchase something.')
                reject()
                return
            }

            let data = {
                userId: googleId,
                productId: productId
            }

            httpApi.sendApiRequest({
                type: RequestType.PAYPAL_PAYMENT,
                requestMethod: 'POST',
                data: data.productId,
                requestHeader: {
                    GoogleToken: data.userId
                },
                resolve: (response: any) => {
                    resolve(parsePaymentResponse(response))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PAYPAL_PAYMENT, error, data)
                    reject(error)
                }
            })
        })
    }

    let purchaseWithCoflcoins = (productId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = localStorage.getItem('googleId')
            if (!googleId) {
                toast.error('You need to be logged in to purchase something.')
                reject()
                return
            }

            let data = {
                userId: googleId,
                productId: productId
            }

            httpApi.sendApiRequest({
                type: RequestType.PURCHASE_WITH_COFLCOiNS,
                data: productId,
                requestMethod: 'POST',
                requestHeader: {
                    GoogleToken: data.userId
                },
                resolve: function () {
                    resolve()
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.PURCHASE_WITH_COFLCOiNS, error, data)
                    reject()
                }
            })
        })
    }

    let subscribeCoflCoinChange = () => {

        // TODO: Has yet to be implemented by the backend
        return;

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
            websocketHelper.sendRequest({
                type: RequestType.GET_REF_INFO,
                data: '',
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
            websocketHelper.sendRequest({
                type: RequestType.SET_REF,
                data: refId,
                resolve: () => {
                    resolve()
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_REF, error, '')
                    reject(error)
                }
            })
        })
    }

    let getActiveAuctions = (item: Item, order: number, filter?: ItemFilter): Promise<RecentAuction[]> => {
        return new Promise((resolve, reject) => {
            if (!filter || Object.keys(filter).length === 0) {
                filter = undefined
            }

            let requestData = {
                name: item.tag,
                filter: filter,
                order: isNaN(order) ? undefined : order
            }

            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.ACTIVE_AUCTIONS,
                    data: requestData,
                    resolve: function (data) {
                        resolve(data.map(a => parseRecentAuction(a)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.ACTIVE_AUCTIONS, error, requestData)
                        reject()
                    }
                },
                1
            )
        })
    }

    let filterFor = (item: Item): Promise<FilterOptions[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.FILTER_FOR,
                    data: item.tag,
                    resolve: function (data) {
                        resolve(data.map(a => parseFilterOption(a)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.FILTER_FOR, error, item.tag)
                        reject()
                    }
                },
                1
            )
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
            httpApi.sendLimitedCacheApiRequest(
                {
                    type: RequestType.FLIP_UPDATE_TIME,
                    data: '',
                    resolve: function (data) {
                        resolve(new Date(data))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.FLIP_UPDATE_TIME, error, '')
                    }
                },
                1
            )
        })
    }
    let playerSearch = (playerName: string): Promise<Player[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendApiRequest({
                type: RequestType.PLAYER_SEARCH,
                data: playerName,
                resolve: function (players) {
                    resolve(players.map(parsePlayer))
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
            httpApi.sendLimitedCacheApiRequest(
                {
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
                },
                1
            )
        })
    }

    let sendFeedback = (feedbackKey: string, feedback: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            let googleId = localStorage.getItem('googleId')
            let user
            if (googleId) {
                let parts = googleId.split('.')
                if (parts.length > 2) {
                    let obj = JSON.parse(Base64.atob(parts[1]))
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
                    playerId && profileId
                        ? getProperty('apiEndpoint') + '/' + RequestType.GET_PROFITABLE_CRAFTS + `?profile=${profileId}&player=${playerId}`
                        : undefined,
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
                customRequestURL: getProperty('apiEndpoint') + '/player/' + playerUUID + '/name',
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

    let flipFilters = (item: Item): Promise<FilterOptions[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest(
                {
                    type: RequestType.FLIP_FILTERS,
                    data: item.tag,
                    resolve: function (data) {
                        resolve(data.map(a => parseFilterOption(a)))
                    },
                    reject: function (error) {
                        apiErrorHandler(RequestType.FLIP_FILTERS, error, item.tag)
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
                customRequestURL: `${getProperty('apiEndpoint')}/${RequestType.ITEM_PRICE_SUMMARY}/${itemTag}?${getParams}`,
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
        hasPremium,
        stripePurchase,
        setToken,
        getRecentAuctions,
        getFlips,
        subscribeFlips,
        getFilter,
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
        filterFor,
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
        getKatFlips,
        getTrackedFlipsForPlayer
    }
}

let api = initAPI()

export default api
