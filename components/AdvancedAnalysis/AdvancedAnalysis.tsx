'use client'
import { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { getLoadingElement } from '../../utils/LoadingUtils'
import Number from '../Number/Number'
import Link from 'next/link'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { DateRange } from '../ItemPriceRange/ItemPriceRange'
import styles from './AdvancedAnalysis.module.css'

interface Props {
    tag: string
    itemFilter?: ItemFilter
    fetchspan?: DateRange
    onFilterChange?: (filter: ItemFilter) => void
}

const BASE_URL = 'https://sky.coflnet.com/api'

function fetchspanToDays(fetchspan?: DateRange): number {
    switch (fetchspan) {
        case DateRange.HOUR:
        case DateRange.DAY:
            return 1
        case DateRange.WEEK:
            return 7
        case DateRange.MONTH:
            return 30
        case DateRange.YEAR:
            return 365
        default:
            return 7
    }
}

function daysLabel(days: number): string {
    if (days <= 1) return '24h'
    if (days <= 7) return '7d'
    if (days <= 30) return '30d'
    return '1y'
}

async function fetchAnalysis(
    itemTag: string,
    days: number,
    itemFilter?: ItemFilter,
    signal?: AbortSignal
): Promise<AdvancedAnalysisResult> {
    const params = new URLSearchParams()
    params.append('days', String(days))
    if (itemFilter) {
        Object.entries(itemFilter).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value))
        })
    }
    const url = `${BASE_URL}/item/price/${itemTag}/analysis?${params.toString()}`

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (days > 7 && typeof window !== 'undefined') {
        const googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            headers['GoogleToken'] = googleId
        }
    }

    const res = await fetch(url, { method: 'GET', headers, signal })
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('PREMIUM_REQUIRED')
        throw new Error(`Analysis request failed: ${res.status}`)
    }
    const body = await res.text()
    return body ? JSON.parse(body) : { volumeBuckets: [], sellSpeedBuckets: [], totalSales: 0, avgSellTimeSeconds: 0, medianSellTimeSeconds: 0, avgPrice: 0, medianPrice: 0, minPrice: 0, maxPrice: 0, binPercentage: 0, salesPerDay: 0, hourlyBreakdown: [], priceStdDev: 0, priceCoeffVariation: 0, topSellers: [] }
}

function formatPrice(price: number): string {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}B`
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`
    if (price >= 1_000) return `${(price / 1_000).toFixed(1)}K`
    return price.toFixed(0)
}

function formatSellTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    if (seconds < 86400) {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.round((seconds % 3600) / 60)
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
    }
    const days = Math.floor(seconds / 86400)
    return `${days}d`
}

function speedCategoryClass(cat: string): string {
    switch (cat) {
        case 'FAST': return styles.speedFast
        case 'MED': return styles.speedMed
        case 'SLOW': return styles.speedSlow
        case 'VERY_SLOW': return styles.speedVerySlow
        default: return styles.speedSlow
    }
}

function speedCategoryLabel(cat: string): string {
    switch (cat) {
        case 'FAST': return 'FAST'
        case 'MED': return 'MED'
        case 'SLOW': return 'SLOW'
        case 'VERY_SLOW': return 'VERY SLOW'
        default: return cat
    }
}

function AdvancedAnalysis(props: Props) {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('advancedAnalysisCollapsed') === 'true'
        }
        return false
    })

    const days = useMemo(() => fetchspanToDays(props.fetchspan), [props.fetchspan])
    const isSignedIn = typeof window !== 'undefined' && !!sessionStorage.getItem('googleId')

    const filterKey = useMemo(() => {
        if (!props.itemFilter) return ''
        return Object.entries(props.itemFilter).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&')
    }, [props.itemFilter])

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['advancedAnalysis', props.tag, days, filterKey],
        queryFn: ({ signal }) => fetchAnalysis(props.tag, days, props.itemFilter, signal),
        retry: false,
        staleTime: days <= 1 ? 5 * 60 * 1000 : days <= 7 ? 30 * 60 * 1000 : 60 * 60 * 1000
    })

    function toggleCollapse() {
        setCollapsed(prev => {
            const next = !prev
            localStorage.setItem('advancedAnalysisCollapsed', String(next))
            return next
        })
    }

    function applyPriceRange(minPrice: number, maxPrice: number) {
        if (!props.onFilterChange) return
        const newFilter: ItemFilter = { ...(props.itemFilter || {}) }
        newFilter['HighestBid'] = `${Math.floor(minPrice)}-${Math.ceil(maxPrice)}`
        props.onFilterChange(newFilter)
    }

    const isPremiumError = error?.message === 'PREMIUM_REQUIRED'

    function getVolumeChartOption() {
        if (!data || data.volumeBuckets.length === 0) return null
        const maxCount = Math.max(...data.volumeBuckets.map(b => b.count))
        return {
            animation: false,
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    const d = params[0]
                    const bucket = data.volumeBuckets[d.dataIndex]
                    return `<b>~${formatPrice(bucket.avgPrice)}</b><br/>` +
                        `${bucket.count} Sales<br/>` +
                        `Range: ${formatPrice(bucket.minPrice)} – ${formatPrice(bucket.maxPrice)}<br/>` +
                        `<i>Click to filter</i>`
                }
            },
            grid: { left: 10, right: 10, top: 10, bottom: 30, containLabel: false },
            xAxis: {
                type: 'category',
                data: data.volumeBuckets.map(b => formatPrice(b.avgPrice)),
                axisLabel: { show: false },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#444' } }
            },
            yAxis: { type: 'value', show: false },
            series: [{
                type: 'bar',
                data: data.volumeBuckets.map(b => ({
                    value: b.count,
                    itemStyle: {
                        color: b.count === maxCount ? '#4ade80' : '#3b82f6',
                        borderRadius: [3, 3, 0, 0]
                    }
                })),
                barMaxWidth: 40,
                cursor: props.onFilterChange ? 'pointer' : 'default'
            }]
        }
    }

    function handleVolumeClick(params: any) {
        if (!data || params.dataIndex === undefined) return
        const bucket = data.volumeBuckets[params.dataIndex]
        if (bucket) applyPriceRange(bucket.minPrice, bucket.maxPrice)
    }

    const medianTime = data?.medianSellTimeSeconds ?? 0
    const speedLegendItems = medianTime > 0
        ? [
            { color: '#198754', label: `< ${formatSellTime(medianTime * 0.5)} FAST` },
            { color: '#b8860b', label: `< ${formatSellTime(medianTime)} MED` },
            { color: '#dc3545', label: `> ${formatSellTime(medianTime)} SLOW` }
          ]
        : [
            { color: '#198754', label: 'FAST' },
            { color: '#b8860b', label: 'MED' },
            { color: '#dc3545', label: 'SLOW' }
          ]

    function getHeatmapOption() {
        if (!data?.hourlyBreakdown?.length) return null
        const maxCount = Math.max(...data.hourlyBreakdown.map(h => h.count))
        return {
            animation: false,
            tooltip: {
                formatter: (params: any) => {
                    const h = data.hourlyBreakdown[params.dataIndex]
                    return `<b>${h.hour}:00 – ${h.hour}:59 UTC</b><br/>` +
                        `${h.count} sales<br/>` +
                        `Avg price: ${formatPrice(h.avgPrice)}<br/>` +
                        `Avg sell time: ${formatSellTime(h.avgSellTimeSeconds)}`
                }
            },
            grid: { left: 30, right: 10, top: 10, bottom: 24, containLabel: false },
            xAxis: {
                type: 'category',
                data: data.hourlyBreakdown.map(h => `${h.hour}`),
                axisLabel: { fontSize: 9, color: '#888', interval: 2 },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#444' } }
            },
            yAxis: { type: 'value', show: false },
            series: [{
                type: 'bar',
                data: data.hourlyBreakdown.map(h => ({
                    value: h.count,
                    itemStyle: {
                        color: maxCount > 0
                            ? `rgba(59, 130, 246, ${0.2 + 0.8 * (h.count / maxCount)})`
                            : '#3b82f6',
                        borderRadius: [2, 2, 0, 0]
                    }
                })),
                barMaxWidth: 16
            }]
        }
    }

    function getVolatilityLabel(): { label: string; color: string } {
        if (!data) return { label: '-', color: '#888' }
        const cv = data.priceCoeffVariation
        if (cv < 0.05) return { label: 'VERY LOW', color: '#198754' }
        if (cv < 0.15) return { label: 'LOW', color: '#28a745' }
        if (cv < 0.30) return { label: 'MODERATE', color: '#b8860b' }
        if (cv < 0.50) return { label: 'HIGH', color: '#dc3545' }
        return { label: 'VERY HIGH', color: '#8b0000' }
    }

    const premiumTier = days > 30 ? 'Premium' : 'Starter Premium'
    const premiumLink = days > 30 ? '/premium?tier=premium' : '/premium?tier=starter_premium'

    return (
        <div className={styles.container}>
            <div className={styles.header} onClick={toggleCollapse} style={{ cursor: 'pointer' }}>
                <div className={styles.headerTitle}>
                    <span className={styles.collapseIcon}>{collapsed ? '▶' : '▼'}</span>
                    <h3 style={{ margin: 0 }}>Advanced Analysis</h3>
                    <span className={styles.rangeBadge}>{daysLabel(days)}</span>
                </div>
            </div>

            {!collapsed && (
                <>
                    {isPremiumError ? (
                        <div className={styles.premiumLock}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
                            <h5 className="text-warning mb-2">{daysLabel(days)} analysis requires {premiumTier}</h5>
                            <p className="text-light mb-3" style={{ fontSize: '14px' }}>
                                1-day and 1-week analysis are free for everyone. Longer ranges require premium.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                {!isSignedIn ? (
                                    <GoogleSignIn onAfterLogin={() => refetch()} />
                                ) : (
                                    <Link href={premiumLink}>
                                        <button className="btn btn-sm btn-warning">Get {premiumTier}</button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            {getLoadingElement()}
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>
                            <p>Failed to load analysis data</p>
                            <button className="btn btn-sm btn-outline-light" onClick={() => refetch()}>Retry</button>
                        </div>
                    ) : data && data.totalSales > 0 ? (
                        <>
                            <div className={styles.statsRow}>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Total Sales</div>
                                    <div className={styles.statValue}><Number number={data.totalSales} /></div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Median Price</div>
                                    <div className={styles.statValue}>{formatPrice(data.medianPrice)}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Median Sell Time</div>
                                    <div className={styles.statValue}>{formatSellTime(data.medianSellTimeSeconds)}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Sales / Day</div>
                                    <div className={styles.statValue}>{data.salesPerDay.toFixed(1)}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>BIN %</div>
                                    <div className={styles.statValue}>{data.binPercentage.toFixed(1)}%</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>Price Range</div>
                                    <div className={styles.statValue}>{formatPrice(data.minPrice)} – {formatPrice(data.maxPrice)}</div>
                                </div>
                            </div>

                            <div className={styles.sectionsRow}>
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Volume Clustering</div>
                                    {data.volumeBuckets.length > 0 ? (
                                        <>
                                            <ReactECharts
                                                option={getVolumeChartOption()!}
                                                style={{ height: '180px' }}
                                                opts={{ renderer: 'svg' }}
                                                onEvents={{ click: handleVolumeClick }}
                                            />
                                            <div className={styles.xAxisLabel}>
                                                <span>{formatPrice(data.volumeBuckets[0].minPrice)}</span>
                                                <span style={{ color: '#888', fontSize: '10px' }}>Click a bar to filter</span>
                                                <span>{formatPrice(data.volumeBuckets[data.volumeBuckets.length - 1].maxPrice)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ color: '#888', textAlign: 'center' }}>Not enough data</p>
                                    )}
                                </div>

                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Sell Speed by Price</div>
                                    <div className={styles.speedLegend}>
                                        {speedLegendItems.map((item, i) => (
                                            <span key={i}>
                                                <span className={styles.legendDot} style={{ background: item.color }} /> {item.label}
                                            </span>
                                        ))}
                                    </div>
                                    {data.sellSpeedBuckets.length > 0 ? (
                                        <>
                                            <div className={styles.speedTable}>
                                                <div className={styles.speedGrid}>
                                                    {data.sellSpeedBuckets.map((bucket, i) => (
                                                        <div
                                                            key={i}
                                                            className={styles.speedColumn}
                                                            style={{ cursor: props.onFilterChange ? 'pointer' : 'default' }}
                                                            onClick={() => applyPriceRange(bucket.minPrice, bucket.maxPrice)}
                                                        >
                                                            <div className={styles.speedPrice}>{formatPrice(bucket.avgPrice)}</div>
                                                            <div className={`${styles.speedTime} ${speedCategoryClass(bucket.speedCategory)}`}>
                                                                {formatSellTime(bucket.avgSellTimeSeconds)}
                                                                <br />
                                                                <span style={{ fontSize: '9px', opacity: 0.85 }}>
                                                                    {speedCategoryLabel(bucket.speedCategory)}
                                                                </span>
                                                            </div>
                                                            <div className={styles.speedSamples}>{bucket.sampleCount}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={styles.xAxisLabel}>
                                                <span>{formatPrice(data.sellSpeedBuckets[0].minPrice)}</span>
                                                <span style={{ color: '#888', fontSize: '10px' }}>Click to filter</span>
                                                <span>{formatPrice(data.sellSpeedBuckets[data.sellSpeedBuckets.length - 1].maxPrice)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ color: '#888', textAlign: 'center' }}>Not enough data</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Heatmap + Volatility & Sellers */}
                            <div className={styles.sectionsRow}>
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Sales by Hour (UTC)</div>
                                    {data.hourlyBreakdown?.length > 0 ? (
                                        <ReactECharts
                                            option={getHeatmapOption()!}
                                            style={{ height: '140px' }}
                                            opts={{ renderer: 'svg' }}
                                        />
                                    ) : (
                                        <p style={{ color: '#888', textAlign: 'center' }}>Not enough data</p>
                                    )}
                                </div>

                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Price Volatility</div>
                                    <div className={styles.volatilityRow}>
                                        <div className={styles.volatilityMain}>
                                            <div className={styles.statLabel}>Std Deviation</div>
                                            <div className={styles.statValue}>{formatPrice(data.priceStdDev)}</div>
                                        </div>
                                        <div className={styles.volatilityMain}>
                                            <div className={styles.statLabel}>Coeff of Variation</div>
                                            <div className={styles.statValue}>{(data.priceCoeffVariation * 100).toFixed(1)}%</div>
                                        </div>
                                        <div className={styles.volatilityMain}>
                                            <div className={styles.statLabel}>Volatility</div>
                                            <div className={styles.statValue} style={{ color: getVolatilityLabel().color }}>
                                                {getVolatilityLabel().label}
                                            </div>
                                        </div>
                                    </div>
                                    {data.topSellers?.length > 0 && (
                                        <>
                                            <div className={styles.sectionTitle} style={{ marginTop: '12px' }}>Top Sellers</div>
                                            <div className={styles.sellerList}>
                                                {data.topSellers.map((s, i) => (
                                                    <div key={i} className={styles.sellerRow}>
                                                        <span className={styles.sellerRank}>#{i + 1}</span>
                                                        <div className={styles.sellerBar}>
                                                            <div
                                                                className={styles.sellerFill}
                                                                style={{ width: `${Math.min(s.percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={styles.sellerPct}>{s.percentage.toFixed(1)}%</span>
                                                        <span className={styles.sellerCount}>{s.count}</span>
                                                    </div>
                                                ))}
                                                <div className={styles.sellerConcentration}>
                                                    Top 5 control{' '}
                                                    <b>{data.topSellers.reduce((s, x) => s + x.percentage, 0).toFixed(1)}%</b> of sales
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                            <p>No analysis data available for this item with the current filters.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default AdvancedAnalysis
