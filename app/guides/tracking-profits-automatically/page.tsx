import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Track Flip Profits Automatically | SkyCofl Mod + CSV Export",
    "Use SkyCofl Mod to log all flips, calculate coins/hour, track margins, and export CSV for analysis. From raw data to strategic optimization."
);

export default function TrackingProfitsAutomaticallyPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Track flip profits automatically — the short answer</CardTitle>
                            <CardText>
                                Use <strong>SkyCofl Mod</strong> to auto-log every flip (buy/sell, margins, fees). Export CSV for spreadsheet analysis. Review with <strong>/cofl profit</strong> command (shows ROI, best/worst flips, 7–180 days). Target: identify which items/strategies yield highest coins/hour. Manually tracking is slow + error-prone; automation reveals optimization opportunities instantly.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Why track at all? (ROI data drives strategy)</CardTitle>
                            <ul>
                                <li><strong>Identify winning items:</strong> Which flips consistently profit? Which lose? Data answers this.</li>
                                <li><strong>Optimize capital allocation:</strong> If item A yields 8% return and item B yields 3%, shift capital to A.</li>
                                <li><strong>Measure coins/hour:</strong> Bazaar flipping vs Auction House vs Crafting—which actually pays most?</li>
                                <li><strong>Spot market trends:</strong> If your margins are shrinking, market is saturating. Time to switch items.</li>
                                <li><strong>Catch losing streaks early:</strong> Without tracking, you might flip an item losing money for days before noticing.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Step 1: Install SkyCofl Mod</CardTitle>
                            <ol>
                                <li>Download SkyCofl from <strong>GitHub / mod repositories</strong> (search "SkyCofl Mod")</li>
                                <li>Install into your Minecraft mods folder</li>
                                <li>Start Hypixel SkyBlock</li>
                                <li>Mod auto-logs all flips, trades, farming, fishing, slayer, dungeons</li>
                            </ol>
                            <CardText>
                                <strong>First flip logged automatically.</strong> No setup needed. Just flip as normal.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Step 2: Use in-game /cofl profit command</CardTitle>
                            <CardText>
                                <strong>/cofl profit [days]</strong> (default: 7 days, max: 180 with premium)
                            </CardText>
                            <CardText>
                                <strong>Shows:</strong>
                            </CardText>
                            <ul>
                                <li>Total profit (after fees)</li>
                                <li>Best flip (highest margin)</li>
                                <li>Worst flip (lowest margin)</li>
                                <li>Average margin %</li>
                                <li>Flip count</li>
                                <li>Coins per hour</li>
                                <li>Breakdown by item category (Bazaar, AH, Crafts, etc.)</li>
                            </ul>
                            <CardText>
                                <strong>Example output:</strong>
                            </CardText>
                            <CardText className="ms-3">
                                7-day profit: 2.5M coins
                                <br />
                                Best flip: Sugar Cane +15k (3.2%)
                                <br />
                                Worst flip: Bone -5k (-1.1%)
                                <br />
                                Average margin: 2.1%
                                <br />
                                Flips: 142
                                <br />
                                Coins/hour: 300k
                                <br />
                                Bazaar: 2.3M | AH: 200k | Crafts: 0
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Step 3: Export CSV for deep analysis</CardTitle>
                            <ol>
                                <li>Go to <Link href="/flips">Flip Tracker</Link> page on Coflnet</li>
                                <li>Click "Export CSV" (requires login)</li>
                                <li>Open in Google Sheets, Excel, or Python</li>
                            </ol>
                            <CardText>
                                <strong>CSV columns include:</strong> buy_price, sell_price, quantity, buy_fee, sell_fee, net_profit, margin_%, item_name, flip_time, category, coins_per_hour
                            </CardText>

                            <CardTitle as="h3">Analysis examples (in spreadsheet)</CardTitle>
                            <ul>
                                <li><strong>Pivot table by item:</strong> Average margin for each item. Identify outliers (Sugar Cane should be ~2%, if it's 0.5%, something's wrong).</li>
                                <li><strong>Histogram of margins:</strong> How often do you flip at 3% vs 5% vs 8%? Tighter histogram = more consistent strategy.</li>
                                <li><strong>Time series (flip time vs margin):</strong> Are you flipping better in early morning or peak hours? When is spreads tightest?</li>
                                <li><strong>Win rate:</strong> % of flips above break-even (after fees). Should be 85%+ for high-volume items.</li>
                                <li><strong>Coins/hour by item:</strong> Sugar Cane @ 20 flips/day with 2% margin vs Bone @ 5 flips/day with 4% margin—which pays better per hour?</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Advanced tracking strategies</CardTitle>

                            <CardTitle as="h3">Strategy 1: Daily/Weekly tracking discipline</CardTitle>
                            <CardText>
                                <strong>Every 3–7 days:</strong> Run /cofl profit, screenshot results, track in personal log.
                                <br />
                                <strong>Questions to answer:</strong>
                            </CardText>
                            <ul>
                                <li>What's my average margin? (Target: 3–5% for Bazaar, 15–25% for AH)</li>
                                <li>Am I flipping faster/slower? (Fewer flips = tighter spreads or market saturation)</li>
                                <li>Which items are drag on ROI? (If avg margin &lt;2%, drop that item)</li>
                                <li>Coins/hour trending up or down? (If down &gt;20%, market changed—adjust strategy)</li>
                            </ul>

                            <CardTitle as="h3">Strategy 2: A/B testing items</CardTitle>
                            <CardText>
                                <strong>Test:</strong> Flip item A (2 days) vs item B (2 days). Compare:
                            </CardText>
                            <ul>
                                <li>Margin %</li>
                                <li>Fill speed (avg time buy order to fill)</li>
                                <li>Coins/hour</li>
                                <li>Flip consistency (std dev of margins)</li>
                            </ul>
                            <CardText>
                                <strong>Use CSV:</strong> Filter by item, calculate stats. Winner gets 60% of capital next week.
                            </CardText>

                            <CardTitle as="h3">Strategy 3: Seasonal/event tracking</CardTitle>
                            <CardText>
                                <strong>Track:</strong> Profit before/after mayor change, update, or event.
                            </CardText>
                            <ul>
                                <li>Mayor perk changes &gt; market shifts. Track how margins changed.</li>
                                <li>New item release &gt; winners and losers. Which flips now unstable?</li>
                                <li>Double XP event &gt; certain items spike. Pre-event low prices, during-event high prices = easy flip setup.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Interpreting key metrics</CardTitle>

                            <CardTitle as="h3">Coins/hour (most important metric)</CardTitle>
                            <CardText>
                                <strong>Formula:</strong> (Total profit / Total playtime in hours)
                                <br />
                                <strong>Benchmarks:</strong>
                            </CardText>
                            <ul>
                                <li>&lt;50k/hour: Strategy is broken or market crashed. Adjust items.</li>
                                <li>50k–150k/hour: Beginner level (ok, but room to optimize)</li>
                                <li>150k–300k/hour: Intermediate level (good, consistent margins)</li>
                                <li>300k–500k/hour: Advanced level (excellent item selection)</li>
                                <li>&gt;500k/hour: Expert level (or got lucky with high-margin plays)</li>
                            </ul>
                            <CardText>
                                <strong>Goal:</strong> Increase coins/hour weekly by 10–20% through optimization.
                            </CardText>

                            <CardTitle as="h3">Average margin %</CardTitle>
                            <CardText>
                                <strong>Formula:</strong> Average of (net profit / buy price) for all flips
                                <br />
                                <strong>Benchmarks:</strong>
                            </CardText>
                            <ul>
                                <li>&lt;1.5% avg: Fees are eating you. Bazaar fee is 1.25%; you're barely breaking even. Pick higher-spread items.</li>
                                <li>1.5–2.5% avg: Ultra-safe Bazaar flipping (good for beginners)</li>
                                <li>2.5–5% avg: Balanced Bazaar flipping (good for intermediate)</li>
                                <li>5%+ avg: Either high-margin items or AH flipping (good for advanced)</li>
                            </ul>

                            <CardTitle as="h3">Win rate (% flips above break-even)</CardTitle>
                            <CardText>
                                <strong>Formula:</strong> (Profitable flips / Total flips) × 100
                                <br />
                                <strong>Benchmarks:</strong>
                            </CardText>
                            <ul>
                                <li>&lt;70%: Too many losses. Market is wrong, or you're buying at peaks and selling at troughs. Adjust timing.</li>
                                <li>70–85%: Acceptable but room for improvement.</li>
                                <li>85–95%: Very good (high-volume items typically hit this).</li>
                                <li>&gt;95%: Nearly perfect execution or cherry-picking easy flips (may indicate low volume = harder to scale).</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Common tracking mistakes</CardTitle>
                            <ul>
                                <li>❌ <strong>Not accounting for fees:</strong> Gross margin ≠ net profit. Always subtract 1.25% Bazaar fee (1% AH). Mod does this, but spreadsheets won't auto-calculate.</li>
                                <li>❌ <strong>Mixing apples and oranges:</strong> Track Bazaar and AH separately first. Once you have 10M+ capital, combine. Don't optimize total portfolio until you isolate each strategy's ROI.</li>
                                <li>❌ <strong>Ignoring outliers:</strong> One 50% margin flip doesn't mean your strategy suddenly works. Track median, not just mean.</li>
                                <li>❌ <strong>Not tracking playtime:</strong> Coins/hour is meaningless without accurate playtime. Use mod's /cofl time command.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">FAQ: Tracking edition</CardTitle>
                            <CardTitle as="h3">Is tracking playtime important?</CardTitle>
                            <CardText>
                                <strong>Critical.</strong> You could make 1M in 30 mins (awesome) or 30 hours (terrible). Same profit, wildly different ROI. Always measure coins/hour.
                            </CardText>

                            <CardTitle as="h3">How far back should I track?</CardTitle>
                            <CardText>
                                <strong>7–30 days minimum.</strong> 1–2 days is noise (single bad day skews everything). 30 days = stable baseline. Seasonal events (mayor changes) = 60+ days.
                            </CardText>

                            <CardTitle as="h3">Should I track every flip?</CardTitle>
                            <CardText>
                                <strong>Yes.</strong> SkyCofl does this auto-magically. If manually tracking (ugh), at least log daily totals. Flip-level granularity helps identify which items drag ROI.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/flips">Flip Tracker</Link> — view all tracked flips, export CSV</li>
                                <li><Link href="/guides/how-to-flip">How to Flip</Link></li>
                                <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link></li>
                                <li><Link href="/guides/how-to-find-best-items-to-flip">How to Find Best Items</Link></li>
                            </ul>
                            <Link href="/guides" passHref>
                                Back to Guides
                            </Link>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
