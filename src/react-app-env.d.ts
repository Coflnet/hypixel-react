/// <reference types="react-scripts" />

interface Player {
  name: string;
  uuid: string;
  iconUrl?: string;
}

interface Enchantment {
  id: number;
  name?: string;
  level?: number;
  color?: string;
}

interface Reforge {
  id: number;
  name?: string;
}

interface Item {
  tag: string;
  tier?: string;
  name?: string;
  category?: string;
  iconUrl?: string;
  description?: string;
  bazaar?: boolean;
}

interface ItemPrice {
  item: Item;
  end: Date;
  price: number;
}

interface AuctionDetails {
  auction: Auction;
  claimed: boolean;
  count: number;
  start: Date;
  auctioneer: Player;
  profileId: string;
  coop: string[];
  bids: ItemBid[];
  anvilUses: number;
  reforge: Reforge;
  enchantments: Enchantment[];
  nbtData: any;
  itemCreatedAt: Date;
}

interface Auction {
  uuid: string;
  highestBid: number;
  startingBid: number;
  item: Item;
  end: Date;
  bin: boolean;
}

interface RecentAuction {
  end: Date,
  price: number,
  seller: Player,
  uuid: string,
  playerName: string
}

interface ItemBid {
  auctionId: string;
  bidder: Player;
  amount: number;
  timestamp: Date;
  profileId?: string;
  bin: boolean;
}

interface BidForList {
  uuid: string;
  highestOwn: number;
  highestBid: number;
  item: Item;
  end: date;
  bin: boolean;
}

interface PlayerDetails {
  bids: ItemBid[];
  auctions: Auction[];
}

interface ItemFilter {
  [key: string]: string,
  _hide?: boolean,
  _label?: string
}

interface FilterOptions {
  name: string,
  options: string[],
  type: FilterType
}

interface ItemPrice {
  min: number;
  max: number;
  avg: number;
  volume: number;
  time: Date;
}

interface ItemPriceData {
  filterable: boolean;
  prices: Array<ItemPrice>;
  filters: Array<string>;
}

interface SearchResultItem {
  dataItem: {
    iconUrl: string,
    name: string
  },
  type: string;
  route: string;
  getParams?: string;
  id: string;
}

interface FlipAuction {
  uuid: string,
  median: number,
  cost: number,

  volume: number,
  showLink: boolean,
  item: Item,
  bin: boolean,
  sold?: boolean,
  sellerName: string,
  lowestBin: number,
  secondLowestBin: number,
  isCopied?: boolean,
  props?: string[]
}

interface FlipperFilter {
  onlyBin?: boolean,
  minProfit?: number,
  minProfitPercent?: number,
  minVolume?: number,
  maxCost?: number,
  onlyUnsold?: boolean,
  restrictions?: FlipRestriction[]
}

interface API {
  search(searchText: string): Promise<SearchResultItem[]>;
  trackSearch(fullSearchId: string, fullSearchType: string): void;
  getItemImageUrl(item: Item): string;
  getItemDetails(itemTagOrName: string): Promise<Item>;
  getItemPrices(
    itemTagOrName: string,
    fetchStart: number,
    itemFilter?: ItemFilter
  ): Promise<ItemPriceData>;
  getAuctions(uuid: string, amount: number, offset: number): Promise<Auction[]>;
  getBids(uuid: string, amount: number, offset: number): Promise<BidForList[]>;
  getEnchantments(): Promise<Enchantment[]>;
  getReforges(): Promise<Reforge[]>;
  getAuctionDetails(auctionUUID: string, ignoreCache?: number): Promise<AuctionDetails>;
  getPlayerName(uuid: string): Promise<string>;
  setConnectionId(): Promise<void>;
  getVersion(): Promise<string>;
  subscribe(
    topic: string,
    type: SubscriptionType[],
    price?: number
  ): Promise<void>;
  unsubscribe(subscription: Subscription): Promise<Number>;
  getSubscriptions(): Promise<Subscription[]>;
  setGoogle(id: string): Promise<void>;
  hasPremium(googleId: string): Promise<Date>;
  pay(stripePromise: Promise<Stripe | null>, product: Product): Promise<void>;
  setToken(token: string): Promise<void>;
  getStripeProducts(): Promise<Product[]>;
  getStripePrices(): Promise<Price[]>;
  validatePaymentToken(
    token: string,
    productId: string,
    packageName: string = packageName
  ): Promise<boolean>;
  getRecentAuctions(itemTagOrName: string, fetchStart: number, itemFilter?: ItemFilter): Promise<RecentAuction[]>,
  getFlips(): Promise<FlipAuction[]>,
  subscribeFlips(flipCallback: Function, restrictionList: FlipRestriction[], filter: FlipperFilter, soldCallback?: Function, nextUpdateNotificationCallback?: Function): void,
  unsubscribeFlips(): Promise<void>,
  getFilter(name: string): Promise<FilterOptions>
  getNewAuctions(): Promise<Auction[]>,
  getEndedAuctions(): Promise<Auction[]>,
  getPopularSearches(): Promise<PopularSearch[]>,
  getNewItems(): Promise<Item[]>,
  getNewPlayers(): Promise<Player[]>
  getFlipBasedAuctions(flipUUID: string): Promise<Auction[]>,
  paypalPurchase(orderId: string, days: number): Promise<any>,
  getRefInfo(): Promise<RefInfo>,
  setRef(refId: string): Promise<void>,
  getActiveAuctions(item: Item, order: number, filter?: ItemFilter): Promise<RecentAuction[]>,
  filterFor(item: Item): Promise<FilterOptions[]>,
  connectMinecraftAccount(playerUUID: string): Promise<MinecraftConnectionInfo>,
  getAccountInfo(): Promise<AccountInfo>
  itemSearch(searchText: string): Promise<FilterOptions[]>
  authenticateModConnection(conId: string): Promise<void>,
  getFlipUpdateTime(): Promise<Date>,
  playerSearch(playerName: string): Promise<Player[]>,
  sendFeedback(feedbackKey: string, feedback: any): Promise<void>,
  getProfitableCrafts(): Promise<ProfitableCraft[]>,
  getLowSupplyItems(): Promise<LowSupplyItem[]>,
  sendFeedback(feedbackKey: string, feedback: any): Promise<void>,
  triggerPlayerNameCheck(playerUUID: string): Promise<void>
}

interface CacheUtils {
  getFromCache(type: string, data: string): Promise<ApiResponse | null>;
  setIntoCache(
    type: string,
    data: string,
    response: ApiResponse,
    maxAge: number = 0
  ): void;
  checkForCacheClear(): void;
  clearAll(): void
}

interface ApiResponse {
  type: string;
  data: string;
  mId?: number;
  maxAge?: number;
}

interface Product {
  itemId: string;
  title: string;
  description: string;
  price: Price;
  introductoryPrice: Price;
  paymentProviderName?: string;
  /** duration in days */
  premiumDuration?: number
}

interface Price {
  productId: string | null;
  currency: string;
  value: number;
}

interface PaymentMethod {
  supportedMethods: string;
  data: PaymentMethodDataSku;
}

interface PaymentMethodDataSku {
  sku: string;
}

interface PaymentDetails {
  total: PaymentDetailsTotal;
}

interface PaymentDetailsTotal {
  label: string;
  amount: PaymentDetailTotalAmount;
}

interface PaymentDetailTotalAmount {
  currency: string;
  value: string;
}

interface AbstractPaymentProvider {
  name: string;
  getProducts(): Promise<Product[]>;
  pay(product: Product): Promise<Product>;
  checkIfPaymentIsPossible(): boolean;
}

interface PopularSearch {
  title: string,
  url: string,
  img: string
}

interface RefInfo {
  refId: string,
  count: number,
  receivedTime: number,
  receivedHours: number,
  bougthPremium: number
}

interface FreeFlipperMissInformation {
  totalFlips: number,
  missedFlipsCount: number,
  missedEstimatedProfit: number,
  estimatedProfitCopiedAuctions: number
}

interface AccountInfo {
  email: string,
  token: string,
  mcId?: string,
  mcName?: string
}
interface FlipCustomizeSettings {
  hideCost?: boolean,
  hideLowestBin?: boolean,
  hideSecondLowestBin?: boolean,
  hideMedianPrice?: boolean,
  hideSeller?: boolean,
  hideEstimatedProfit?: boolean,
  hideVolume?: boolean,
  maxExtraInfoFields?: number,
  hideCopySuccessMessage?: boolean,
  useLowestBinForProfit?: boolean,
  disableLinks?: boolean,
  justProfit?: boolean,
  soundOnFlip?: boolean,
  shortNumbers?: boolean,
  hideProfitPercent?: boolean,
  finders?: number[],
  blockTenSecMsg?: boolean
}

interface FlipRestriction {
  type: "blacklist" | "whitelist",
  item?: Item,
  itemFilter?: ItemFilter
}

interface MinecraftConnectionInfo {
  code: number,
  isConnected: boolean
}

interface LowSupplyItem extends Item {
  supply: number,
  medianPrice: number,
  volume: number
}
interface ReloadFeedback {
  loadNewInformation: boolean,
  somethingBroke: boolean,
  otherIssue: boolean,
  additionalInformation: string
}

interface ProfitableCraft {
  item: Item,
  sellPrice: number,
  craftCost: number,
  ingredients: CraftingIngredient[],
  requiredCollection?: RequiredCollection
}

interface CraftingIngredient {
  item: Item,
  count: number,
  cost: number
}

interface RequiredCollection {
  name: string,
  level: number
}