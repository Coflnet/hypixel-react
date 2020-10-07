/// <reference types="react-scripts" />

interface SearchResponse {
    data: Array<string>
}

interface Player {
    name: string,
    uuid: string,
    iconUrl?: string
}

interface Enchantment {
    id: number,
    name: string
}

interface Reforge {
    id: number,
    name: string
}

interface Item {
    name: string,
    tier?: string,
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

interface ItemBids {
    highestOwn: number,
    highestBid: number,
    item: Item,
    auctionUUID: number,
    end: date
}

interface PlayerDetails {
    bids: ItemBids[],
    auctions: Auction[]
}

interface EnchantmentFilter {
    enchantment: Enchantment,
    level: number
}

interface ItemPriceData {
    end: Date,
    price: number
}

interface API {
    websocket: WebSocket,
    search(searchText: string): Promise<Player[]>,
    getItemDetails(itemName: string): Promise<Item>
    getItemPrices(itemName: string, fetchStart: Date, reforge?: Reforge, enchantmentFilter?: EnchantmentFilter): Promise<ItemPriceData[]>
}
