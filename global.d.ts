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
    reforge: string
    enchantments: Enchantment[]
    nbtData: any
    itemCreatedAt: Date
    start: Date
    uuid: string
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
    _sellerName?: string
}

interface FilterOptions {
    name: string
    options: string[]
    type: FilterType
    description: string | null
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
        _imageLoaded?: boolean
    }
    type: string
    route: string
    urlSearchParams?: URLSearchParams
    id: string
    isPreviousSearch?: boolean
    tier: string
}

interface FlipAuction {
    uuid: string
    median: number
    profit: number
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
    getAuctions(uuid: string, page: number = 0, itemFilter?: ItemFilter): Promise<Auction[]>
    getBids(uuid: string, page: number = 0, itemFilter?: ItemFilter): Promise<BidForList[]>
    getEnchantments(): Promise<Enchantment[]>
    getAuctionDetails(auctionUUID: string): Promise<{ parsed: AuctionDetails; original: any }>
    getPlayerName(uuid: string): Promise<string>
    setConnectionId(): Promise<void>
    getVersion(): Promise<string>
    subscribe(topic: string, type: SubscriptionType[], targets: NotificationTarget[], price?: number, itemFilter?: ItemFilter): Promise<void>
    unsubscribe(subscription: Subscription): Promise<void>
    getNotificationListener(): Promise<NotificationListener[]>
    loginWithToken(id: string): Promise<string>
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
        onErrorCallback?: Function,
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
    getFilters(tag: string): Promise<FilterOptions[]>
    getNewAuctions(): Promise<Auction[]>
    getEndedAuctions(): Promise<Auction[]>
    getPopularSearches(): Promise<PopularSearch[]>
    getNewItems(): Promise<Item[]>
    getNewPlayers(): Promise<Player[]>
    getFlipBasedAuctions(flipUUID: string): Promise<Auction[]>
    paypalPurchase(productId: string, coinAmount?: number): Promise<PaymentResponse>
    getRefInfo(): Promise<RefInfo>
    setRef(refId: string): Promise<void>
    getActiveAuctions(item: Item, order: string, filter?: ItemFilter): Promise<RecentAuction[]>
    connectMinecraftAccount(playerUUID: string): Promise<MinecraftConnectionInfo>
    getAccountInfo(): Promise<AccountInfo>
    itemSearch(searchText: string): Promise<SearchResultItem[]>
    authenticateModConnection(conId: string, googleToken: string): Promise<void>
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
    flipFilters(tag: string): Promise<FilterOptions[]>
    getBazaarTags(): Promise<string[]>
    getPreloadFlips(): Promise<FlipAuction[]>
    getItemPriceSummary(itemTag: string, filter: ItemFilter): Promise<ItemPriceSummary>
    purchaseWithCoflcoins(productId: string, googleToken: string, count?: number): Promise<void>
    subscribeCoflCoinChange()
    getCoflcoinBalance(): Promise<number>
    setFlipSetting(identifier: string, value: any): Promise<void>
    getKatFlips(): Promise<KatFlip[]>
    getTrackedFlipsForPlayer(playerUUID: string, from?: Date, to?: Date): Promise<FlipTrackingResponse>
    transferCoflCoins(email: string | undefined, mcId: string | undefined, amount: number, reference: string): Promise<void>
    getBazaarSnapshot(itemTag: string, timestamp?: string | number | Date): Promise<BazaarSnapshot>
    getBazaarPrices(itemTag: string, fetchSpan: DateRange): Promise<BazaarPrice[]>
    getBazaarPricesByRange(itemTag: string, startDate: Date | string | number, endDate: Date | string | number): Promise<BazaarPrice[]>
    getPrivacySettings(): Promise<PrivacySettings>
    setPrivacySettings(settings: PrivacySettings): Promise<void>
    checkRat(hash: string): Promise<RatCheckingResponse>
    getPremiumProducts(): Promise<PremiumProduct[]>
    unsubscribeAll(): Promise<void>
    getItemNames(items: Item[]): Promise<{ [key: string]: string }>
    checkFilter(auction: AuctionDetails, filter: ItemFilter): Promise<boolean>
    refreshLoadPremiumProducts(callback: (products: PremiumProduct[]) => void)
    getRelatedItems(tag: string): Promise<Item[]>
    getOwnerHistory(uid: string): Promise<OwnerHistory[]>
    getMayorData(start: Date, end: Date): Promise<MayorData[]>
    lemonsqueezyPurchase(productId: string, coinAmount?: number): Promise<PaymentResponse>
    getPlayerInventory(): Promise<InventoryData[]>
    createTradeOffer(playerUUID: string, offer: InventoryData, wantedItems: WantedItem[], offeredCoins: number): Promise<void>
    getTradeOffers(onlyOwn: boolean, filter?: ItemFilter): Promise<TradeObject[]>
    deleteTradeOffer(tradeId: string): Promise<void>
    getTransactions(): Promise<Transaction[]>
    getPlayerNames(uuids: string[]): Promise<{ [key: string]: string }>
    getNotificationTargets(): Promise<NotificationTarget[]>
    addNotificationTarget(target: NotificationTarget): Promise<NotificationTarget>
    deleteNotificationTarget(target: NotificationTarget): Promise<void>
    updateNotificationTarget(target: NotificationTarget): Promise<void>
    sendTestNotification(target: NotificationTarget): Promise<void>
    getNotificationSubscriptions(): Promise<NotificationSubscription[]>
    createNotificationSubscription(subscription: NotificationSubscription): Promise<NotificationSubscription>
    deleteNotificationSubscription(subscription: NotificationSubscription): Promise<void>
    getPublishedConfigs(): Promise<string[]>
    updateConfig(configName: string, updateNotes: string = ''): Promise<void>
    requestArchivedAuctions(itemTag: string, itemFilter?: ItemFilter): Promise<ArchivedAuctionResponse>
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
    blockExport?: boolean
}

interface FlipRestriction {
    type: 'blacklist' | 'whitelist'
    item?: Item
    itemFilter?: ItemFilter
    isEdited?: boolean
    originalIndex?: number
    tags?: string[]
    order?: number
    itemKey?: string
    disabled?: boolean
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
    type?: 'craft'
    ingredients?: CraftingIngredient[]
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
    A1: CraftingRecipeSlot | undefined
    A2: CraftingRecipeSlot | undefined
    A3: CraftingRecipeSlot | undefined
    B1: CraftingRecipeSlot | undefined
    B2: CraftingRecipeSlot | undefined
    B3: CraftingRecipeSlot | undefined
    C1: CraftingRecipeSlot | undefined
    C2: CraftingRecipeSlot | undefined
    C3: CraftingRecipeSlot | undefined
}

interface CraftingRecipeSlot {
    tag: string
    count: number
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
    originAuctionName: string
}

interface FlipTrackingPropertyChange {
    description: string
    effect: number
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
    buyTime: Date
    profit: number
    propertyChanges: FlipTrackingPropertyChange[]
    flags: Set
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

interface PrivacySettings {
    chatRegex: 'string'
    collectChat: boolean
    collectInventory: boolean
    collectTab: boolean
    collectScoreboard: boolean
    allowProxy: boolean
    collectInvClick: boolean
    collectChatClicks: boolean
    collectLobbyChanges: boolean
    collectEntities: boolean
    extendDescriptions: boolean
    commandPrefixes: string[]
    autoStart: boolean
}

interface PremiumProduct {
    expires: Date
    productSlug: string
}

interface PremiumTypeOption {
    value: number
    label: string
    productId: string
    price: number
}

interface PremiumType {
    productId: string
    label: string
    durationString: string
    priority: PREMIUM_RANK
    options: PremiumTypeOption[]
}

interface RatCheckingResponse {
    rat: string
    md5return: string
}

interface OwnerHistory {
    seller: Player
    uuid: string
    buyer: Player
    timestamp: Date | null
    highestBid: number
    itemTag: string
}

interface Perk {
    description: string
    name: string
}

interface Mayor {
    key: string
    name: string
    perks: Perk[]
}

interface MayorData {
    start: Date
    end: Date
    winner: Mayor
    year: number
}

interface InventoryData {
    id: number
    itemName: string
    tag: string
    icon: string
    extraAttributes: { [key: string]: string }
    enchantments: { [key: string]: string }
    color: number
    description: string
    count: number
}

interface TradeObject {
    id: string
    playerUuid: string
    playerName: string
    buyerUuid: string
    item: InventoryData
    wantedItems: WantedItem[]
    wantedCoins: number
    timestamp: Date
    coins: number
}

interface WantedItem {
    tag: string
    itemName: string
    filters: ItemFilter | undefined
}

interface Transaction {
    productId: string
    reference: string
    amount: number
    timeStamp: Date
}

type NotificationType = 'WEBHOOK' | 'DISCORD' | 'DiscordWebhook' | 'FIREBASE' | 'EMAIL' | 'InGame' | 'DiscordWebhook'

type NotificationWhen = 'NEVER' | 'AfterFail' | 'ALWAYS'

interface NotificationTarget {
    id: number | undefined
    type: NotificaitonType | number
    when: NotificationWhen | number
    target: string | null
    name: string | null
    useCount: number
}

interface NotificationSubscription {
    sourceType: string
    id: number | undefined
    sourceSubIdRegex: string
    targets: {
        id: number
        name: string
        priority: number
        isDisabled: boolean
    }[]
}

interface ArchivedAuction {
    seller: Player
    price: number
    end: Date
    uuid: string
}

interface ArchivedAuctionResponse {
    auctions: ArchivedAuction[]
    queryStatus: string
}
