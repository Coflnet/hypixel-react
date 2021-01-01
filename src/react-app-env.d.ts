/// <reference types="react-scripts" />

interface Player {
    name: string,
    uuid: string,
    iconUrl?: string
}

interface Enchantment {
    id: number,
    name?: string
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
    startingBid: number,
    start: Date,
    end: Date,
    auctioneer: Player,
    profileId: string,
    coop: string[],
    bids: number[],
    anvilUses: number,
    reforge: Reforge
    enchantments: Enchantment[]
}

interface Auction {
    uuid: string,
    highestBid: number,
    item: Item,
    end: Date
}

interface ItemBid {
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
    getBids(uuid: string, amount: number, offset: number): Promise<ItemBid[]>,
    getEnchantments(): Promise<Enchantment[]>,
    getAuctionDetails(auctionUUID: string): Promise<AuctionDetails>
}


interface CacheUtils {
    getFromCache(type: string, data: string): Promise<any>,
    setIntoCache(type: string, data: string, response:any): void
}
