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
  uuid: string
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
  enchantment?: Enchantment;
  reforge?: Reforge;
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
}

interface SearchResultItem {
  dataItem: Player | Item;
  type: string;
  route: string;
  id: string;
}

interface FlipAuction {
  uuid: string,
  median: number,
  cost: number,
  name: string,
  volume: number
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
  getPlayerDetails(playerUUID: string): Promise<PlayerDetails>;
  getAuctions(uuid: string, amount: number, offset: number): Promise<Auction[]>;
  getBids(uuid: string, amount: number, offset: number): Promise<BidForList[]>;
  getEnchantments(): Promise<Enchantment[]>;
  getReforges(): Promise<Reforge[]>;
  getAuctionDetails(auctionUUID: string): Promise<AuctionDetails>;
  getPlayerName(uuid: string): Promise<string>;
  setConnectionId(): void;
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
  subscribeFlips(callback: Function): void
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
  getProducts(): Promise<Product[]>;
  pay(product: Product): Promise<Product>;
  checkIfPaymentIsPossible(): boolean;
}
