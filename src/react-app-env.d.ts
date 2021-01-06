/// <reference types="react-scripts" />

interface Player {
    name: string,
    uuid: string,
    iconUrl?: string
}

interface Enchantment {
    id: number,
    name?: string,
    level?: number
}

interface Reforge {
    id: number,
    name: string
}

interface Item {
    tag: string,
    tier?: string,
    name?: string,
    category?: string,
    iconUrl?: string,
    description?: string
}

interface ItemPrice {
    item: Item,
    end: Date,
    price: number
}

interface AuctionDetails {
    auction: Auction
    claimed: boolean,
    count: number,
    start: Date,
    auctioneer: Player,
    profileId: string,
    coop: string[],
    bids: ItemBid[],
    anvilUses: number,
    reforge: Reforge
    enchantments: Enchantment[]
}

interface Auction {
    uuid: string,
    highestBid: number,
    startingBid: number,
    item: Item,
    end: Date
}

interface ItemBid {
    auctionId: string,
    bidder: Player,
    amount: number,
    timestamp: Date,
    profileId?: string
}

interface BidForList {
    uuid: string,
    highestOwn: number,
    highestBid: number,
    item: Item,
    end: date
}

interface PlayerDetails {
    bids: ItemBid[],
    auctions: Auction[]
}

interface EnchantmentFilter {
    enchantment?: Enchantment,
    level?: number
}

interface ItemPriceData {
    end: Date,
    price: number
}

interface SearchResultItem {
    dataItem: Player | Item,
    type: string,
    route: string,
    id: string
}

interface API {
    search(searchText: string): Promise<SearchResultItem[]>,
    trackSearch(fullSearchId: string, fullSearchType: string): void,
    getItemImageUrl(item: Item): Promise<string>,
    getItemDetails(itemTagOrName: string): Promise<Item>,
    getItemPrices(itemTagOrName: string, fetchStart: number, reforge?: Reforge, enchantmentFilter?: EnchantmentFilter): Promise<ItemPriceData[]>,
    getPlayerDetails(playerUUID: string): Promise<PlayerDetails>,
    getAuctions(uuid: string, amount: number, offset: number): Promise<Auction[]>,
    getBids(uuid: string, amount: number, offset: number): Promise<BidForList[]>,
    getEnchantments(): Promise<Enchantment[]>,
    getAuctionDetails(auctionUUID: string): Promise<AuctionDetails>,
    getPlayerName(uuid: string): Promise<string>,
    hasPremium(googleId: string): Promise<Date>
}


interface CacheUtils {
    getFromCache(type: string, data: string): Promise<ApiResponse | null>,
    setIntoCache(type: string, data: string, response: ApiResponse, maxAge: number = 0): void
}

interface ApiResponse {
    type: string,
    data: string,
    mId?: number,
    maxAge?: number
}