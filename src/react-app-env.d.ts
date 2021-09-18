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
enum FilterType {
  Equal = 1,
  HIGHER = 2,
  LOWER = 4,
  DATE = 8,
  NUMERICAL = 16
}

interface ItemFilter {
  [key: string]: string
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
  dataItem: Player | Item;
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
  minVolume?: number,
  maxCost?: number,
  onlyUnsold?: boolean,
  restrictions?: FlipRestriction[]
}

interface API {
  search(searchText: string): Promise<SearchResultItem[]>;
  trackSearch(fullSearchId: string, fullSearchType: string): void;
  getItemImageUrl(item: Item): Promise<string>;
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
  subscribeFlips(flipCallback: Function, soldCallback: Function): void,
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
  itemSearch(searchText: string): Promise<FilterOptions[]>,
  authenticateModConnection(conId: number): Promise<void>
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
  totalFlipsFiltered: number,
  missedFlipsCount: number,
  missedEstimatedProfit: number,
  estimatedProfitCopiedAuctions: number
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
  useLowestBinForProfit?: boolean
}

interface FlipRestriction {
  type: "blacklist",
  item?: Item,
  itemFilter?: ItemFilter
}