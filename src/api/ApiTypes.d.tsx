export enum RequestType {
    SEARCH = "fullSearch",
    PLAYER_DETAIL = "playerDetails",
    ITEM_PRICES = "pricerdicer",
    AUCTION_DETAILS = "auctionDetails",
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
    GET_STRIPE_PRICES = "getPrices"
}

export enum SubscriptionType {
    NONE = 0,
    PRICE_LOWER_THAN = 1,
    PRICE_HIGHER_THAN = 2,
    OUTBID = 4,
    SOLD = 8,
    BIN = 16,
    USE_SELL_NOT_BUY = 32
}

export interface ApiRequest {
    mId?: number,
    type: RequestType,
    data: any,
    resolve: Function,
    reject: Function
}

export interface Subscription {
    topicId: string,
    price: number,
    types: SubscriptionType[],
    type: string
}

export interface WebsocketHelper {
    sendRequest(request: ApiRequest): void,
    init(): void
}