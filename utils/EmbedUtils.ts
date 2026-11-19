import type { AveragePrice } from '../api/_generated/skyApi.schemas'
import { formatToPriceToShorten, numberWithThousandsSeparators, removeMinecraftColorCoding } from './Formatter'
import type { EmbedOptions } from './SSRUtils'

/*
 Builders for the short, single-line Discord/social embed descriptions (og:description).
 Discord does not wrap multi-line text well, so every builder joins its key numbers with " • ".
 They are pure (the current time is passed in) so they can be unit tested.
*/

export const EMBED_SEPARATOR = ' • '

type EmbedPart = string | false | null | undefined

const DURATION_UNITS = [
    { ms: 365 * 86_400_000, suffix: 'y' },
    { ms: 30 * 86_400_000, suffix: 'mo' },
    { ms: 86_400_000, suffix: 'd' },
    { ms: 3_600_000, suffix: 'h' },
    { ms: 60_000, suffix: 'm' },
    { ms: 1_000, suffix: 's' }
]

const RANGE_LABELS: Record<string, string> = {
    hour: 'Last hour',
    day: 'Last 24h',
    week: 'Last 7 days',
    month: 'Last 30 days',
    year: 'Last year',
    full: 'All time'
}

export function joinEmbedParts(parts: EmbedPart[]): string {
    return parts.filter((part): part is string => !!part).join(EMBED_SEPARATOR)
}

export function getPlayerHeadRenderUrl(uuid: string): string {
    return `https://mc-heads.net/head/${uuid}/512`
}

/** Embed options for player pages: the 3D head render is 512x544 (with the hat layer) for every player */
export function getPlayerEmbedOptions(playerName: string): EmbedOptions {
    return { imageWidth: 512, imageHeight: 544, imageAlt: `${playerName}'s Minecraft head`, type: 'profile', username: playerName }
}

/**
 * Formats coins in a short form with about three significant digits (820M, 1.18B, 14.2M).
 * Values below 10k keep their digits (1,286.6) as bazaar prices need the precision.
 */
export function formatShortCoins(value?: number | null): string {
    if (value === undefined || value === null || !Number.isFinite(value)) {
        return '---'
    }
    const sign = value < 0 ? '-' : ''
    const abs = Math.abs(value)
    if (abs < 10_000) {
        return sign + numberWithThousandsSeparators(Math.round(abs * 10) / 10, ',', '.')
    }
    const integerDigits = formatToPriceToShorten(abs).replace(/\D.*$/, '').length
    const decimals = Math.max(0, 3 - integerDigits)
    return sign + trimTrailingZeros(formatToPriceToShorten(abs, decimals))
}

export function formatSignedShortCoins(value: number): string {
    return value > 0 ? `+${formatShortCoins(value)}` : formatShortCoins(value)
}

function trimTrailingZeros(shortNumber: string): string {
    return shortNumber.replace(/(\.\d*?)0+([a-zA-Z]*)$/, '$1$2').replace(/\.([a-zA-Z]*)$/, '$1')
}

export function formatShortDuration(ms: number): string {
    const abs = Math.abs(ms)
    const unit = DURATION_UNITS.find(u => abs >= u.ms) || DURATION_UNITS[DURATION_UNITS.length - 1]
    return `${Math.floor(abs / unit.ms)}${unit.suffix}`
}

export function cleanName(name?: string | null): string {
    return removeMinecraftColorCoding(name || '').trim()
}

function sum(values: number[]): number {
    return values.reduce((total, value) => total + (value || 0), 0)
}

// ----- player -----

function isActiveAuction(auction: Auction, now: number): boolean {
    return !!auction.end && new Date(auction.end).getTime() > now
}

// no end times: Discord caches an embed for a long time, so any time in it would soon mislead
function getLatestAuctionText(auction: Auction): string {
    const price = formatShortCoins(auction.highestBid || auction.startingBid)
    return `Latest: ${cleanName(auction.item?.name) || auction.item?.tag} (${price})`
}

/** Summarises the player's most recent auctions (the first page the player page loads anyway) */
export function getPlayerEmbedDescription(playerName: string, auctions: Auction[] | undefined, now: number): string {
    if (!auctions || auctions.length === 0) {
        return `Auctions and bids for ${playerName} in Hypixel Skyblock.`
    }
    const active = auctions.filter(auction => isActiveAuction(auction, now))
    const sold = auctions.filter(auction => !isActiveAuction(auction, now) && auction.highestBid > 0)
    const stats = joinEmbedParts([
        active.length > 0 && `Active: ${active.length}`,
        sold.length > 0 && `Recently sold: ${sold.length} for ${formatShortCoins(sum(sold.map(a => a.highestBid)))}`,
        getLatestAuctionText(auctions[0])
    ])
    return `${playerName}'s Hypixel SkyBlock auctions: ${stats}`
}

// ----- flip tracking -----

function getBestFlip(flips: FlipTrackingFlip[]): FlipTrackingFlip {
    return flips.reduce((best, flip) => (flip.profit > best.profit ? flip : best), flips[0])
}

function getTopFinder(flips: FlipTrackingFlip[]): string | undefined {
    const profitByFinder = new Map<string, number>()
    flips.forEach(flip => {
        // the "Unknown" fallback finder has no value and is not worth showing
        if (!flip.finder?.value || !flip.finder.label) {
            return
        }
        profitByFinder.set(flip.finder.label, (profitByFinder.get(flip.finder.label) || 0) + flip.profit)
    })
    const ranked = Array.from(profitByFinder.entries()).filter(([, profit]) => profit > 0).sort((a, b) => b[1] - a[1])
    return ranked[0]?.[0]
}

export function getFlipListEmbedDescription(response: FlipTrackingResponse | null | undefined, playerName: string): string {
    const flips = response?.flips || []
    if (flips.length === 0) {
        return `There were no flips found for ${playerName}`
    }
    const best = getBestFlip(flips)
    const topFinder = getTopFinder(flips)
    const stats = joinEmbedParts([
        `Profit: ${formatSignedShortCoins(response?.totalProfit || 0)}`,
        `Flips: ${flips.length}`,
        `Best: ${cleanName(best.item?.name)} (${formatSignedShortCoins(best.profit)})`,
        topFinder && `Top finder: ${topFinder}`
    ])
    return `${playerName}'s tracked flips: ${stats}`
}

/** Profit relative to the purchase price. The tracked profit already includes the AH tax. */
export function getFlipProfitPercent(flip: Pick<FlipTrackingFlip, 'profit' | 'pricePaid'>): number | undefined {
    if (!flip.pricePaid) {
        return undefined
    }
    return Math.round((flip.profit / flip.pricePaid) * 100)
}

function getFlipProfitText(flip: FlipTrackingFlip): string {
    const percent = getFlipProfitPercent(flip)
    const percentText = percent === undefined ? '' : ` (${percent > 0 ? '+' : ''}${percent}%)`
    if (flip.profit < 0) {
        return `Loss: ${formatShortCoins(-flip.profit)}${percentText}`
    }
    return `Profit: ${formatSignedShortCoins(flip.profit)}${percentText}`
}

function getHeldText(flip: FlipTrackingFlip): string | undefined {
    const buy = flip.buyTime ? new Date(flip.buyTime).getTime() : NaN
    const sell = flip.sellTime ? new Date(flip.sellTime).getTime() : NaN
    if (Number.isNaN(buy) || Number.isNaN(sell) || sell < buy) {
        return undefined
    }
    return `Held: ${formatShortDuration(sell - buy)}`
}

export function getFlipEmbedDescription(flip: FlipTrackingFlip, playerName: string): string {
    const stats = joinEmbedParts([
        `Bought: ${formatShortCoins(flip.pricePaid)}`,
        `Sold: ${formatShortCoins(flip.soldFor)}`,
        getFlipProfitText(flip),
        getHeldText(flip),
        `Flipper: ${playerName}`
    ])
    return `${cleanName(flip.item?.name)} flip: ${stats}`
}

// ----- items -----

export function getRangeLabel(range?: string | null): string | undefined {
    return range ? RANGE_LABELS[range] : undefined
}

function getVolumeWeightedAverage(prices: AveragePrice[], volume: number): number {
    if (volume <= 0) {
        return sum(prices.map(price => price.avg)) / prices.length
    }
    return sum(prices.map(price => price.avg * price.volume)) / volume
}

/** Volume weighted average price and number of sales of an auction house item */
export function getAuctionItemEmbedDescription(prices: AveragePrice[] | undefined, range?: string | null): string | undefined {
    const valid = (prices || []).filter(price => price && Number.isFinite(price.avg))
    if (valid.length === 0) {
        return undefined
    }
    const volume = sum(valid.map(price => price.volume))
    // no lowest sale: single underpriced or mispriced sales make the minimum misleading
    return joinEmbedParts([
        `Avg: ${formatShortCoins(getVolumeWeightedAverage(valid, volume))}`,
        volume > 0 && `Sold: ${numberWithThousandsSeparators(volume, ',', '.')}`,
        getRangeLabel(range)
    ])
}

function getLatestBazaarPrice(prices: BazaarPrice[]): BazaarPrice | undefined {
    const time = (price: BazaarPrice) => new Date(price.timestamp).getTime() || 0
    return prices.reduce<BazaarPrice | undefined>((latest, price) => (!latest || time(price) > time(latest) ? price : latest), undefined)
}

/** Latest instant buy/sell price and weekly volume of a bazaar item */
export function getBazaarItemEmbedDescription(prices: BazaarPrice[] | undefined): string | undefined {
    const latest = getLatestBazaarPrice((prices || []).filter(price => price?.buyData && price?.sellData))
    if (!latest) {
        return undefined
    }
    const weeklyVolume = (latest.buyData.moving || 0) + (latest.sellData.moving || 0)
    return joinEmbedParts([
        `Buy: ${formatShortCoins(latest.buyData.price)}`,
        `Sell: ${formatShortCoins(latest.sellData.price)}`,
        weeklyVolume > 0 && `Weekly volume: ${formatShortCoins(weeklyVolume)}`
    ])
}

export function getItemFilterEmbedText(filter?: ItemFilter | null): string | undefined {
    if (!filter || Object.keys(filter).length === 0) {
        return undefined
    }
    return `Filters: ${Object.entries(filter)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')}`
}

// ----- auctions -----

function getAuctionPriceText(details: AuctionDetails, ended: boolean): string {
    const { auction, bids } = details
    const bidCount = bids?.length || 0
    if (auction.bin) {
        if (bidCount > 0) {
            return `Sold for ${formatShortCoins(auction.highestBid)} (BIN)`
        }
        return `${ended ? 'Unsold BIN' : 'BIN'}: ${formatShortCoins(auction.startingBid)}`
    }
    if (bidCount === 0) {
        return `Starting bid: ${formatShortCoins(auction.startingBid)} (no bids)`
    }
    const bidsText = `${bidCount} bid${bidCount === 1 ? '' : 's'}`
    return `${ended ? 'Sold for' : 'Highest bid'}: ${formatShortCoins(auction.highestBid)} (${bidsText})`
}

function getAuctionPeopleText(details: AuctionDetails): string | undefined {
    const seller = details.auctioneer?.name
    const buyer = details.bids?.[0]?.bidder?.name
    if (seller && buyer) {
        return `${seller} → ${buyer}`
    }
    if (seller) {
        return `Seller: ${seller}`
    }
    return buyer ? `Buyer: ${buyer}` : undefined
}

function formatRarity(tier?: string): string | undefined {
    if (!tier || typeof tier !== 'string') {
        return undefined
    }
    return tier
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export function getAuctionEmbedDescription(details: AuctionDetails, now: number): string {
    const end = details.auction.end ? new Date(details.auction.end).getTime() : NaN
    const ended = !Number.isNaN(end) && end <= now
    return joinEmbedParts([
        cleanName(details.auction.item?.name) || details.auction.item?.tag,
        getAuctionPriceText(details, ended),
        getAuctionPeopleText(details),
        formatRarity(details.auction.item?.tier as string | undefined)
    ])
}
