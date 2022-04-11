export enum RequestType {
    SEARCH = "search",
    PLAYER_DETAIL = "playerDetails",
    ITEM_PRICES = "pricerdicer",
    AUCTION_DETAILS = "auction",
    ITEM_DETAILS = "itemDetails",
    PLAYER_AUCTION = "playerAuctions",
    PLAYER_BIDS = "playerBids",
    ALL_ENCHANTMENTS = "getEnchantments",
    ALL_REFORGES = "getReforges",
    TRACK_SEARCH = "trackSearch",
    PLAYER_NAME = "playerName",
    SET_CONNECTION_ID = "setConId",
    GET_VERSION = "version",
    SUBSCRIBE = "subscribe",
    UNSUBSCRIBE = "unsubscribe",
    GET_SUBSCRIPTIONS = "subscriptions",
    SET_GOOGLE = "setGoogle",
    PAYMENT_SESSION = "paymentSession",
    PREMIUM_EXPIRATION = 'premiumExpiration',
    FCM_TOKEN = "token",
    GET_STRIPE_PRODUCTS = "getProducts",
    GET_STRIPE_PRICES = "getPrices",
    VALIDATE_PAYMENT_TOKEN = "gPurchase",
    RECENT_AUCTIONS = "recentAuctions",
    SUBSCRIBE_FLIPS = "subFlip",
    UNSUBSCRIBE_FLIPS = "unsubFlip",
    GET_FLIPS = "getFlips",
    GET_FILTER = "getFilter",
    NEW_AUCTIONS = "newAuctions",
    NEW_PLAYERS = "newPlayers",
    NEW_ITEMS = "newItems",
    POPULAR_SEARCHES = "popularSearches",
    ENDED_AUCTIONS = "endedAuctions",
    GET_FLIP_BASED_AUCTIONS = "flipBased",
    PAYPAL_PAYMENT = "paypalPurchase",
    GET_REF_INFO = "getRefInfo",
    SET_REF = "setRef",
    ACTIVE_AUCTIONS = "activeAuctions",
    FILTER_FOR = "filterFor",
    FLIP_FILTERS = "flipFilters",
    CONNECT_MINECRAFT_ACCOUNT = "conMc",
    GET_ACCOUNT_INFO = "accountInfo",
    ITEM_SEARCH = "item/search",
    AUTHENTICATE_MOD_CONNECTION = "authCon",
    FLIP_UPDATE_TIME = "flip/update/when",
    PLAYER_SEARCH = "search/player",
    GET_PROFITABLE_CRAFTS = "craft/profit",
    GET_LOW_SUPPLY_ITEMS = "auctions/supply/low",
    SEND_FEEDBACK = "sendFeedback",
    TRIGGER_PLAYER_NAME_CHECK = "triggerNameCheck",
    GET_PLAYER_PROFILES = "profile",
    GET_CRAFTING_RECIPE = "craft/recipe",
    GET_LOWEST_BIN = "lowestBin",
    GET_BAZAAR_TAGS = "items/bazaar/tags",
    ITEM_PRICE_SUMMARY = "item/price",
    GET_KAT_FLIPS = "kat/profit",
    GET_TRACKED_FLIPS_FOR_PLAYER = "flip/stats/player"
}

export enum SubscriptionType {
    NONE = 0,
    PRICE_LOWER_THAN = 1,
    PRICE_HIGHER_THAN = 2,
    OUTBID = 4,
    SOLD = 8,
    BIN = 16,
    USE_SELL_NOT_BUY = 32,
    AUCTION = 64
}

export interface ApiRequest {
    mId?: number,
    type: RequestType,
    data: any,
    resolve: Function,
    reject: Function,
    customRequestURL?: string,
    requestMethod?: string,
    requestHeader?: any
}

export interface ApiSubscription {
    mId?: number,
    type: RequestType,
    data: any,
    callback(request: ApiResponse)
}

export interface Subscription {
    topicId: string,
    price: number,
    types: SubscriptionType[],
    type: string,
    title?: string,
    filter?: ItemFilter
}

export interface Connection {
    sendRequest(request: ApiRequest): void
}

export interface WebsocketHelper extends Connection {
    subscribe(subscription: ApiSubscription): void,
    removeOldSubscriptionByType(type: RequestType): void
}

export interface HttpApi extends Connection {
    sendApiRequest(request: ApiRequest, body?: any): Promise<void>,
    sendLimitedCacheApiRequest(request: ApiRequest, grouping: number),
    sendLimitedCacheApiRequest(request: ApiRequest),
    sendLimitedCacheRequest(request: ApiRequest, grouping: number),
    sendLimitedCacheRequest(request: ApiRequest),
}