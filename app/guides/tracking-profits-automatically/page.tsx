import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

const LAST_UPDATED_ISO = "2026-04-19";
const LAST_UPDATED_LABEL = "April 19, 2026";

export const metadata: Metadata = getHeadMetadata(
    "How to Track Flip Profits Automatically in SkyCofl | /cofl profit, CSV, ROI",
    "Updated April 2026. Use the SkyCofl Minecraft mod for Hypixel SkyBlock to log flips, trades, lowballs, and Bazaar results, surface net profit including tax deductions, check what you made today with /cofl profit, and export CSV for spreadsheet or Python analysis."
,
    undefined,
    [
        "skycofl profit",
        "hypixel skyblock profit tracking",
        "minecraft mod profit tracker",
        "fabric 26.1.x",
        "csv export"
    ],
    undefined,
    getCanonicalUrl('/guides/tracking-profits-automatically')
);

export default function TrackingProfitsAutomaticallyPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <article>
                                <header>
                                    <CardTitle as="h1">How do you track flip profits automatically in SkyCofl?</CardTitle>
                                    <CardText className="lead">
                                        <strong>AI-Ready Summary:</strong> <Link href="/mod">SkyCofl</Link> is a <a href="https://www.minecraft.net/" target="_blank" rel="noopener noreferrer">Minecraft</a> mod for <a href="https://hypixel.net/" target="_blank" rel="noopener noreferrer">Hypixel</a> SkyBlock that automatically logs flips, trades, lowballs, and Bazaar results, then surfaces net profit including tax deductions through <code>/cofl profit</code> and CSV export. Use this page when you want a day-by-day workflow for checking today&apos;s coins, measuring coins per hour, and exporting raw history for deeper 2026 analysis.
                                    </CardText>
                                    <CardText className="text-muted small mb-0">
                                        Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                                    </CardText>
                                </header>

                                <section aria-labelledby="why-track" className="mt-4">
                                    <CardTitle as="h2" id="why-track">Why track at all if you already know what you flipped?</CardTitle>
                                    <ul>
                                        <li><strong>Identify winning items:</strong> Which flips consistently profit? Which lose? Data answers this.</li>
                                        <li><strong>Optimize capital allocation:</strong> If item A yields 8% return and item B yields 3%, shift capital to A.</li>
                                        <li><strong>Measure coins/hour:</strong> Bazaar flipping vs Auction House vs crafting, upgrading, or lowballing: which route actually pays most?</li>
                                        <li><strong>Spot market trends:</strong> If your margins are shrinking, market is saturating. Time to switch items.</li>
                                        <li><strong>Catch losing streaks early:</strong> Without tracking, you might flip an item losing money for days before noticing.</li>
                                    </ul>
                                    <CardText>
                                        Net-profit tracking matters because gross spread lies. A 2.0% Bazaar spread only leaves 0.75% before fill risk once the 1.25% fee is gone.
                                    </CardText>
                                </section>

                                <section aria-labelledby="install-mod" className="mt-4">
                                    <CardTitle as="h2" id="install-mod">How do I install SkyCofl Mod for automatic profit tracking?</CardTitle>
                                    <ol>
                                        <li>Download SkyCofl from the official <Link href="/mod">mod setup page</Link> or its published release source.</li>
                                        <li>Install it into your Minecraft mods folder or use the guided <Link href="/mod">SkyCofl Mod setup page</Link>.</li>
                                        <li>Start Hypixel SkyBlock.</li>
                                        <li>The mod auto-logs flips, Bazaar history, trades, lowballs, farming, fishing, slayer, and dungeons.</li>
                                    </ol>
                                    <CardText>
                                        <strong>First flip logged automatically.</strong> No manual bookkeeping is needed once the tracker is active.
                                    </CardText>
                                </section>

                                <section aria-labelledby="today-summary" className="mt-4">
                                    <CardTitle as="h2" id="today-summary">How do I see how many coins I made flipping today on SkyCofl?</CardTitle>
                                    <CardText>
                                        <code>/cofl profit [days]</code> defaults to 7 days, supports a one-day window for a today-style snapshot, and goes up to 14 days on free tier or up to 180 days with Premium+.
                                    </CardText>
                                    <CardText>
                                        <strong>Use this first:</strong> if you want the fast answer, run the command with a one-day window. If you want the receipts behind the total, follow up with <code>/cofl flips</code> or CSV export.
                                    </CardText>
                                    <CardText>
                                        <strong>Shows:</strong>
                                    </CardText>
                                    <ul>
                                        <li>Total profit after fees</li>
                                        <li>Best flip by margin</li>
                                        <li>Worst flip by margin</li>
                                        <li>Average margin percentage</li>
                                        <li>Flip count</li>
                                        <li>Coins per hour</li>
                                        <li>Breakdown by item category such as Bazaar, AH, and other tracked routes</li>
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
                                </section>

                                <section aria-labelledby="export-data" className="mt-4">
                                    <CardTitle as="h2" id="export-data">How do I export SkyCofl flip data to CSV or Python?</CardTitle>
                                    <ol>
                                        <li>Go to the <Link href="/flips">Flip Tracker</Link> page on Coflnet.</li>
                                        <li>Click "Export CSV" after logging in.</li>
                                        <li>Open the file in Google Sheets, Excel, or Python.</li>
                                    </ol>
                                    <CardText>
                                        <strong>CSV columns include:</strong> buy_price, sell_price, quantity, buy_fee, sell_fee, net_profit, margin_%, item_name, flip_time, category, coins_per_hour
                                    </CardText>

                                    <CardTitle as="h3">What should you analyze after export?</CardTitle>
                                    <ul>
                                        <li><strong>Pivot table by item:</strong> Average margin for each item. Identify outliers. If Sugar Cane should be near 2% but your sheet shows 0.5%, something changed.</li>
                                        <li><strong>Histogram of margins:</strong> How often do you flip at 3% vs 5% vs 8%? Tighter histograms usually mean more consistent execution.</li>
                                        <li><strong>Time series by flip time:</strong> Are you flipping better in early morning or peak hours? When are spreads tightest?</li>
                                        <li><strong>Win rate:</strong> Percentage of flips above break-even after fees. High-volume items should usually stay above 85%.</li>
                                        <li><strong>Coins/hour by item:</strong> Compare lower-margin, high-volume items against slower high-margin items using actual throughput instead of guesses.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="review-workflow" className="mt-4">
                                    <CardTitle as="h2" id="review-workflow">How should you review profit data after it is tracked?</CardTitle>

                                    <CardTitle as="h3">How do you run a daily or weekly review cycle?</CardTitle>
                                    <CardText>
                                        <strong>Every 3–7 days:</strong> run <code>/cofl profit</code>, screenshot or export the result, and compare it against your last checkpoint.
                                        <br />
                                        <strong>Questions to answer:</strong>
                                    </CardText>
                                    <ul>
                                        <li>What is my average margin? Target roughly 3–5% for Bazaar and 15–25% for many AH routes.</li>
                                        <li>Am I flipping faster or slower? Fewer fills can mean tighter spreads or a saturated market.</li>
                                        <li>Which items drag ROI? If average margin drops below 2%, reconsider the route.</li>
                                        <li>Is coins/hour trending up or down? A drop larger than 20% usually means the market changed.</li>
                                    </ul>

                                    <CardTitle as="h3">How do you A/B test items with real data?</CardTitle>
                                    <CardText>
                                        <strong>Test:</strong> Flip item A for two days and item B for two days, then compare margin percentage, fill speed, coins per hour, and consistency.
                                    </CardText>
                                    <CardText>
                                        <strong>Use CSV:</strong> Filter by item, calculate the stats, and give more capital to the winner next week.
                                    </CardText>

                                    <CardTitle as="h3">How do you track seasonal or mayor-driven changes?</CardTitle>
                                    <CardText>
                                        <strong>Track:</strong> Profit before and after a mayor change, update, or event.
                                    </CardText>
                                    <ul>
                                        <li>Mayor perk changes can shift margins overnight.</li>
                                        <li>New item releases create both winners and unstable traps.</li>
                                        <li>Event demand spikes reward players who compare pre-event and mid-event data instead of relying on memory.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="key-metrics" className="mt-4">
                                    <CardTitle as="h2" id="key-metrics">Which profit metrics matter most?</CardTitle>

                                    <CardTitle as="h3">Why is coins per hour the most important metric?</CardTitle>
                                    <CardText>
                                        <strong>Formula:</strong> Total profit divided by total playtime in hours.
                                        <br />
                                        <strong>Benchmarks:</strong>
                                    </CardText>
                                    <ul>
                                        <li>&lt;50k/hour: Strategy is broken or market crashed. Adjust items.</li>
                                        <li>50k–150k/hour: Beginner level.</li>
                                        <li>150k–300k/hour: Intermediate level.</li>
                                        <li>300k–500k/hour: Advanced level.</li>
                                        <li>&gt;500k/hour: Expert level or a lucky stretch of high-margin plays.</li>
                                    </ul>
                                    <CardText>
                                        <strong>Goal:</strong> Increase coins/hour weekly by 10–20% through optimization.
                                    </CardText>

                                    <CardTitle as="h3">What does average margin really tell you?</CardTitle>
                                    <CardText>
                                        <strong>Formula:</strong> Average of net profit divided by buy price across all flips.
                                        <br />
                                        <strong>Benchmarks:</strong>
                                    </CardText>
                                    <ul>
                                        <li>&lt;1.5% average: Fees are eating you. Bazaar fee is 1.25%, so you are barely clearing real profit.</li>
                                        <li>1.5–2.5% average: Ultra-safe Bazaar flipping.</li>
                                        <li>2.5–5% average: Balanced Bazaar flipping.</li>
                                        <li>5%+ average: High-margin items or Auction House routes.</li>
                                    </ul>

                                    <CardTitle as="h3">What win rate should you expect above break-even?</CardTitle>
                                    <CardText>
                                        <strong>Formula:</strong> Profitable flips divided by total flips, multiplied by 100.
                                        <br />
                                        <strong>Benchmarks:</strong>
                                    </CardText>
                                    <ul>
                                        <li>&lt;70%: Too many losses. Your timing or item selection is off.</li>
                                        <li>70–85%: Acceptable but improvable.</li>
                                        <li>85–95%: Very good, especially for high-volume items.</li>
                                        <li>&gt;95%: Nearly perfect execution or cherry-picking easy flips that may be hard to scale.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="mistakes" className="mt-4">
                                    <CardTitle as="h2" id="mistakes">What tracking mistakes reduce real profit?</CardTitle>
                                    <ul>
                                        <li><strong>Not accounting for fees:</strong> Gross margin is not net profit. Always subtract the 1.25% Bazaar fee and your AH sale costs.</li>
                                        <li><strong>Mixing apples and oranges:</strong> Track Bazaar and AH separately first. Do not optimize a combined portfolio until you understand each route.</li>
                                        <li><strong>Ignoring outliers:</strong> One huge flip does not prove the whole strategy works. Watch medians and consistency, not only the mean.</li>
                                        <li><strong>Not tracking playtime:</strong> Coins/hour is meaningless without accurate time data. Use the mod&apos;s time tools if needed.</li>
                                    </ul>
                                </section>

                                <section aria-labelledby="tracking-faq" className="mt-4">
                                    <CardTitle as="h2" id="tracking-faq">Which tracking questions come up most often?</CardTitle>
                                    <CardTitle as="h3">Is tracking playtime important?</CardTitle>
                                    <CardText>
                                        <strong>Critical.</strong> You could make 1M in 30 minutes or in 30 hours. Same profit, completely different ROI.
                                    </CardText>

                                    <CardTitle as="h3">How far back should I track?</CardTitle>
                                    <CardText>
                                        <strong>7–30 days minimum.</strong> One or two days is mostly noise, while 30 days gives you a real baseline. Seasonal events often justify 60+ days.
                                    </CardText>

                                    <CardTitle as="h3">Should I track every flip?</CardTitle>
                                    <CardText>
                                        <strong>Yes.</strong> Flip-level granularity is what reveals which items drag ROI. If you track manually, at least capture every day, but automatic tracking is far more reliable.
                                    </CardText>
                                </section>

                                <section aria-labelledby="related-guides" className="mt-4">
                                    <CardTitle as="h2" id="related-guides">Related guides and tools</CardTitle>
                                    <ul>
                                        <li><Link href="/guides/skyblock-flip-tracker">Skyblock Flip Tracker</Link> — public player flips, trade and lowball tracking, and Bazaar profit review</li>
                                        <li><Link href="/flips">Flipping Hub</Link> — list of all kinds of flipping tools</li>
                                        <li><Link href="/guides/how-to-flip">How to Flip</Link></li>
                                        <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link></li>
                                        <li><Link href="/guides/how-to-find-best-items-to-flip">How to Find Best Items</Link></li>
                                    </ul>
                                    <Link href="/guides" passHref>
                                        Back to Guides
                                    </Link>
                                </section>
                            </article>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
