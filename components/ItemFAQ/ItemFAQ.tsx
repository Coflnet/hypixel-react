import Link from 'next/link'
import { numberWithThousandsSeparators, convertTagToName } from '../../utils/Formatter'
import type { Item } from '../../api/_generated/skyApi.schemas'
import type { CachedItemInfo } from '../../utils/ItemsCache'

type Trend = 'increasing' | 'decreasing' | 'stable'

interface FAQPair {
    q: string
    a: string | React.ReactNode
}

export interface ItemFAQProps {
    item: Item
    tag: string
    range: string | null
    prices: any[]
    isBazaar: boolean
    itemFlags?: CachedItemInfo | null
}

function rangeToHuman(range: string | null): string {
    if (!range) return 'selected timeframe'
    switch (range) {
        case 'day':
            return 'last 24 hours'
        case 'week':
            return 'last 7 days'
        case 'month':
            return 'last 30 days'
        case 'full':
            return 'full available history'
        case 'active':
            return 'active listings'
        default:
            return `last ${range}`
    }
}

function extractPriceValues(prices: any[], isBazaar: boolean): number[] {
    if (!Array.isArray(prices) || prices.length === 0) return []

    const vals: Array<number | null> = prices.map(p => {
        if (!p) return null

        if (isBazaar) {
            // Try explicit avg first, then calculate from buy/sell data
            let raw = p.avg
            if (!raw && p.sellData?.price && p.buyData?.price) {
                // Calculate average of buy and sell prices for bazaar
                raw = (p.sellData.price + p.buyData.price) / 2
            } else if (!raw) {
                // Fallback to sell price, then buy price, then other fields
                raw = p.sellData?.price ?? p.buyData?.price ?? p.price ?? p.sellPrice ?? p.buyPrice
            }
            const n = typeof raw === 'number' ? raw : Number(raw)
            return Number.isFinite(n) ? n : null
        }

        const raw = p.avg ?? p.price ?? p.bin ?? p.startingBid
        const n = typeof raw === 'number' ? raw : Number(raw)
        return Number.isFinite(n) ? n : null
    })

    return vals.filter((v): v is number => v != null)
}

function computeStats(vals: number[]) {
    if (!vals.length) return null
    const sorted = [...vals].sort((a, b) => a - b)
    const sum = vals.reduce((s, v) => s + v, 0)
    const avg = sum / vals.length
    const min = sorted[0]
    const max = sorted[sorted.length - 1]

    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2

    return {
        min: Math.round(min),
        max: Math.round(max),
        avg: Math.round(avg),
        median: Math.round(median)
    }
}

function computeTrend(vals: number[]): Trend {
    if (vals.length < 6) return 'stable'
    const take = Math.min(10, Math.floor(vals.length / 3))
    if (take < 2) return 'stable'
    const first = vals.slice(0, take).reduce((s, v) => s + v, 0) / take
    const last = vals.slice(-take).reduce((s, v) => s + v, 0) / take
    if (last > first * 1.02) return 'increasing'
    if (last < first * 0.98) return 'decreasing'
    return 'stable'
}

function formatCoins(n: number) {
    return `${numberWithThousandsSeparators(n)} coins`
}

function getBuyAnswer(isBazaar: boolean, isAuction: boolean, itemName: string) {
    if (isBazaar) {
        return `${itemName} is available on the Bazaar. Open the Skyblock Bazaar and place a buy order (often cheaper) or buy instantly.`
    }
    if (isAuction) {
        return `${itemName} is typically traded on the Auction House. Search for the item on AH and compare BIN prices before buying.`
    }
    return `${itemName} does not seem to be sold regularly via Bazaar nor Auction House you can't easily buy it.`
}

function getFlipHref(isBazaar: boolean) {
    return isBazaar ? '/bazaar' : '/flipper'
}

export default function ItemFAQ({ item, tag, range, prices, isBazaar, itemFlags }: ItemFAQProps) {
    const itemName = item?.itemName || convertTagToName(tag)
    const timeFrame = rangeToHuman(range)
    const values = extractPriceValues(prices, isBazaar)
    const stats = computeStats(values)
    const trend = computeTrend(values)
    const hasHistory = Array.isArray(prices) && prices.length > 0 && range !== 'active'

    const lastUpdated = new Date().toLocaleString()

    const isMuseum = itemFlags?.isMuseum ?? false
    const isCraftable = itemFlags?.isCraftable ?? false
    const isFireSale = itemFlags?.isFireSale ?? false
    const isAuction = itemFlags?.isAuction ?? false

    const trendText =
        trend === 'increasing'
            ? `The price for ${itemName} is currently increasing.`
            : trend === 'decreasing'
              ? `The price for ${itemName} is currently decreasing.`
              : `The price for ${itemName} is currently stable.`

    const faqPairs: FAQPair[] = [
        {
            q: `What is the minimum price for ${itemName} in the ${timeFrame}?`,
            a: stats
                ? `In the ${timeFrame}, the minimum observed price for ${itemName} was ${formatCoins(stats.min)}.`
                : `There is not enough price data to calculate a minimum for ${itemName} in the ${timeFrame}.`
        },
        {
            q: `What is the maximum price for ${itemName} in the ${timeFrame}?`,
            a: stats
                ? `In the ${timeFrame}, the maximum observed price for ${itemName} was ${formatCoins(stats.max)}.`
                : `There is not enough price data to calculate a maximum for ${itemName} in the ${timeFrame}.`
        },
        {
            q: `What is the average price for ${itemName}?`,
            a: stats
                ? `The average price for ${itemName} in the ${timeFrame} is about ${formatCoins(stats.avg)}.`
                : `There is not enough price data to calculate an average for ${itemName}.`
        },
        {
            q: `What is the median price for ${itemName}?`,
            a: stats
                ? `The median price for ${itemName} in the ${timeFrame} is ${formatCoins(stats.median)}.`
                : `There is not enough price data to calculate a median for ${itemName}.`
        },
        {
            q: `Is the price for ${itemName} currently increasing or decreasing?`,
            a: hasHistory ? trendText : `There is not enough recent history to determine a short-term trend for ${itemName}.`
        },
        {
            q: `How do I buy ${itemName}?`,
            a: getBuyAnswer(isBazaar, isAuction, itemName)
        },
        {
            q: `How often is the price of ${itemName} updated?`,
            a: `Prices are updated at least once per minute when new data is available.`
        },
        {
            q: `Can I sell ${itemName}?`,
            a: isBazaar
                ? `Yes! You can sell ${itemName} on the Bazaar by placing a sell order or selling instantly.`
                : isAuction
                  ? `Yes! ${itemName} can be sold on the Auction House.`
                  : `${itemName} is not tradeable on the Auction House and not sellable on the SkyBlock Bazaar.`
        },
        {
            q: `When was this data last updated?`,
            a: `This FAQ was last updated at ${lastUpdated}.`
        },
        {
            q: `How to flip ${itemName}?`,
            a: isBazaar ? (
                <>Use the <Link href={getFlipHref(true)}>Bazaar</Link> tools to find spreads and volume, then buy low and sell high.</>
            ) : (
                <>Use the <Link href={getFlipHref(false)}>Flipper</Link> to find profitable Auction House flips and snipe underpriced listings.</>
            )
        }
    ]

    if (isMuseum) {
        faqPairs.push({
            q: `Can I donate ${itemName} to the Museum?`,
            a: `Yes! ${itemName} can be donated to the SkyBlock Museum. Donating items to the Museum provides SkyBlock XP and contributes to your Museum completion progress.`
        })
    }

    if (isFireSale) {
        faqPairs.push({
            q: `How was ${itemName} created?`,
            a: `${itemName} was created during a Fire Sale event. Fire Sale items have a limited quantity and were sold for a short period at a fixed price. Their value may increase over time due to scarcity.`
        })
    } else if (isCraftable) {
        faqPairs.push({
            q: `Can I craft ${itemName}?`,
            a: (
                <>
                    Yes! ${itemName} is obtainable through crafting. Check the <Link href="/crafts">Crafts page</Link> to see if crafting is profitable and view the required materials.
                </>
            )
        })
    }

    const jsonLdPairs = faqPairs.map(p => {
        let answer: string
        if (typeof p.a === 'string') {
            answer = p.a
        } else {
            if (p.q.includes('flip')) {
                answer = isBazaar
                    ? `Use the Bazaar tools (/bazaar) to find spreads and volume, then buy low and sell high.`
                    : `Use the Flipper (/flipper) to find profitable Auction House flips and snipe underpriced listings.`
            } else if (p.q.includes('craft')) {
                answer = `Yes! ${itemName} is obtainable through crafting. Check the Crafts page (/crafts) to see if crafting is profitable and view the required materials.`
            } else {
                answer = String(p.a)
            }
        }
        return { q: p.q, a: answer }
    })

    return (
        <section className="mt-5 mb-4" aria-label="Item FAQ">
            <h2 className="h4">FAQ</h2>
            <div className="mt-3">
                {faqPairs.map((pair, idx) => (
                    <div key={idx} className="mb-3">
                        <h3 className="h6 mb-1">{pair.q}</h3>
                        <div className="text-body-secondary">
                            {typeof pair.a === 'string' ? <p className="mb-0">{pair.a}</p> : pair.a}
                        </div>
                    </div>
                ))}
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: jsonLdPairs.map(p => ({
                            '@type': 'Question',
                            name: p.q,
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: p.a
                            }
                        }))
                    })
                }}
            />
        </section>
    )
}
