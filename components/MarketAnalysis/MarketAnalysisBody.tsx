'use client'
import { ReactNode, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import Link from 'next/link'
import { Alert, Button, Card, Col, Row, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import LockIcon from '@mui/icons-material/Lock'
import Number from '../Number/Number'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import type { LiveAnalysisStatus, LiveMarketAnalysisResult, LiveMarketTimeOnMarketBucket, SoldAnalysisResult, SoldAnalysisStatus } from '../../hooks/useMarketAnalysis'
import {
    formatSellTime,
    formatShortPrice,
    getRequiredPremiumLabel,
    getSellSpeedCategory,
    getSellSpeedThresholds,
    pluralize,
    utcHourToLocalHour,
    type MarketAnalysisDayOption,
    type SellSpeedCategory
} from './marketAnalysisUtils'
import type { SellSpeedBucket } from '../../api/_generated/skyApi.schemas'

const AXIS_LABEL_COLOR = 'rgba(255,255,255,0.75)'
const AXIS_LINE_COLOR = 'rgba(255,255,255,0.2)'
const SPLIT_LINE_COLOR = 'rgba(255,255,255,0.08)'
const VOLUME_COLOR = '#22A7F0'
const VOLUME_HIGHLIGHT_COLOR = '#f2c744'
const LIVE_COLOR = '#4B0082'

// echarts injects the tooltip as an absolutely positioned child of the chart's own container, which
// can otherwise sit below other section content in the stacking order; nudge it up via ECharts' own
// `extraCssText` tooltip option instead of a CSS rule, so this component needs no CSS file of its own.
const TOOLTIP_CSS = 'z-index: 18'

interface Props {
    days: number
    dayOptions: MarketAnalysisDayOption[]
    onDaysChange(days: number): void
    sold: { status: SoldAnalysisStatus; data?: SoldAnalysisResult; isSignedIn: boolean }
    live: { status: LiveAnalysisStatus; data?: LiveMarketAnalysisResult }
    onRetrySold(): void
}

function buildBarOption(opts: {
    categories: string[]
    values: number[]
    color: string
    highlightIndex?: number
    highlightColor?: string
    tooltipFormatter: (index: number) => string
}) {
    const rotate = opts.categories.length > 8
    return {
        // containLabel keeps the (possibly rotated) axis labels inside the chart's own box instead of
        // overflowing past it into whatever is rendered below - the grid shrinks to make room for them.
        grid: { left: 10, right: 15, top: 15, bottom: 5, containLabel: true },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            extraCssText: TOOLTIP_CSS,
            formatter: (params: any) => opts.tooltipFormatter(params[0]?.dataIndex ?? 0)
        },
        xAxis: {
            type: 'category',
            data: opts.categories,
            axisLabel: { color: AXIS_LABEL_COLOR, rotate: rotate ? 45 : 0, fontSize: 11, hideOverlap: true },
            axisLine: { lineStyle: { color: AXIS_LINE_COLOR } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: AXIS_LABEL_COLOR },
            splitLine: { lineStyle: { color: SPLIT_LINE_COLOR } }
        },
        series: [
            {
                type: 'bar',
                data: opts.values.map((v, i) => ({
                    value: v,
                    itemStyle: i === opts.highlightIndex ? { color: opts.highlightColor || opts.color } : { color: opts.color }
                })),
                barMaxWidth: 36
            }
        ]
    }
}

function KpiTile({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
    return (
        <Card className="h-100" data-testid={testId}>
            <Card.Body className="p-2">
                <div className="small text-muted text-truncate">{label}</div>
                <div className="fw-semibold text-nowrap">{value}</div>
            </Card.Body>
        </Card>
    )
}

interface KpiTileSpec {
    key: string
    label: string
    value: ReactNode
    testId?: string
}

/** Renders `tiles` two-per-row, so a narrow aside column stays readable even with 6-8 KPI tiles. */
function KpiTileGrid({ tiles }: { tiles: KpiTileSpec[] }) {
    return (
        <Row xs={2} className="g-2">
            {tiles.map(tile => (
                <Col key={tile.key}>
                    <KpiTile label={tile.label} value={tile.value} testId={tile.testId} />
                </Col>
            ))}
        </Row>
    )
}

function speedBorderClass(category: SellSpeedCategory): string {
    return category === 'fast' ? 'border-success' : category === 'medium' ? 'border-warning' : 'border-danger'
}

function SpeedLegend({ labels, referenceSeconds }: { labels: [string, string, string]; referenceSeconds: number }) {
    const thresholds = getSellSpeedThresholds(referenceSeconds)
    return (
        <div className="d-flex flex-wrap gap-2 small text-muted mb-2">
            <span className="d-inline-flex align-items-center gap-1">
                <span className="d-inline-block rounded-circle bg-success" style={{ width: 9, height: 9 }} />
                {labels[0]} {thresholds ? `(< ${formatSellTime(thresholds.fastBoundSeconds)})` : ''}
            </span>
            <span className="d-inline-flex align-items-center gap-1">
                <span className="d-inline-block rounded-circle bg-warning" style={{ width: 9, height: 9 }} />
                {labels[1]} {thresholds ? `(${formatSellTime(thresholds.fastBoundSeconds)} – ${formatSellTime(thresholds.slowBoundSeconds)})` : ''}
            </span>
            <span className="d-inline-flex align-items-center gap-1">
                <span className="d-inline-block rounded-circle bg-danger" style={{ width: 9, height: 9 }} />
                {labels[2]} {thresholds ? `(> ${formatSellTime(thresholds.slowBoundSeconds)})` : ''}
            </span>
        </div>
    )
}

function SpeedTiles({
    buckets,
    referenceSeconds,
    countSuffix,
    categoryTestKey
}: {
    buckets: (SellSpeedBucket | LiveMarketTimeOnMarketBucket)[]
    referenceSeconds: number
    countSuffix: string
    categoryTestKey: string
}) {
    const sorted = [...buckets].sort((a, b) => a.minPrice - b.minPrice)
    return (
        <div className="d-flex gap-2 overflow-auto pb-1">
            {sorted.map((bucket, i) => {
                const category = getSellSpeedCategory(bucket.avgSellTimeSeconds, referenceSeconds)
                return (
                    <Card
                        body
                        key={i}
                        className={`border-start border-4 ${speedBorderClass(category)} flex-shrink-0`}
                        style={{ minWidth: 110 }}
                        data-testid={categoryTestKey}
                        data-speed-category={category}
                    >
                        <div className="small fw-semibold text-nowrap">
                            {formatShortPrice(bucket.minPrice)} - {formatShortPrice(bucket.maxPrice)}
                        </div>
                        <div>{formatSellTime(bucket.avgSellTimeSeconds)}</div>
                        <div className="small text-muted">
                            {bucket.sampleCount} {countSuffix}
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

function PremiumGate({ days, isSignedIn }: { days: number; isSignedIn: boolean }) {
    const requiredLabel = getRequiredPremiumLabel(days)
    return (
        <Alert variant="warning" className="d-flex align-items-center flex-wrap gap-2 mb-0">
            <LockIcon fontSize="small" />
            <span>
                Analyzing {days} days of history requires <strong>{requiredLabel}</strong>.
            </span>
            {isSignedIn ? (
                <Link href={`/premium?tier=${requiredLabel === 'Premium' ? 'premium' : 'starter'}`}>
                    <Button size="sm" variant="warning">
                        Go to Premium
                    </Button>
                </Link>
            ) : (
                <GoogleSignIn />
            )}
        </Alert>
    )
}

function MarketAnalysisBody(props: Props) {
    const { sold, live } = props

    const volumeOption = useMemo(() => {
        const buckets = sold?.data?.volumeBuckets || []
        if (buckets.length === 0) return null
        const total = sold?.data?.totalSales || buckets.reduce((sum, b) => sum + b.count, 0)
        const highlightIndex = buckets.reduce((best, b, i, arr) => (b.count > arr[best].count ? i : best), 0)
        return buildBarOption({
            categories: buckets.map(b => formatShortPrice(b.minPrice)),
            values: buckets.map(b => b.count),
            color: VOLUME_COLOR,
            highlightIndex,
            highlightColor: VOLUME_HIGHLIGHT_COLOR,
            tooltipFormatter: index => {
                const b = buckets[index]
                const share = total > 0 ? ((b.count / total) * 100).toFixed(1) : '0.0'
                return `${formatShortPrice(b.minPrice)} - ${formatShortPrice(b.maxPrice)} Coins<br/>Sales: ${b.count} (${share}%)`
            }
        })
    }, [sold?.data])

    const hourlyOption = useMemo(() => {
        const breakdown = sold?.data?.hourlyBreakdown || []
        if (breakdown.length === 0) return null
        const byLocalHour = new Map<number, { count: number; avgPrice: number; avgSellTimeSeconds: number }>()
        breakdown.forEach(h => {
            byLocalHour.set(utcHourToLocalHour(h.hour), { count: h.count, avgPrice: h.avgPrice, avgSellTimeSeconds: h.avgSellTimeSeconds })
        })
        const hours = Array.from({ length: 24 }, (_, hour) => byLocalHour.get(hour) || { count: 0, avgPrice: 0, avgSellTimeSeconds: 0 })
        return buildBarOption({
            categories: Array.from({ length: 24 }, (_, hour) => `${hour}:00`),
            values: hours.map(h => h.count),
            color: VOLUME_COLOR,
            tooltipFormatter: index => {
                const h = hours[index]
                return `${index}:00 (your local time)<br/>Sales: ${h.count}${h.count > 0 ? `<br/>Avg price: ${formatShortPrice(h.avgPrice)} Coins<br/>Avg sell time: ${formatSellTime(h.avgSellTimeSeconds)}` : ''}`
            }
        })
    }, [sold?.data])

    const liveDistributionOption = useMemo(() => {
        const buckets = live?.data?.priceBuckets || []
        if (buckets.length === 0) return null
        const total = live?.data?.auctionCount || buckets.reduce((sum, b) => sum + b.count, 0)
        return buildBarOption({
            categories: buckets.map(b => formatShortPrice(b.minPrice)),
            values: buckets.map(b => b.count),
            color: LIVE_COLOR,
            tooltipFormatter: index => {
                const b = buckets[index]
                const share = total > 0 ? ((b.count / total) * 100).toFixed(1) : '0.0'
                return `${formatShortPrice(b.minPrice)} - ${formatShortPrice(b.maxPrice)} Coins<br/>Listings: ${b.count} (${share}%)`
            }
        })
    }, [live?.data])

    const soldKpiTiles = useMemo(() => {
        // Gated on `status === 'success'`, not just data truthiness: a non-200 response (premium
        // gate, invalid token, generic error) still comes back as `sold.data` (it's the error body,
        // e.g. `{ slug: 'premium_required' }') - reading numeric fields off that would throw.
        const data = sold.status === 'success' ? sold.data : undefined
        if (!data) return []
        const tiles: KpiTileSpec[] = [
            { key: 'median-price', label: 'Median price', value: <Number number={Math.round(data.medianPrice)} /> },
            { key: 'avg-sell-time', label: 'Avg sell time', value: formatSellTime(data.avgSellTimeSeconds) },
            { key: 'sales-per-day', label: 'Sales / day', value: data.salesPerDay.toFixed(1) },
            { key: 'bin-share', label: 'BIN share', value: `${data.binPercentage.toFixed(1)}%` },
            { key: 'price-volatility', label: 'Price volatility', value: `${(data.priceCoeffVariation * 100).toFixed(1)}%` },
            { key: 'total-sales', label: 'Total sales', value: <Number number={data.totalSales} /> }
        ]
        // uniqueBuyers/uniqueSellers aren't deployed on the backend yet - only show the tile once the
        // field actually comes back as a number, never as "0"/"undefined" for the current backend.
        if (typeof data.uniqueBuyers === 'number') {
            tiles.push({ key: 'buyers', label: 'Buyers', value: <Number number={data.uniqueBuyers} />, testId: 'market-analysis-buyers-tile' })
        }
        if (typeof data.uniqueSellers === 'number') {
            tiles.push({ key: 'sellers', label: 'Sellers', value: <Number number={data.uniqueSellers} />, testId: 'market-analysis-sellers-tile' })
        }
        return tiles
    }, [sold.status, sold.data])

    const liveKpiTiles = useMemo(() => {
        const data = live.status === 'success' ? live.data : undefined
        if (!data) return []
        const tiles: KpiTileSpec[] = [
            { key: 'lowest-bin', label: 'Lowest BIN', value: <Number number={Math.round(data.lowestBin)} /> },
            { key: 'median-bin', label: 'Median BIN', value: <Number number={Math.round(data.medianBin)} /> },
            { key: 'highest-bin', label: 'Highest BIN', value: <Number number={Math.round(data.highestBin)} /> }
        ]
        if (sold.status === 'success' && sold.data && sold.data.avgPrice > 0) {
            const diffPercent = ((data.lowestBin - sold.data.avgPrice) / sold.data.avgPrice) * 100
            tiles.push({
                key: 'vs-avg-sold',
                label: `vs ${props.days}d avg sold`,
                value: `${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(1)}%`
            })
        }
        return tiles
    }, [live.status, live.data, sold.status, sold.data, props.days])

    return (
        <div data-testid="market-analysis-body-content">
            <ToggleButtonGroup
                type="radio"
                name="market-analysis-period"
                value={props.days}
                onChange={(value: number) => props.onDaysChange(value)}
                className="flex-wrap mb-3"
                aria-label="Analysis period"
            >
                {props.dayOptions.map(option => (
                    <ToggleButton
                        key={option.days}
                        id={`market-analysis-period-toggle-${option.days}`}
                        value={option.days}
                        variant={props.days === option.days ? 'primary' : 'secondary'}
                        size="sm"
                        data-testid={`market-analysis-period-${option.days}`}
                    >
                        {option.label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            {sold.status === 'loading' ? (
                <div className="text-center py-4">{getLoadingElement(<p>Loading market analysis...</p>)}</div>
            ) : sold.status === 'error' ? (
                <Alert variant="danger" className="d-flex align-items-center flex-wrap gap-2 mb-0">
                    <span>Could not load the market analysis.</span>
                    <Button size="sm" variant="secondary" onClick={props.onRetrySold}>
                        Retry
                    </Button>
                </Alert>
            ) : sold.status === 'premium' ? (
                <PremiumGate days={props.days} isSignedIn={sold.isSignedIn} />
            ) : sold.status === 'empty' ? (
                <Alert variant="secondary" className="text-center mb-0">
                    Not enough sales in this period for an analysis.
                </Alert>
            ) : (
                sold.data && (
                    <div data-testid="market-analysis-sold">
                        <Row className="g-3 mb-3">
                            <Col xs={12} lg={4}>
                                <KpiTileGrid tiles={soldKpiTiles} />
                            </Col>
                            <Col xs={12} lg={8}>
                                {volumeOption && (
                                    <Card data-testid="market-analysis-volume-chart">
                                        <Card.Body>
                                            <Card.Title className="h6">Volume clustering</Card.Title>
                                            <ReactECharts option={volumeOption} style={{ height: 260 }} />
                                        </Card.Body>
                                    </Card>
                                )}
                            </Col>
                        </Row>

                        {sold.data.sellSpeedBuckets && sold.data.sellSpeedBuckets.length > 0 && (
                            <div className="mb-3">
                                <h6>Sell speed by price</h6>
                                <SpeedLegend labels={['Fast', 'Medium', 'Slow']} referenceSeconds={sold.data.avgSellTimeSeconds} />
                                <SpeedTiles
                                    buckets={sold.data.sellSpeedBuckets}
                                    referenceSeconds={sold.data.avgSellTimeSeconds}
                                    countSuffix="sold"
                                    categoryTestKey="market-analysis-sell-speed-tile"
                                />
                            </div>
                        )}

                        {hourlyOption && (
                            <Card className="mb-3" data-testid="market-analysis-hourly-chart">
                                <Card.Body>
                                    <Card.Title className="h6">Best time to sell</Card.Title>
                                    <div className="small text-muted mb-2">Hours are shown in your local time.</div>
                                    <ReactECharts option={hourlyOption} style={{ height: 180 }} />
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                )
            )}

            {live.status === 'success' && live.data && live.data.binCount > 0 && (
                <div className="mt-4 pt-3 border-top" data-testid="market-analysis-live">
                    <h6>Live market</h6>
                    <div className="small text-muted mb-3">
                        {pluralize(live.data.binCount, 'BIN')} &middot; {pluralize(live.data.auctionCount, 'auction')} &middot;{' '}
                        {pluralize(live.data.sellerCount, 'seller')}
                    </div>

                    <Row className="g-3 mb-3">
                        <Col xs={12} lg={4}>
                            <KpiTileGrid tiles={liveKpiTiles} />
                        </Col>
                        <Col xs={12} lg={8}>
                            {liveDistributionOption && (
                                <Card data-testid="market-analysis-live-distribution-chart">
                                    <Card.Body>
                                        <Card.Title className="h6">Live BIN price distribution</Card.Title>
                                        <ReactECharts option={liveDistributionOption} style={{ height: 260 }} />
                                        {live.data.aboveRangeCount > 0 && (
                                            <div className="small text-muted mt-1">
                                                {live.data.aboveRangeCount} listings above {formatShortPrice(live.data.bucketRangeMax)} not shown
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>

                    {live.data.timeOnMarketBuckets && live.data.timeOnMarketBuckets.length > 0 && (
                        <div className="mb-3">
                            <h6>Time on market by price</h6>
                            <SpeedLegend labels={['Fresh', 'Aging', 'Stale']} referenceSeconds={live.data.avgTimeOnMarketSeconds} />
                            <SpeedTiles
                                buckets={live.data.timeOnMarketBuckets}
                                referenceSeconds={live.data.avgTimeOnMarketSeconds}
                                countSuffix="live"
                                categoryTestKey="market-analysis-time-on-market-tile"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default MarketAnalysisBody
