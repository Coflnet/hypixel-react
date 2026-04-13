'use client'
import { useState, useMemo, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import api from '../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getApiItemItemTagDetails } from '../../api/_generated/skyApi'
import Number from '../Number/Number'
import styles from './BazaarAnalysis.module.css'

interface Props {
    item: Item
}

function formatPrice(price: number): string {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(2)}B`
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`
    if (price >= 1_000) return `${(price / 1_000).toFixed(2)}K`
    return price.toFixed(2)
}

interface AnalysisData {
    spread: number
    spreadPercent: number
    instaBuyPrice: number
    instaSellPrice: number
    buyVolume: number
    sellVolume: number
    imbalanceRatio: number
    imbalanceLabel: string
    whaleOrders: { type: 'buy' | 'sell'; price: number; amount: number; coinValue: number }[]
    depthBuy: { price: number; cumulative: number }[]
    depthSell: { price: number; cumulative: number }[]
    supportLevels: { price: number; volume: number }[]
    resistanceLevels: { price: number; volume: number }[]
    buyOrderCount: number
    sellOrderCount: number
    totalBuyCoins: number
    totalSellCoins: number
    liquidityScore: number
    liquidityLabel: string
}

function computeAnalysis(snapshot: BazaarSnapshot): AnalysisData | null {
    if (!snapshot.buyOrders?.length || !snapshot.sellOrders?.length) return null

    const instaBuyPrice = snapshot.buyData.price
    const instaSellPrice = snapshot.sellData.price
    const spread = instaBuyPrice - instaSellPrice
    const midPrice = (instaBuyPrice + instaSellPrice) / 2
    const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0

    // Volume and imbalance
    const buyVolume = snapshot.buyOrders.reduce((s, o) => s + o.amount, 0)
    const sellVolume = snapshot.sellOrders.reduce((s, o) => s + o.amount, 0)
    const totalVolume = buyVolume + sellVolume
    const imbalanceRatio = totalVolume > 0 ? buyVolume / totalVolume : 0.5
    let imbalanceLabel = 'BALANCED'
    if (imbalanceRatio > 0.65) imbalanceLabel = 'BUY HEAVY'
    else if (imbalanceRatio > 0.55) imbalanceLabel = 'BUY LEANING'
    else if (imbalanceRatio < 0.35) imbalanceLabel = 'SELL HEAVY'
    else if (imbalanceRatio < 0.45) imbalanceLabel = 'SELL LEANING'

    // Coin totals
    const totalBuyCoins = snapshot.buyOrders.reduce((s, o) => s + o.amount * o.pricePerUnit, 0)
    const totalSellCoins = snapshot.sellOrders.reduce((s, o) => s + o.amount * o.pricePerUnit, 0)

    // Whale detection: orders with coin value > 3x the average
    const allOrders = [
        ...snapshot.buyOrders.map(o => ({ type: 'buy' as const, ...o })),
        ...snapshot.sellOrders.map(o => ({ type: 'sell' as const, ...o }))
    ]
    const avgCoinValue = allOrders.reduce((s, o) => s + o.amount * o.pricePerUnit, 0) / allOrders.length
    const whaleThreshold = avgCoinValue * 3
    const whaleOrders = allOrders
        .filter(o => o.amount * o.pricePerUnit > whaleThreshold)
        .map(o => ({ type: o.type, price: o.pricePerUnit, amount: o.amount, coinValue: o.amount * o.pricePerUnit }))
        .sort((a, b) => b.coinValue - a.coinValue)
        .slice(0, 10)

    // Market depth (cumulative volume at each price level)
    // Buy orders: sorted descending by price (highest bid first)
    const sortedBuys = [...snapshot.sellOrders].sort((a, b) => b.pricePerUnit - a.pricePerUnit)
    let cumBuy = 0
    const depthBuy = sortedBuys.map(o => {
        cumBuy += o.amount
        return { price: o.pricePerUnit, cumulative: cumBuy }
    })

    // Sell orders: sorted ascending by price (lowest ask first)
    const sortedSells = [...snapshot.buyOrders].sort((a, b) => a.pricePerUnit - b.pricePerUnit)
    let cumSell = 0
    const depthSell = sortedSells.map(o => {
        cumSell += o.amount
        return { price: o.pricePerUnit, cumulative: cumSell }
    })

    // Support/resistance: price levels with large volume concentrations
    const buyAvgVol = buyVolume / snapshot.sellOrders.length
    const supportLevels = snapshot.sellOrders
        .filter(o => o.amount > buyAvgVol * 2)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map(o => ({ price: o.pricePerUnit, volume: o.amount }))

    const sellAvgVol = sellVolume / snapshot.buyOrders.length
    const resistanceLevels = snapshot.buyOrders
        .filter(o => o.amount > sellAvgVol * 2)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map(o => ({ price: o.pricePerUnit, volume: o.amount }))

    // Liquidity score: 0-100 based on spread tightness, depth, and order count
    const spreadScore = Math.max(0, 40 - spreadPercent * 8) // tight spread = higher score, 0% → 40, 5% → 0
    const depthScore = Math.min(30, Math.log10(Math.max(1, buyVolume + sellVolume)) * 5) // logarithmic volume score
    const orderScore = Math.min(30, (snapshot.buyOrders.length + snapshot.sellOrders.length) * 0.5) // more orders = more liquid
    const liquidityScore = Math.round(Math.min(100, spreadScore + depthScore + orderScore))
    const liquidityLabel = liquidityScore >= 80 ? 'EXCELLENT' : liquidityScore >= 60 ? 'GOOD' : liquidityScore >= 40 ? 'MODERATE' : liquidityScore >= 20 ? 'LOW' : 'VERY LOW'

    return {
        spread,
        spreadPercent,
        instaBuyPrice,
        instaSellPrice,
        buyVolume,
        sellVolume,
        imbalanceRatio,
        imbalanceLabel,
        whaleOrders,
        depthBuy,
        depthSell,
        supportLevels,
        resistanceLevels,
        buyOrderCount: snapshot.sellOrders.length,
        sellOrderCount: snapshot.buyOrders.length,
        totalBuyCoins,
        totalSellCoins,
        liquidityScore,
        liquidityLabel
    }
}

function BazaarAnalysis(props: Props) {
    const [snapshot, setSnapshot] = useState<BazaarSnapshot | null>(null)
    const [npcSellPrice, setNpcSellPrice] = useState<number | null>(null)
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('bazaarAnalysisCollapsed') === 'true'
        }
        return false
    })

    useEffect(() => {
        loadSnapshot()
        getApiItemItemTagDetails(props.item.tag).then(res => {
            if (res.data?.npcSellPrice) setNpcSellPrice(res.data.npcSellPrice)
        }).catch(() => {})
        const handler = () => loadSnapshot()
        document.addEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, handler)
        return () => document.removeEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, handler)
    }, [props.item.tag])

    function loadSnapshot() {
        api.getBazaarSnapshot(props.item.tag, new Date()).then(setSnapshot)
    }

    function toggleCollapse() {
        setCollapsed(prev => {
            const next = !prev
            localStorage.setItem('bazaarAnalysisCollapsed', String(next))
            return next
        })
    }

    const analysis = useMemo(() => snapshot ? computeAnalysis(snapshot) : null, [snapshot])

    function getDepthChartOption() {
        if (!analysis) return null
        const buyPrices = analysis.depthBuy.map(d => d.price)
        const sellPrices = analysis.depthSell.map(d => d.price)
        const allPrices = [...buyPrices, ...sellPrices]
        const minP = Math.min(...allPrices)
        const maxP = Math.max(...allPrices)

        return {
            animation: false,
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    return params.map((p: any) => `${p.seriesName}: ${p.value[1].toLocaleString()} items @ ${formatPrice(p.value[0])}`).join('<br/>')
                }
            },
            legend: { data: ['Buy Depth', 'Sell Depth'], textStyle: { color: '#ccc' } },
            grid: { left: 60, right: 20, top: 30, bottom: 30 },
            xAxis: {
                type: 'value',
                name: 'Price',
                min: minP * 0.95,
                max: maxP * 1.05,
                axisLabel: { formatter: (v: number) => formatPrice(v), color: '#888' },
                axisLine: { lineStyle: { color: '#444' } }
            },
            yAxis: {
                type: 'value',
                name: 'Cumulative Vol',
                axisLabel: { formatter: (v: number) => formatPrice(v), color: '#888' },
                axisLine: { lineStyle: { color: '#444' } },
                splitLine: { lineStyle: { color: '#333' } }
            },
            series: [
                {
                    name: 'Buy Depth',
                    type: 'line',
                    step: 'end',
                    areaStyle: { color: 'rgba(40,167,69,0.15)' },
                    lineStyle: { color: '#28a745' },
                    itemStyle: { color: '#28a745' },
                    data: analysis.depthBuy.map(d => [d.price, d.cumulative]),
                    symbol: 'none'
                },
                {
                    name: 'Sell Depth',
                    type: 'line',
                    step: 'start',
                    areaStyle: { color: 'rgba(220,53,69,0.15)' },
                    lineStyle: { color: '#dc3545' },
                    itemStyle: { color: '#dc3545' },
                    data: analysis.depthSell.map(d => [d.price, d.cumulative]),
                    symbol: 'none'
                }
            ]
        }
    }

    function getImbalanceChartOption() {
        if (!analysis) return null
        return {
            animation: false,
            series: [{
                type: 'gauge',
                min: 0,
                max: 100,
                splitNumber: 4,
                radius: '90%',
                axisLine: {
                    lineStyle: {
                        width: 12,
                        color: [
                            [0.35, '#dc3545'],
                            [0.45, '#b8860b'],
                            [0.55, '#6c757d'],
                            [0.65, '#b8860b'],
                            [1, '#28a745']
                        ]
                    }
                },
                pointer: { width: 4, length: '60%', itemStyle: { color: '#eee' } },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: {
                    formatter: analysis.imbalanceLabel,
                    fontSize: 12,
                    color: '#ccc',
                    offsetCenter: [0, '70%']
                },
                data: [{ value: Math.round(analysis.imbalanceRatio * 100) }]
            }]
        }
    }

    const imbalanceColor = !analysis ? '#888' :
        analysis.imbalanceRatio > 0.55 ? '#28a745' :
        analysis.imbalanceRatio < 0.45 ? '#dc3545' : '#6c757d'

    return (
        <div className={styles.container}>
            <div className={styles.header} onClick={toggleCollapse} style={{ cursor: 'pointer' }}>
                <div className={styles.headerTitle}>
                    <span className={styles.collapseIcon}>{collapsed ? '▶' : '▼'}</span>
                    <h3 style={{ margin: 0 }}>Bazaar Analysis</h3>
                </div>
            </div>

            {!collapsed && (
                <>
                    {!snapshot ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>{getLoadingElement()}</div>
                    ) : !analysis ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                            <p>Not enough order data for analysis.</p>
                        </div>
                    ) : (
                        <>
                            {/* Spread & Summary Stats */}
                            <div className={styles.statsRow}>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Spread</div>
                                    <div className={styles.statValue}>{formatPrice(analysis.spread)}</div>
                                    <div className={styles.statSub}>{analysis.spreadPercent.toFixed(2)}%</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Insta-Buy</div>
                                    <div className={styles.statValue}>{formatPrice(analysis.instaBuyPrice)}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Insta-Sell</div>
                                    <div className={styles.statValue}>{formatPrice(analysis.instaSellPrice)}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Buy Volume</div>
                                    <div className={styles.statValue}><Number number={analysis.buyVolume} /></div>
                                    <div className={styles.statSub}>{formatPrice(analysis.totalBuyCoins)} coins</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Sell Volume</div>
                                    <div className={styles.statValue}><Number number={analysis.sellVolume} /></div>
                                    <div className={styles.statSub}>{formatPrice(analysis.totalSellCoins)} coins</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Orders</div>
                                    <div className={styles.statValue}>{analysis.buyOrderCount + analysis.sellOrderCount}</div>
                                    <div className={styles.statSub}>{analysis.buyOrderCount} sell / {analysis.sellOrderCount} buy</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Liquidity</div>
                                    <div className={styles.statValue} style={{ color: analysis.liquidityScore >= 60 ? '#28a745' : analysis.liquidityScore >= 40 ? '#b8860b' : '#dc3545' }}>
                                        {analysis.liquidityScore}/100
                                    </div>
                                    <div className={styles.statSub}>{analysis.liquidityLabel}</div>
                                </div>
                                {npcSellPrice !== null && npcSellPrice > 0 && (
                                    <div className={styles.statCard}>
                                        <div className={styles.statLabel}>NPC Sell Price</div>
                                        <div className={styles.statValue}>{formatPrice(npcSellPrice)}</div>
                                        <div className={styles.statSub} style={{ color: npcSellPrice > analysis.instaSellPrice ? '#28a745' : '#dc3545' }}>
                                            {npcSellPrice > analysis.instaSellPrice ? '▲ Above' : '▼ Below'} insta-sell
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.sectionsRow}>
                                {/* Market Depth Chart */}
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Market Depth</div>
                                    <ReactECharts
                                        option={getDepthChartOption()!}
                                        style={{ height: '220px' }}
                                        opts={{ renderer: 'svg' }}
                                    />
                                </div>

                                {/* Orderbook Imbalance */}
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Orderbook Imbalance</div>
                                    <div className={styles.imbalanceRow}>
                                        <div className={styles.imbalanceGauge}>
                                            <ReactECharts
                                                option={getImbalanceChartOption()!}
                                                style={{ height: '160px' }}
                                                opts={{ renderer: 'svg' }}
                                            />
                                        </div>
                                        <div className={styles.imbalanceBar}>
                                            <div className={styles.imbalanceLabel}>
                                                <span style={{ color: '#28a745' }}>Buy {(analysis.imbalanceRatio * 100).toFixed(0)}%</span>
                                                <span style={{ color: '#dc3545' }}>Sell {((1 - analysis.imbalanceRatio) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className={styles.barTrack}>
                                                <div
                                                    className={styles.barFill}
                                                    style={{
                                                        width: `${analysis.imbalanceRatio * 100}%`,
                                                        background: `linear-gradient(90deg, #28a745, ${imbalanceColor})`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.sectionsRow}>
                                {/* Whale Orders */}
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>
                                        Whale Orders
                                        <span className={styles.sectionBadge}>{analysis.whaleOrders.length}</span>
                                    </div>
                                    {analysis.whaleOrders.length > 0 ? (
                                        <div className={styles.whaleList}>
                                            {analysis.whaleOrders.map((w, i) => (
                                                <div key={i} className={styles.whaleRow}>
                                                    <span className={w.type === 'buy' ? styles.whaleBuy : styles.whaleSell}>
                                                        {w.type.toUpperCase()}
                                                    </span>
                                                    <span>{formatPrice(w.price)}</span>
                                                    <span><Number number={w.amount} /> items</span>
                                                    <span className={styles.whaleValue}>{formatPrice(w.coinValue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: '#888', textAlign: 'center' }}>No whale orders detected</p>
                                    )}
                                </div>

                                {/* Support & Resistance */}
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Support & Resistance</div>
                                    <div className={styles.srColumns}>
                                        <div>
                                            <div className={styles.srLabel} style={{ color: '#28a745' }}>Support (Buy Walls)</div>
                                            {analysis.supportLevels.length > 0 ? (
                                                analysis.supportLevels.map((l, i) => (
                                                    <div key={i} className={styles.srRow}>
                                                        <span>{formatPrice(l.price)}</span>
                                                        <span className={styles.srVol}><Number number={l.volume} /></span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ color: '#888', fontSize: '12px' }}>No clear support</p>
                                            )}
                                        </div>
                                        <div>
                                            <div className={styles.srLabel} style={{ color: '#dc3545' }}>Resistance (Sell Walls)</div>
                                            {analysis.resistanceLevels.length > 0 ? (
                                                analysis.resistanceLevels.map((l, i) => (
                                                    <div key={i} className={styles.srRow}>
                                                        <span>{formatPrice(l.price)}</span>
                                                        <span className={styles.srVol}><Number number={l.volume} /></span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ color: '#888', fontSize: '12px' }}>No clear resistance</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default BazaarAnalysis
