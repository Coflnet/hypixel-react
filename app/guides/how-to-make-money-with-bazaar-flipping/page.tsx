import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";
import BazaarLivePreview from "../../../components/Guides/BazaarLivePreview";

export const metadata: Metadata = getHeadMetadata(
    "How to Make Money with Bazaar Flipping in Hypixel SkyBlock | Strategy and Tools",
    "Actionable Hypixel SkyBlock Bazaar flipping guide: learn buy orders, sell offers, spread checks, volume analysis, fee optimization, capital management, item selection, SkyCofl tools, /cofl commands, and risk control."
,
    undefined,
    getCanonicalUrl('/guides/how-to-make-money-with-bazaar-flipping')
);

export default function HowToMakeMoneyWithBazaarFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to Make Money with Bazaar Flipping: Complete Profit Strategy</CardTitle>

                            <CardText>
                                <strong>Bazaar flipping is one of the fastest, most scalable money-making methods in Hypixel SkyBlock.</strong> The basic loop is simple: place buy orders below market, wait for players to fill them, then create sell offers above your entry price. This guide focuses on the parts that decide whether a flip is actually profitable: spread, volume, fees, turnover speed, capital allocation, and risk control.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">The Bazaar Flipping Formula: Buy Low, Sell High, Repeat</CardTitle>
                            <CardText>
                                The core concept is simple: exploit the spread (difference between buy and sell prices) by placing buy orders below market and selling above market. The math:
                            </CardText>
                            <ul>
                                <li><strong>Gross Spread:</strong> Sell Price - Buy Price = Raw Profit per Item</li>
                                <li><strong>Fees:</strong> (Buy + Sell) × 1.25% = Total Fee Cost</li>
                                <li><strong>Net Profit:</strong> Gross Spread - Fees = Actual Coins per Flip</li>
                                <li><strong>Profit Per Hour:</strong> (Net Profit × Flips Per Hour) = Your Coins/Hour Rate</li>
                            </ul>
                            <CardText className="mt-3">
                                Example: Buy 1000 Nether Wart for 50 coins each, sell for 52 coins each. Gross = 2000 coins. Fees (1.25% × 2) = ~1250 coins. Net profit = ~750 coins per 1000 items. If you do 10 flips per hour of 1000 items each, that's 7500 coins/hour net. Scale this to larger capital (50M) and you hit 50M+/hour.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Step 1: Quick Start — 5 Minutes to Your First Flip</CardTitle>
                            <ol>
                                <li><strong>Visit <Link href="/bazaar">Bazaar Flips</Link> tool.</strong> This page shows all Bazaar items sorted by profit potential. Start with items ranked 1-5.</li>
                                <li><strong>Check the spread.</strong> Look for spreads &gt; 3% (after fees). Ignore items below 500K daily volume.</li>
                                <li><strong>Place a buy order.</strong> In-game, open Bazaar, select the item, create a buy order 2-5% below the current buy price. Size it to 5-10% of your capital.</li>
                                <li><strong>Wait 1-48 hours.</strong> Let your order fill. Check back daily. If it doesn't fill in 7 days, cancel and adjust.</li>
                                <li><strong>Place a sell offer.</strong> Once your buy fills, place a sell offer at or just above the current sell price.</li>
                                <li><strong>Collect profit.</strong> Claim your sell order. Track the coins. Repeat.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Step 2: Optimize Capital & Turnover — Earn More Per Hour</CardTitle>
                            <CardText>
                                Flipping power scales with capital. But it's not just quantity—turnover (how many flips per day) matters more than individual flip size.
                            </CardText>
                            <ul>
                                <li><strong>Rookie (500K-5M):</strong> Flip 1-2 items daily. Pick ultra-liquid items (Mithril, Enchanted Cobblestone). Expect 50-500K per flip, 1-2 flips/day = 50-1M daily.</li>
                                <li><strong>Intermediate (5-50M):</strong> Flip 5-10 items simultaneously. Diversify across different item types. Track which items restock fastest. Expect 1-5M daily.</li>
                                <li><strong>Advanced (50M+):</strong> Flip 15-30+ items. Use SkyCofl data to identify trending markets. Adjust positions in real-time. Expect 5-50M+ daily.</li>
                            </ul>
                            <CardText className="mt-3">
                                Pro tip: Money made per hour = (Profit per Flip) × (Flips per Day) ÷ (Hours of Work). A 2% flip on 10M capital repeated 5 times = 1M profit. If it takes 15 min/day, that's 4M/hour. Focus on turnover, not individual flip size.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Step 3: Select High-Volume Items — The Difference Between Profit and Heartbreak</CardTitle>
                            <CardText>
                                This is where most beginners fail. They chase 20%+ spreads on illiquid items, then get stuck holding inventory for weeks. Here's the right approach:
                            </CardText>

                            <CardTitle as="h3">The Golden Rule: Turnover Beats Spread</CardTitle>
                            <ul>
                                <li><strong>High Volume (1M+ daily trades), Low Spread (2-3%):</strong> Ultra-liquid items like Mithril or Silicon. Your orders fill in hours. You flip 10-20x per week. At 2% per flip on 10M capital = 2M profit per week = 286K/day.</li>
                                <li><strong>Medium Volume (500K daily), Medium Spread (3-5%):</strong> Good items like Nether Wart. Orders fill in 1-3 days. You flip 5-10x per week. At 4% per flip = 2M per week = 286K/day.</li>
                                <li><strong>Low Volume (50K daily), High Spread (20%+):</strong> Dead items. Orders take weeks to fill. You flip once per month (if lucky). At 20% per flip = 200K per month = 6K/day. Trap.</li>
                            </ul>
                            <CardText className="mt-3">
                                Use the <Link href="/bazaar">Bazaar Flips</Link> page. Sort by "Volume," not "Spread." The top 20 items by volume are your safest bets.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Step 4: Master Bazaar Fees — Shaving Off Hidden Costs</CardTitle>
                            <CardText>
                                Bazaar fees silently eat into your profit. Understanding them is critical:
                            </CardText>
                            <ul>
                                <li><strong>Default Fee Rate:</strong> 1.25% per transaction (applied to buy AND sell).</li>
                                <li><strong>Total per Flip:</strong> 1.25% (buy) + 1.25% (sell) ≈ 2.5% total drag on profit.</li>
                                <li><strong>Reduced Fee (Manual Claim):</strong> If you claim an order manually instead of auto-collecting, fee drops to 1.125%. Savings: 0.125% per transaction.</li>
                                <li><strong>Real Impact:</strong> On 10M of capital flipped, you save 12.5K per flip by claiming manually (0.125% × 100M total transactions).</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Step 5: Data-Driven Item Selection — Use Tools, Not Gut Feeling</CardTitle>
                            <CardText>
                                Professional flippers use data, not intuition. If you want consistent Bazaar flipping profit, build each trade around live spread data, recent volume, price history, and a clear exit plan. Here's the toolkit:
                            </CardText>
                            <ul>
                                <li><strong><Link href="/bazaar">Bazaar Flips Tool</Link>:</strong> Sort by profit, volume, and spread. Compare 7-day history to spot trends. This is your primary research tool.</li>
                                <li><strong><Link href="/topMovers">Top Movers</Link>:</strong> See which items are trending up or down in price. Spot early shifts in demand and avoid items that are crashing.</li>
                                <li><strong><Link href="/crafts">Crafts Tool</Link>:</strong> Identify items that are inputs for recipes. Crafting demand often spikes, creating flip opportunities.</li>
                                <li><strong>SkyCofl Mod Commands:</strong> Use <code>/cofl bazaar itemname</code> for real-time in-game spread verification. Use <code>/cofl profit</code> to track all your flips automatically.</li>
                                <li><strong><Link href="/premiumBazaar">Premium Bazaar</Link>:</strong> For advanced players: demand-based flip rankings. Spot opportunities others miss.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Step 6: Risk Management — Protecting Your Capital</CardTitle>
                            <CardText>
                                Flipping carries risks. Prices can crash, items can lose demand, markets can shift overnight. Mitigate with:
                            </CardText>
                            <ul>
                                <li><strong>Position Sizing:</strong> Never put more than 25% of capital on a single item. Spread 10-20 items across your portfolio.</li>
                                <li><strong>Price Crash Detection:</strong> Check 7-day price history on any item before buying. If price crashed recently, avoid it.</li>
                                <li><strong>Volume Verification:</strong> A item shows 100M daily volume in history but none in the last 24h? That's a red flag. The market died.</li>
                                <li><strong>Stop-Loss Rules:</strong> If an item's price drops more than 5% from your buy price and volume dries up, sell at a small loss rather than hold and lose more.</li>
                                <li><strong>Event Awareness:</strong> Major SkyBlock events (new dungeons, crafting changes) can spike or crash prices. Reduce exposure during events.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Real-World Profit Example</CardTitle>
                            <CardText>
                                You start with 20M capital. You identify 5 good flip targets using the Bazaar page:
                            </CardText>
                            <ol>
                                <li>Nether Wart (4M capital): 3% spread, 500K daily volume. Buy orders fill in 1-2 days. 2 flips/week = 240K profit/week.</li>
                                <li>Mithril (3M capital): 2% spread, 1M daily volume. Fills in 12-24h. 5 flips/week = 300K profit/week.</li>
                                <li>Silicon (3M capital): 2.5% spread, 800K daily volume. Fills in 1-2 days. 3 flips/week = 225K profit/week.</li>
                                <li>Glowstone (4M capital): 3.5% spread, 300K daily volume. Fills in 3-5 days. 2 flips/week = 280K profit/week.</li>
                                <li>Diopside (3M capital): 2.8% spread, 600K daily volume. Fills in 1-2 days. 4 flips/week = 336K profit/week.</li>
                            </ol>
                            <CardText className="mt-3">
                                <strong>Total weekly profit: 240 + 300 + 225 + 280 + 336 = 1.38M per week = ~197K per day.</strong> That's 8.2M per month from 20M capital. Not instant riches, but sustainable and safe. Scale to 100M capital, and you're earning 40M+ per month passively.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Advanced Techniques for Scaling</CardTitle>

                            <CardTitle as="h3">1. Event Flipping</CardTitle>
                            <CardText>
                                When Hypixel announces new content (dungeons, crafting recipes, seasonal events), prices of relevant items spike. Savvy flippers frontload supply before announcements. Watch forums and Reddit for hints.
                            </CardText>

                            <CardTitle as="h3">2. Trend Riding</CardTitle>
                            <CardText>
                                Use <Link href="/topMovers">Top Movers</Link> to spot items trending upward over 7 days. Buy early, sell after price peaks. Requires timing but can yield 10-20% flips instead of 2-3%.
                            </CardText>

                            <CardTitle as="h3">3. Time-Based Flipping</CardTitle>
                            <CardText>
                                Prices fluctuate throughout the day and week. Many items are cheaper on weekends (less competitive supply). Buy weekends, sell weekdays for slight arbitrage.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Frequently Asked Questions</CardTitle>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">What's the minimum capital needed to start?</CardTitle>
                                    <CardText>
                                        Technically 100K-500K, but realistically 1-2M. With less, profit per flip is so small (a few thousand coins) that it takes months to scale. Start with 2-5M for meaningful progress.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">How many hours per day do I need to flip actively?</CardTitle>
                                    <CardText>
                                        Not many. Flipping is semi-passive. You can place buy orders and check in once per day (2 min). Or actively monitor and adjust throughout the day (1 hour = 10-20 flips). It scales from casual to hardcore depending on your effort.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">How long does it take to turn 1M into 100M?</CardTitle>
                                    <CardText>
                                        With consistent 10% daily ROI (which is very aggressive), about 3-4 months. Realistically, with 2-3% average returns and compounding, 6-12 months. Speed depends on hours invested, item selection, and capital management skill.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">Can I combine flipping with other money-making methods?</CardTitle>
                                    <CardText>
                                        Absolutely. Many players farm while their buy orders fill, or flip while doing dungeons (checking mobile app or periodic checks). Flipping is one of the most compatible methods because it's semi-passive.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">Should I use instant buy/sell or orders?</CardTitle>
                                    <CardText>
                                        Orders are 95% of the time better. You capture better prices. Instant trades are only useful for emergency exits (if prices crash suddenly) or ultra-high-volume day trading (requires 100M+ capital).
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">What's the difference between Bazaar and Auction House flipping?</CardTitle>
                                    <CardText>
                                        Bazaar: instant, low fees (1.25%), high volume. Auction House: 1-hour hold, higher fees (~2%), rarer items. Bazaar is better for scalable profit; AH is better for rare item arbitrage.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">How do I know if an item is a "trap" (dead/dying)?</CardTitle>
                                    <CardText>
                                        Check the Bazaar page history for that item. If volume was 1M daily 2 weeks ago but is now 10K, it's dying. Also: if spread is huge (20%+) but no one is buying, it's dead (not valuable, just illiquid).
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">Should I track every flip manually?</CardTitle>
                                    <CardText>
                                        Use the SkyCofl mod's <code>/cofl profit</code> command—it logs everything automatically. But manually track weekly reviews to spot trends: which items are consistently profitable? Which waste time? Adjust strategy accordingly.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <hr />

                            <CardTitle as="h3" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — real-time spreads sorted by profitability</li>
                                <li><Link href="/topMovers">Top Movers</Link> — trending items for event flipping</li>
                                <li><Link href="/flipper">Flipper Tool</Link> — advanced profit analysis</li>
                                <li><Link href="/premiumBazaar">Premium Bazaar</Link> — demand-based flip rankings</li>
                                <li><Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping</Link> — fundamentals</li>
                                <li><Link href="/guides/best-item-to-flip-right-now">Best Item to Flip Right Now</Link> — real-time picks</li>
                                <li><Link href="/guides/automating-flips">Automating Flips (Risks & Alternatives)</Link> — why not to use bots</li>
                            </ul>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}
