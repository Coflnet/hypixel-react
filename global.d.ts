// declaration.d.ts
declare module '*.scss'

interface Player {
    name: string
    uuid: string
    iconUrl?: string
}

interface Enchantment {
    id: number
    name?: string
    level?: number
    color?: string
}

interface Reforge {
    id: number
    name?: string
}

interface Item {
    tag: string
    tier?: string
    name?: string
    category?: string
    iconUrl?: string
    bazaar?: boolean
}

interface ItemPrice {
    item: Item
    end: Date
    price: number
}

interface AuctionDetails {
    auction: Auction
    claimed: boolean
    count: number
    start: Date
    auctioneer: Player
    profileId: string
    coop: string[]
    bids: ItemBid[]
    anvilUses: number
    reforge: Reforge
    enchantments: Enchantment[]
    nbtData: any
    itemCreatedAt: Date
}

interface Auction {
    uuid: string
    highestBid: number
    startingBid: number
    item: Item
    end: Date
    bin: boolean
}

interface RecentAuction {
    end: Date
    price: number
    seller: Player
    uuid: string
    playerName: string
}

interface ItemBid {
    auctionId: string
    bidder: Player
    amount: number
    timestamp: Date
    profileId?: string
    bin: boolean
}

interface BidForList {
    uuid: string
    highestOwn: number
    highestBid: number
    item: Item
    end: Date
    bin: boolean
}

interface PlayerDetails {
    bids: ItemBid[]
    auctions: Auction[]
}

interface ItemFilter {
    [key: string]: string
    _hide?: boolean
    _label?: string
}

interface FilterOptions {
    name: string
    options: string[]
    type: FilterType
}

interface ItemPrice {
    min: number
    max: number
    avg: number
    volume: number
    time: Date
}

interface SearchResultItem {
    dataItem: {
        iconUrl: string
        name: string
    }
    type: string
    route: string
    urlSearchParams?: URLSearchParams
    id: string
    isPreviousSearch?: boolean
}

interface FlipAuction {
    uuid: string
    median: number
    cost: number
    volume: number
    showLink: boolean
    item: Item
    bin: boolean
    sold?: boolean
    sellerName: string
    lowestBin: number
    secondLowestBin: number
    isCopied?: boolean
    props?: string[]
    finder: number
}

interface FlipperFilter {
    onlyBin?: boolean
    minProfit?: number
    minProfitPercent?: number
    minVolume?: number
    maxCost?: number
    onlyUnsold?: boolean
}

interface API {
    search(searchText: string): Promise<SearchResultItem[]>
    trackSearch(fullSearchId: string, fullSearchType: string): void
    getItemImageUrl(item: Item): string
    getItemDetails(itemTag: string): Promise<Item>
    getItemPrices(itemTagOrName: string, fetchSpan: DateRange, itemFilter?: ItemFilter): Promise<ItemPrice[]>
    getAuctions(uuid: string, amount: number, offset: number): Promise<Auction[]>
    getBids(uuid: string, amount: number, offset: number): Promise<BidForList[]>
    getEnchantments(): Promise<Enchantment[]>
    getReforges(): Promise<Reforge[]>
    getAuctionDetails(auctionUUID: string): Promise<AuctionDetails>
    getPlayerName(uuid: string): Promise<string>
    setConnectionId(): Promise<void>
    getVersion(): Promise<string>
    subscribe(topic: string, type: SubscriptionType[], price?: number, itemFilter?: ItemFilter): Promise<void>
    unsubscribe(subscription: Subscription): Promise<Number>
    getSubscriptions(): Promise<Subscription[]>
    setGoogle(id: string): Promise<void>
    hasPremium(googleId: string): Promise<Date>
    stripePurchase(productId: string, coinAmount?: number): Promise<PaymentResponse>
    setToken(token: string): Promise<void>
    setToken(token: string): Promise<void>
    getRecentAuctions(itemTag: string, itemFilter: ItemFilter): Promise<RecentAuction[]>
    getFlips(): Promise<FlipAuction[]>
    subscribeFlips(
        restrictionList: FlipRestriction[],
        filter: FlipperFilter,
        flipSettings: FlipCustomizeSettings,
        flipCallback?: Function,
        soldCallback?: Function,
        nextUpdateNotificationCallback?: Function,
        onSubscribeSuccessCallback?: Function,
        forceSettingsUpdate: boolean = false
    ): void
    subscribeFlipsAnonym(
        restrictionList: FlipRestriction[],
        filter: FlipperFilter,
        flipSettings: FlipCustomizeSettings,
        flipCallback?: Function,
        soldCallback?: Function,
        nextUpdateNotificationCallback?: Function,
        onSubscribeSuccessCallback?: Function
    ): void
    unsubscribeFlips(): Promise<void>
    getFilter(name: string): Promise<FilterOptions>
    getNewAuctions(): Promise<Auction[]>
    getEndedAuctions(): Promise<Auction[]>
    getPopularSearches(): Promise<PopularSearch[]>
    getNewItems(): Promise<Item[]>
    getNewPlayers(): Promise<Player[]>
    getFlipBasedAuctions(flipUUID: string): Promise<Auction[]>
    paypalPurchase(productId: string, coinAmount?: number): Promise<PaymentResponse>
    getRefInfo(): Promise<RefInfo>
    setRef(refId: string): Promise<void>
    getActiveAuctions(item: Item, order: number, filter?: ItemFilter): Promise<RecentAuction[]>
    filterFor(item: Item): Promise<FilterOptions[]>
    connectMinecraftAccount(playerUUID: string): Promise<MinecraftConnectionInfo>
    getAccountInfo(): Promise<AccountInfo>
    itemSearch(searchText: string): Promise<FilterOptions[]>
    authenticateModConnection(conId: string): Promise<void>
    getFlipUpdateTime(): Promise<Date>
    playerSearch(playerName: string): Promise<Player[]>
    sendFeedback(feedbackKey: string, feedback: any): Promise<void>
    getProfitableCrafts(playerId?: string, profileId?: string): Promise<ProfitableCraft[]>
    getLowSupplyItems(): Promise<LowSupplyItem[]>
    sendFeedback(feedbackKey: string, feedback: any): Promise<void>
    triggerPlayerNameCheck(playerUUID: string): Promise<void>
    getPlayerProfiles(playerUUID): Promise<SkyblockProfile[]>
    getCraftingRecipe(itemTag: string): Promise<CraftingRecipe>
    getLowestBin(itemTag: string): Promise<LowestBin>
    flipFilters(item: Item): Promise<FilterOptions[]>
    getBazaarTags(): Promise<string[]>
    getPreloadFlips(): Promise<FlipAuction[]>
    getItemPriceSummary(itemTag: string, filter: ItemFilter): Promise<ItemPriceSummary>
    purchaseWithCoflcoins(productId: string, count?: number): Promise<void>
    subscribeCoflCoinChange()
    getCoflcoinBalance(): Promise<number>
    setFlipSetting(identifier: string, value: any): Promise<void>
    getKatFlips(): Promise<KatFlip[]>
    getTrackedFlipsForPlayer(playerUUID: string): Promise<FlipTrackingResponse>
    transferCoflCoins(email: string, mcId: string, amount: number, reference: string): Promise<void>
    getBazaarSnapshot(itemTag: string, timestamp?: string | number | Date): Promise<BazaarSnapshot>
    getBazaarPrices(itemTag: string, fetchSpan: DateRange): Promise<BazaarPrice[]>
    getBazaarPricesByRange(itemTag: string, startDate: Date | string | number, endDate: Date | string | number): Promise<BazaarPrice[]>
}

interface CacheUtils {
    getFromCache(type: string, data: string): Promise<ApiResponse | null>
    setIntoCache(type: string, data: string, response: ApiResponse, maxAge: number = 0): void
    checkForCacheClear(): void
    clearAll(): void
}

interface ApiResponse {
    type: string
    data: any
    mId?: number
    maxAge?: number
}

interface Product {
    productId: string
    title: string
    description: string
    cost: number
    ownershipSeconds?: number
}

interface PopularSearch {
    title: string
    url: string
    img: string
}

interface RefInfo {
    oldInfo: {
        refId: string
        count: number
        receivedTime: number
        receivedHours: number
        bougthPremium: number
    }
    purchasedCoins: number
    referedCount: number
    referredBy?: string
    validatedMinecraft: number
}

interface FreeFlipperMissInformation {
    totalFlips: number
    missedFlipsCount: number
    missedEstimatedProfit: number
    estimatedProfitCopiedAuctions: number
}

interface AccountInfo {
    email: string
    token: string
    mcId?: string
    mcName?: string
}
interface FlipCustomizeSettings {
    hideCost?: boolean
    hideLowestBin?: boolean
    hideSecondLowestBin?: boolean
    hideMedianPrice?: boolean
    hideSeller?: boolean
    hideEstimatedProfit?: boolean
    hideVolume?: boolean
    maxExtraInfoFields?: number
    hideCopySuccessMessage?: boolean
    useLowestBinForProfit?: boolean
    disableLinks?: boolean
    justProfit?: boolean
    soundOnFlip?: boolean
    shortNumbers?: boolean
    hideProfitPercent?: boolean
    finders?: number[]
    blockTenSecMsg?: boolean
    hideModChat?: boolean
    hideSellerOpenBtn?: boolean
    hideLore?: boolean
    modFormat?: string
    modCountdown?: boolean
}

interface FlipRestriction {
    type: 'blacklist' | 'whitelist'
    item?: Item
    itemFilter?: ItemFilter
}

interface MinecraftConnectionInfo {
    code: number
    isConnected: boolean
}

interface LowSupplyItem extends Item {
    supply: number
    medianPrice: number
    volume: number
}
interface ReloadFeedback {
    loadNewInformation: boolean
    somethingBroke: boolean
    otherIssue: boolean
    additionalInformation: string
}

interface ProfitableCraft {
    item: Item
    sellPrice: number
    craftCost: number
    ingredients: CraftingIngredient[]
    volume: number
    median: number
    requiredCollection?: CraftRequirement
    requiredSlayer?: CraftRequirement
}

interface CraftingIngredient {
    item: Item
    count: number
    cost: number
}

interface CraftRequirement {
    name: string
    level: number
}

interface SkyblockProfile {
    cuteName: string
    current: boolean
    id: string
}
interface CraftingRecipe {
    A1: string
    A2: string
    A3: string
    B1: string
    B2: string
    B3: string
    C1: string
    C2: string
    C3: string
}

interface LowestBin {
    lowest: number
    secondLowest: number
}

interface GoogleProfileInfo {
    name?: string
    email?: string
    imageUrl?: string
}

interface ItemPriceSummary {
    min: number
    median: number
    mean: number
    mode: number
    volume: number
    max: number
}

interface PaymentResponse {
    id: string
    directLink: string
}
interface KatFlipCoreData {
    hours: number
    material?: string
    amount: number
    item: Item
}

interface KatFlip {
    volume: number
    median: number
    upgradeCost: number
    materialCost: number
    originAuctionUUID: string
    coreData: KatFlipCoreData
    targetRarity: string
    profit: number
    referenceAuctionUUID: string
    purchaseCost: number
    cost: number
}
interface FlipTrackingFlip {
    pricePaid: number
    soldFor: number
    uId: number
    originAuction: string
    soldAuction: string
    finder: FlipFinder
    item: Item
    sellTime: Date
    profit: number
}

interface FlipTrackingResponse {
    flips: FlipTrackingFlip[]
    totalProfit: number
}

interface BazaarOrder {
    amount: number
    pricePerUnit: number
    orders: number
}

interface BazaarPriceData {
    max: number
    min: number
    price: number
    volume: number
    moving: number
}

interface BazaarPrice {
    buyData: BazaarPriceData
    sellData: BazaarPriceData
    timestamp: Date
}

interface BazaarSnapshotData {
    orderCount: number
    price: number
    volume: number
    moving: number
}

interface BazaarSnapshot {
    item: Item
    buyData: BazaarSnapshotData
    sellData: BazaarSnapshotData
    timeStamp: Date
    buyOrders: BazaarOrder[]
    sellOrders: BazaarOrder[]
}

enum DateRange {
    ACTIVE = 'active',
    DAY = 'day',
    MONTH = 'month',
    WEEK = 'week',
    ALL = 'ALL'
}
