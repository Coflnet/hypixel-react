'use client'

import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { numberWithThousandsSeparators, convertTagToName } from '../../utils/Formatter'
import { 
    getApiBazaarItemTagHistoryDay, 
    getApiBazaarItemTagHistoryWeek, 
    getApiItemPriceItemTagHistoryDay, 
    getApiItemPriceItemTagHistoryWeek, 
    getApiItemPriceItemTagHistoryMonth,
    getApiAuctionsTagItemTagRecentOverview 
} from '../../api/_generated/skyApi'
import { parseBazaarPrice } from '../../utils/Parser/APIResponseParser'

interface FAQPair {
    q: string
    a: string
}

interface Props {
    item: Item
    initialFaqPairs: FAQPair[]
    tag: string
    range: string
    filter: any
}

export default function ItemFAQ({ item, initialFaqPairs, tag, range, filter }: Props) {
    const [faqPairs, setFaqPairs] = useState<FAQPair[]>(initialFaqPairs)

    useEffect(() => {
        // Only refresh if we are on the client and it's not a static build
        // Actually, we always want to refresh on the client to get the latest data
        async function refreshData() {
            try {
                let prices: any[] = []
                let recentAuctions: any[] = []

                if (item.bazaar) {
                    let response;
                    if (range === 'week') {
                        response = await getApiBazaarItemTagHistoryWeek(tag)
                    } else {
                        response = await getApiBazaarItemTagHistoryDay(tag)
                    }
                    prices = (response?.data || []).map(parseBazaarPrice)
                } else {
                    let pricesPromise;
                    if (range === 'week') {
                        pricesPromise = getApiItemPriceItemTagHistoryWeek(tag, filter || {})
                    } else if (range === 'month') {
                        pricesPromise = getApiItemPriceItemTagHistoryMonth(tag, filter || {})
                    } else {
                        pricesPromise = getApiItemPriceItemTagHistoryDay(tag, filter || {})
                    }

                    const [pricesRes, auctionsRes] = await Promise.allSettled([
                        pricesPromise,
                        getApiAuctionsTagItemTagRecentOverview(tag, filter || {})
                    ])
                    if (pricesRes.status === 'fulfilled') prices = (pricesRes.value as any).data || []
                    if (auctionsRes.status === 'fulfilled') recentAuctions = (auctionsRes.value as any).data || []
                }

                const priceValues = Array.isArray(prices) 
                    ? prices
                        .map(p => {
                            if (p == null) return null
                            if (p.avg !== undefined) return p.avg
                            if (p.sellData && p.sellData.price !== undefined) return p.sellData.price
                            if (p.price !== undefined) return p.price
                            return null
                        })
                        .filter(v => v !== null && !isNaN(v))
                    : []

                const stats = computeStats(priceValues)
                const trend = computeTrend(priceValues)

                let topSeller: string | null = null
                let topSellerCount: number = 0
                if (Array.isArray(recentAuctions) && recentAuctions.length > 0) {
                    const counts: Record<string, number> = {}
                    recentAuctions.forEach(a => {
                        if (!a) return
                        const name = a.playerName || a.sellerName || a.seller?.name || 'Unknown'
                        counts[name] = (counts[name] || 0) + 1
                    })
                    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
                    if (entries.length > 0) {
                        topSeller = entries[0][0]
                        topSellerCount = entries[0][1]
                    }
                }

                // Rebuild FAQ pairs with fresh data
                const newFaqPairs = [...initialFaqPairs]
                
                // Update or add dynamic questions
                const itemName = item.name || convertTagToName(tag)
                if (stats) {
                    updateOrAdd(newFaqPairs, `What is the minimum price for ${itemName}?`, 
                        `Over the last ${range}, the minimum observed price for ${itemName} was ${numberWithThousandsSeparators(stats.min)} coins.`)
                    
                    updateOrAdd(newFaqPairs, `What is the maximum price for ${itemName}?`, 
                        `Over the last ${range}, the maximum observed price for ${itemName} was ${numberWithThousandsSeparators(stats.max)} coins.`)
                    
                    updateOrAdd(newFaqPairs, `What is the average price for ${itemName}?`, 
                        `Over the last ${range}, the average price for ${itemName} was approximately ${numberWithThousandsSeparators(stats.avg)} coins.`)
                    
                    updateOrAdd(newFaqPairs, `What is the median price for ${itemName}?`, 
                        `Over the last ${range}, the median price for ${itemName} was ${numberWithThousandsSeparators(stats.median)} coins.`)
                } else {
                    updateOrAdd(newFaqPairs, `What are the prices for ${itemName}?`, 
                        `No price data available for the selected range (${range}).`)
                }

                updateOrAdd(newFaqPairs, `Is the price for ${itemName} currently increasing or decreasing?`,
                    trend === 'increasing' ? 'Prices are currently increasing.' : trend === 'decreasing' ? 'Prices are currently decreasing.' : 'Prices are currently stable.')

                if (topSeller) {
                    updateOrAdd(newFaqPairs, `Who sold the most ${item.name || convertTagToName(tag)} recently?`,
                        `${topSeller} sold the most (${topSellerCount} ${topSellerCount === 1 ? 'auction' : 'auctions'}) recently.`)
                }

                setFaqPairs(newFaqPairs)
            } catch (e) {
                console.error('Failed to refresh FAQ data', e)
            }
        }

        refreshData()
    }, [tag, range, JSON.stringify(filter)])

    function updateOrAdd(pairs: FAQPair[], q: string, a: string) {
        const idx = pairs.findIndex(p => p.q === q)
        if (idx !== -1) {
            pairs[idx].a = a
        } else {
            pairs.push({ q, a })
        }
    }

    function computeStats(vals: number[]) {
        if (!vals || vals.length === 0) return null
        const sorted = [...vals].sort((a, b) => a - b)
        const sum = vals.reduce((s, v) => s + v, 0)
        const avg = Math.round(sum / vals.length)
        const min = Math.round(sorted[0])
        const max = Math.round(sorted[sorted.length - 1])
        const mid = Math.floor(sorted.length / 2)
        const median = Math.round(sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2)
        return { min, max, avg, median }
    }

    function computeTrend(vals: number[]) {
        if (!vals || vals.length < 2) return 'stable'
        const take = Math.min(5, Math.floor(vals.length / 2))
        if (take < 1) return 'stable'
        const first = vals.slice(0, take).reduce((s, v) => s + v, 0) / take
        const last = vals.slice(-take).reduce((s, v) => s + v, 0) / take
        if (last > first * 1.02) return 'increasing'
        if (last < first * 0.98) return 'decreasing'
        return 'stable'
    }

    return (
        <Container className="mt-4 mb-4">
            <h2>FAQ</h2>
            {faqPairs.map((pair, idx) => (
                <div key={idx} style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{pair.q}</h3>
                    <p style={{ margin: 0 }}>{pair.a}</p>
                </div>
            ))}
            {/* JSON-LD for FAQ to help indexing */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: faqPairs.map(p => ({
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
        </Container>
    )
}
