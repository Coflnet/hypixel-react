export enum RequestType {
    SEARCH = "fullSearch",
    PLAYER_DETAIL = "playerDetails",
    ITEM_PRICES = "pricerdicer",
    AUCTION_DETAILS = "auctionDetails",
    ITEM_DETAILS = "itemDetails",
    PLAYER_AUCTION = "playerAuctions",
    PLAYER_BIDS = "playerBids",
    ALL_ENCHANTMENTS = "getAllEnchantments",
    TRACK_SEARCH = "trackSearch",
    PLAYER_NAME = "playerName",
    SET_CONNECTION_ID = "setConId",
    GET_VERSION = "version",
    PAYMENT_SESSION = "paymentSession",
    PREMIUM_EXPIRATION = 'premiumExpiration'
}

export interface ApiRequest {
    mId?: number,
    type: RequestType,
    data: any,
    resolve: Function,
    reject: Function
}

export interface WebsocketHelper {
    sendRequest(request: ApiRequest): void,
    init(): void
}