import type { AveragePrice } from '../api/_generated/skyApi.schemas'
import {
    buildComponentEmbed,
    escapeMarkdown,
    getTierAccentColor,
    statLine,
    type DiscordEmbedPayload,
    type EmbedButton,
    type EmbedLine
} from './DiscordComponentEmbed'
import {
    cleanName,
    formatRarity,
    formatShortCoins,
    formatSignedShortCoins,
    getAuctionItemStats,
    getAuctionPriceText,
    getBazaarItemStats,
    getBestFlip,
    getDisplayFilterEntries,
    getFlipProfitPercent,
    getHeldDuration,
    getPlayerAuctionStats,
    getPlayerHeadRenderUrl,
    getProfitByFinder,
    getRangeLabel,
    isAuctionEnded
} from './EmbedUtils'
import { numberWithThousandsSeparators } from './Formatter'
import { getArchiveCanonicalUrl, getCanonicalUrl } from './SSRUtils'

/*
 Discord component embeds (see DiscordComponentEmbed.ts) of the pages with stats.
 Like the og:description builders in EmbedUtils they leave out end times and dates, because Discord caches an embed for long.
 A line or button is only added when its data exists.
*/

type MaybeButton = EmbedButton | false | null | undefined

const MAX_FINDERS = 3

interface EmbedPlayer {
    uuid: string
    name: string
}

const segment = (value: string | number) => encodeURIComponent(String(value))

function playerUrl(uuid?: string | null): string | undefined {
    return uuid ? getCanonicalUrl(`/player/${segment(uuid)}`) : undefined
}

function playerFlipsUrl(uuid: string): string {
    return getCanonicalUrl(`/player/${segment(uuid)}/flips`)
}

function flipUrl(uuid: string, flip: FlipTrackingFlip): string | undefined {
    return typeof flip.uId === 'number' ? `${playerFlipsUrl(uuid)}/${flip.uId.toString(16)}` : undefined
}

function auctionUrl(auctionUuid?: string | null): string | undefined {
    return auctionUuid ? getCanonicalUrl(`/auction/${segment(auctionUuid)}`) : undefined
}

function itemUrl(tag?: string | null, search?: string): string | undefined {
    return tag ? getCanonicalUrl(`/item/${segment(tag)}`, search) : undefined
}

function buttons(...candidates: MaybeButton[]): EmbedButton[] {
    return candidates.filter((button): button is EmbedButton => !!button)
}

/** `🏆 Best flip: **Hyperion** (+178M)` */
function namedLine(emoji: string, label: string, name: string | undefined, detail: string): string | undefined {
    return name ? `${emoji} ${label}: **${escapeMarkdown(name)}** (${detail})` : undefined
}

function auctionName(auction: Auction): string | undefined {
    return cleanName(auction.item?.name) || auction.item?.tag || undefined
}

// ----- player -----

function auctionPrice(auction: Auction): number {
    return auction.highestBid || auction.startingBid || 0
}

function getTopAuction(auctions: Auction[]): Auction | undefined {
    return auctions.reduce<Auction | undefined>((top, auction) => (!top || auctionPrice(auction) > auctionPrice(top) ? auction : top), undefined)
}

function auctionLine(emoji: string, label: string, auction?: Auction): EmbedLine {
    return auction && namedLine(emoji, label, auctionName(auction), formatShortCoins(auctionPrice(auction)))
}

/** The player page: stats of the first page of auctions it loads anyway */
export function getPlayerComponentEmbed(player: EmbedPlayer, auctions: Auction[] | undefined, now: number): DiscordEmbedPayload {
    const list = auctions || []
    const stats = getPlayerAuctionStats(list, now)
    const latest = list[0]
    const top = getTopAuction(list)
    const showTop = !!top && top !== latest && auctionPrice(top) > 0
    return buildComponentEmbed({
        title: player.name,
        url: playerUrl(player.uuid) || '',
        thumbnailUrl: getPlayerHeadRenderUrl(player.uuid),
        lines: [
            list.length === 0 && 'No recent auctions',
            stats.active > 0 && statLine('🔖', 'Active auctions', stats.active),
            stats.sold > 0 && statLine('💰', 'Recently sold', `${stats.sold} for ${formatShortCoins(stats.soldTotal)}`),
            auctionLine('🆕', 'Latest auction', latest),
            showTop && auctionLine('🏆', 'Top auction', top)
        ],
        buttons: buttons(
            { label: 'Auctions', emoji: '📜', url: playerUrl(player.uuid) },
            { label: 'Tracked flips', emoji: '📈', url: playerFlipsUrl(player.uuid) },
            latest && { label: 'Latest auction', emoji: '🆕', url: auctionUrl(latest.uuid) },
            showTop && { label: 'Top auction', emoji: '🏆', url: auctionUrl(top?.uuid) }
        )
    })
}

// ----- flip tracking -----

function getFinderLine(flips: FlipTrackingFlip[]): string | undefined {
    const finders = getProfitByFinder(flips).slice(0, MAX_FINDERS)
    if (finders.length === 0) {
        return undefined
    }
    return `🔎 Finders: ${finders.map(([label, profit]) => `${escapeMarkdown(label)} ${formatSignedShortCoins(profit)}`).join(' • ')}`
}

/** The tracked flips of a player: total profit, count, best flip and the most profitable finders */
export function getFlipListComponentEmbed(player: EmbedPlayer, response: FlipTrackingResponse | null | undefined): DiscordEmbedPayload {
    const flips = response?.flips || []
    const best = flips.length > 0 ? getBestFlip(flips) : undefined
    return buildComponentEmbed({
        title: `${player.name}'s tracked flips`,
        url: playerFlipsUrl(player.uuid),
        thumbnailUrl: getPlayerHeadRenderUrl(player.uuid),
        lines: [
            flips.length === 0 && 'No tracked flips found',
            flips.length > 0 && statLine('📈', 'Profit', formatSignedShortCoins(response?.totalProfit || 0)),
            flips.length > 0 && statLine('🔁', 'Flips', flips.length),
            best && namedLine('🏆', 'Best flip', cleanName(best.item?.name), formatSignedShortCoins(best.profit)),
            getFinderLine(flips)
        ],
        buttons: buttons(
            best && { label: 'Best flip', emoji: '🏆', url: flipUrl(player.uuid, best) },
            { label: 'Auctions', emoji: '📜', url: playerUrl(player.uuid) }
        )
    })
}

function getFlipProfitLine(flip: FlipTrackingFlip): string | undefined {
    const percent = getFlipProfitPercent(flip)
    const percentText = percent === undefined ? '' : ` (${percent > 0 ? '+' : ''}${percent}%)`
    if (flip.profit < 0) {
        return statLine('📉', 'Loss', `${formatShortCoins(-flip.profit)}${percentText}`)
    }
    return statLine('📈', 'Profit', `${formatSignedShortCoins(flip.profit)}${percentText}`)
}

function getFlipPricesLine(flip: FlipTrackingFlip): string | undefined {
    if (!Number.isFinite(flip.pricePaid) || !Number.isFinite(flip.soldFor)) {
        return undefined
    }
    return `💸 Bought: **${formatShortCoins(flip.pricePaid)}** → Sold: **${formatShortCoins(flip.soldFor)}**`
}

/** One tracked flip: prices, profit, time held, finder (External shows as Premium+) and the flipper */
export function getFlipComponentEmbed(player: EmbedPlayer, flip: FlipTrackingFlip): DiscordEmbedPayload {
    const itemName = cleanName(flip.item?.name) || flip.item?.tag || 'Item'
    return buildComponentEmbed({
        title: `${itemName} flip`,
        url: flipUrl(player.uuid, flip) || playerFlipsUrl(player.uuid),
        thumbnailUrl: flip.item?.iconUrl?.split('?')[0],
        accentColor: getTierAccentColor(flip.item?.tier),
        lines: [
            getFlipPricesLine(flip),
            getFlipProfitLine(flip),
            statLine('⌛', 'Held', getHeldDuration(flip)),
            // the "Unknown" fallback finder has no value and is not worth showing
            !!flip.finder?.value && statLine('🔎', 'Finder', flip.finder.label),
            statLine('👤', 'Flipper', player.name)
        ],
        buttons: buttons(
            { label: 'Item', emoji: '📊', url: itemUrl(flip.item?.tag) },
            { label: 'Bought auction', emoji: '🛒', url: auctionUrl(flip.originAuction) },
            { label: 'Sold auction', emoji: '💰', url: auctionUrl(flip.soldAuction) },
            { label: 'Flipper', emoji: '👤', url: playerUrl(player.uuid) },
            { label: 'All flips', emoji: '📈', url: playerFlipsUrl(player.uuid) }
        )
    })
}

// ----- auctions -----

function getAuctionBuyer(details: AuctionDetails, ended: boolean): { player?: Player; sold: boolean } {
    const top = details.bids?.[0]?.bidder
    const sold = !!top && (details.auction.bin || ended)
    return { player: top, sold }
}

/** An auction: price or highest bid, BIN or auction, seller, buyer (or top bidder) and rarity */
export function getAuctionComponentEmbed(details: AuctionDetails, now: number): DiscordEmbedPayload {
    const { auction } = details
    const ended = isAuctionEnded(auction, now)
    const buyer = getAuctionBuyer(details, ended)
    const buyerLabel = buyer.sold ? 'Buyer' : 'Top bidder'
    const seller = details.auctioneer
    return buildComponentEmbed({
        title: auctionName(auction) || 'SkyBlock auction',
        url: auctionUrl(auction.uuid || details.uuid) || '',
        thumbnailUrl: auction.item?.iconUrl,
        accentColor: getTierAccentColor(auction.item?.tier),
        lines: [
            `💰 ${getAuctionPriceText(details, ended)}`,
            statLine('🔖', 'Type', auction.bin ? 'BIN' : 'Auction'),
            details.count > 1 && statLine('📦', 'Count', details.count),
            statLine('👤', 'Seller', seller?.name),
            statLine('🛒', buyerLabel, buyer.player?.name),
            statLine('✨', 'Rarity', formatRarity(auction.item?.tier))
        ],
        buttons: buttons(
            { label: 'Item price', emoji: '📊', url: itemUrl(auction.item?.tag) },
            { label: 'Seller', emoji: '👤', url: playerUrl(seller?.uuid) },
            { label: buyerLabel, emoji: '🛒', url: playerUrl(buyer.player?.uuid) }
        )
    })
}

// ----- items -----

export interface ItemEmbedData {
    tag: string
    name: string
    iconUrl?: string | null
    tier?: string | null
    isBazaar: boolean
    prices: (AveragePrice | BazaarPrice)[]
    range?: string | null
    filter?: ItemFilter | null
    /** query of the page the heading links, e.g. range=week&Rarity=LEGENDARY (known filter keys only) */
    search?: string
}

// values as inline code: Discord does not autolink or format inside it (URLs and backticks are already removed)
function getFilterLine(filter?: ItemFilter | null): string | undefined {
    const entries = getDisplayFilterEntries(filter)
    if (entries.length === 0) {
        return undefined
    }
    return `🔍 Filters: ${entries.map(([key, value]) => `${escapeMarkdown(key)} \`${value}\``).join(', ')}`
}

function getAuctionItemLines(prices: AveragePrice[], range?: string | null): EmbedLine[] {
    const stats = getAuctionItemStats(prices)
    if (!stats) {
        return []
    }
    const rangeLabel = getRangeLabel(range)
    return [
        statLine('📊', rangeLabel ? `Average price (${rangeLabel})` : 'Average price', formatShortCoins(stats.average)),
        stats.volume > 0 && statLine('🔁', 'Sales', numberWithThousandsSeparators(stats.volume, ',', '.'))
    ]
}

function getBazaarItemLines(prices: BazaarPrice[]): EmbedLine[] {
    const stats = getBazaarItemStats(prices)
    if (!stats) {
        return []
    }
    return [
        statLine('🟢', 'Buy', formatShortCoins(stats.buy)),
        statLine('🔴', 'Sell', formatShortCoins(stats.sell)),
        stats.weeklyVolume > 0 && statLine('📦', 'Weekly volume', formatShortCoins(stats.weeklyVolume))
    ]
}

function getItemButtons(item: ItemEmbedData): EmbedButton[] {
    const priceHistory = { label: 'Price history', emoji: '📈', url: itemUrl(item.tag) }
    if (item.isBazaar) {
        return [priceHistory, { label: 'Bazaar flips', emoji: '💹', url: getCanonicalUrl('/bazaar') }]
    }
    return [
        priceHistory,
        { label: 'Active auctions', emoji: '🔖', url: itemUrl(item.tag, 'range=active') },
        { label: 'Archived auctions', emoji: '📚', url: getArchiveCanonicalUrl(item.tag) }
    ]
}

/** The item price page: bazaar buy/sell price or the auction house average and sales of the loaded range */
export function getItemComponentEmbed(item: ItemEmbedData): DiscordEmbedPayload {
    const priceLines = item.isBazaar ? getBazaarItemLines(item.prices as BazaarPrice[]) : getAuctionItemLines(item.prices as AveragePrice[], item.range)
    return buildComponentEmbed({
        title: item.name,
        url: itemUrl(item.tag, item.search || undefined) || '',
        thumbnailUrl: item.iconUrl,
        accentColor: getTierAccentColor(item.tier),
        lines: priceLines,
        optionalLines: [getFilterLine(item.filter)],
        buttons: getItemButtons(item)
    })
}

export interface ArchiveEmbedData {
    tag: string
    name: string
    iconUrl?: string | null
    tier?: string | null
    filter?: ItemFilter | null
    /** the base64 filter query parameter of the page */
    filterParam?: string
}

/** Archived auctions have no stats of their own: the item and its filters, linking to the price history */
export function getArchiveComponentEmbed(archive: ArchiveEmbedData): DiscordEmbedPayload {
    return buildComponentEmbed({
        title: `${archive.name} archived auctions`,
        url: getArchiveCanonicalUrl(archive.tag, archive.filterParam),
        thumbnailUrl: archive.iconUrl,
        accentColor: getTierAccentColor(archive.tier),
        lines: [],
        optionalLines: [getFilterLine(archive.filter)],
        buttons: [
            { label: 'Price history', emoji: '📈', url: itemUrl(archive.tag) },
            { label: 'Active auctions', emoji: '🔖', url: itemUrl(archive.tag, 'range=active') }
        ]
    })
}
