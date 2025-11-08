import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "What is Bazaar Flipping in Hypixel Skyblock? Complete Beginner's Guide | Buy Low Sell High",
    "Complete guide to bazaar flipping explained: how bazaar works, spread calculation, margin optimization, item selection, capital requirements, profit strategies, risk management. Learn buy orders vs instant trading, SkyCofl tools, and FAQ for all skill levels."
);

export default function WhatIsBazaarFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">What is Bazaar Flipping in Hypixel Skyblock?</CardTitle>
                            <CardText>
                                <strong>Bazaar flipping is the practice of buying items low and selling them high on the Hypixel SkyBlock Bazaar to generate profit.</strong> Unlike flipping on the Auction House (which has a 1-hour hold), Bazaar flips are instant or near-instant, making them ideal for high-frequency trading. You profit from the spread: the difference between the buy price and sell price, minus transaction fees. It's the most scalable method to generate 10-50M coins per hour with minimal capital requirements (as low as 500K to start).
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How Bazaar Flipping Works: The Mechanics</CardTitle>
                            <CardText>
                                Every item on the Bazaar displays two market prices:
                            </CardText>
                            <ul>
                                <li><strong>Buy Price:</strong> The price others are willing to pay to purchase from you immediately (highest buy order)</li>
                                <li><strong>Sell Price:</strong> The price you must pay to purchase from others immediately (lowest sell offer)</li>
                                <li><strong>Spread:</strong> The difference between these two prices = your profit potential before fees</li>
                            </ul>
                            <CardText className="mt-3">
                                As a flipper, you create a <strong>buy order</strong> (offer to purchase at a price below market) and wait for sellers to accept. Once filled, you immediately create a <strong>sell offer</strong> (offer to sell above market) or use instant-sell. The spread minus fees is your profit. With leverage and proper volume selection, you can chain multiple flips daily.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Bazaar Fees and Profit Calculation</CardTitle>
                            <CardText>
                                Bazaar fees are crucial to understand:
                            </CardText>
                            <ul>
                                <li><strong>Default Fee Rate:</strong> 1.25% per transaction (buy and sell)</li>
                                <li><strong>Reduced Fee (Manual Claim):</strong> 1.125% when you claim the order manually</li>
                                <li><strong>Total Cost Per Flip:</strong> Approximately 2.25-2.5% (both buy and sell combined)</li>
                            </ul>
                            <CardText className="mt-3">
                                <strong>Example calculation:</strong> If you buy 1,000 coins worth of items and the spread is 10%, gross profit is 100 coins. After 2.5% fees (25 coins), net profit is 75 coins. Always check the spread &gt; fees before committing capital.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Two Main Bazaar Flipping Strategies</CardTitle>
                            
                            <CardTitle as="h3">1. Buy Orders (Recommended for Beginners)</CardTitle>
                            <CardText>
                                Place a buy order 5-10% below the current buy price. Wait for sellers to accept (hours to days depending on volume). Place a matching sell order at or above market. This strategy minimizes risk but requires patience and capital management.
                            </CardText>
                            <ul>
                                <li><strong>Pros:</strong> Better price control, lower immediate capital loss, better profit margins</li>
                                <li><strong>Cons:</strong> Longer wait times, capital locked up, requires volume validation</li>
                                <li><strong>Best for:</strong> 500K - 50M capital, items with 500K+ daily volume</li>
                            </ul>

                            <CardTitle as="h3">2. Instant Flips (Fast-Moving Items)</CardTitle>
                            <CardText>
                                Buy instantly at the current sell price, immediately sell at the current buy price. Profit from the existing spread without waiting. Higher risk but instant liquidity.
                            </CardText>
                            <ul>
                                <li><strong>Pros:</strong> Capital reuses multiple times daily, instant confirmation of profit</li>
                                <li><strong>Cons:</strong> Lower margins per flip, high-volume items only, market volatility risk</li>
                                <li><strong>Best for:</strong> 10M+ capital, ultra-liquid items (Enchanted Cobblestone, Mithril, Diopside)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Selecting Items to Flip: Volume vs. Margin</CardTitle>
                            <CardText>
                                The key to profitable flipping is choosing the right items. Most beginners chase huge margins on dead items—this is a trap.
                            </CardText>
                            <ul>
                                <li><strong>High Volume + Low Margin:</strong> 5-10% spreads, 500K-1M daily trades. Flip 5-10x per day = 25-50% total return on capital. Recommended.</li>
                                <li><strong>Low Volume + High Margin:</strong> 20%+ spreads, only 100-300 daily trades. Might flip once per week. Often traps sellers (indicating hidden problems).</li>
                                <li><strong>The Rule:</strong> Prefer 1-3% margins on 500K+ daily volume over 10%+ margins on 50K daily volume.</li>
                            </ul>
                            <CardText className="mt-3">
                                Use the <Link href="/bazaar">Bazaar Flips</Link> page to sort by volume and spread. Check <Link href="/topMovers">Top Movers</Link> to spot trending items. Use the SkyCofl mod command <code>/cofl bazaar</code> to verify real-time data on any item.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Starting Capital Requirements</CardTitle>
                            <CardText>
                                You can start with very little, but capital determines your profit speed:
                            </CardText>
                            <ul>
                                <li><strong>500K - 1M:</strong> Flip one ultra-liquid item (Enchanted Cobblestone, Mithril). Expect 50-100K/flip, 1-2 flips/day. (50-200K daily)</li>
                                <li><strong>5-10M:</strong> Flip 3-5 items simultaneously. Better diversification, faster capital reuse. (500K-2M daily)</li>
                                <li><strong>50M+:</strong> Flip 10-20 items, capture more margin opportunities. (2-10M daily)</li>
                                <li><strong>100M+:</strong> Endgame flipping with custom bots or professional tools. (10-50M daily)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Risk Management & Common Traps</CardTitle>
                            <CardText>
                                Bazaar flipping seems safe because you're trading only high-volume items, but there are risks:
                            </CardText>
                            <ul>
                                <li><strong>Price Crashes:</strong> Market events or updates can collapse item prices. Always cap your position size to 10-25% of capital per item.</li>
                                <li><strong>Illiquidity Traps:</strong> An item shows volume but fills very slowly. Wait times balloon. Verify by checking 7-day history on the Bazaar page.</li>
                                <li><strong>Over-Leveraging:</strong> Placing buy orders for 50% of your capital on one item. If prices move against you, you're stuck. Diversify.</li>
                                <li><strong>Ignoring Fees:</strong> A 2% spread looks good until you realize 2.5% goes to fees. Always confirm spread &gt; 3% minimum.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Tools & Workflow for Successful Flipping</CardTitle>
                            <CardText>
                                Modern flipping requires data. Here's the recommended toolset:
                            </CardText>
                            <ul>
                                <li><strong><Link href="/bazaar">Bazaar Flips Tool</Link>:</strong> Sort spreads by profit, volume, and trend. Filter by your capital size. Start here.</li>
                                <li><strong><Link href="/topMovers">Top Movers</Link>:</strong> See which items are trending up/down in price. Spot early momentum shifts.</li>
                                <li><strong>SkyCofl Mod:</strong> Run <code>/cofl bazaar itemname</code> to verify spread, volume, and 7-day history in-game. Trust only live data.</li>
                                <li><strong>Spreadsheet Tracking:</strong> Log each flip (item, buy price, sell price, profit, time held). Review weekly for patterns and improvements.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Daily Routine for Flippers</CardTitle>
                            <CardText>
                                Even casual flippers benefit from structure:
                            </CardText>
                            <ol>
                                <li><strong>Morning (5 min):</strong> Check Bazaar Flips page. Verify top 3 items haven't crashed overnight. Adjust buy orders if needed.</li>
                                <li><strong>Midday (2 min):</strong> Quick check: are my buy orders filling? Any sell orders to place?</li>
                                <li><strong>Evening (10 min):</strong> Close out old flips. Review profit/loss. Pick 2-3 new items for tomorrow.</li>
                                <li><strong>Weekly (30 min):</strong> Analyze which items were most profitable. Identify patterns. Adjust strategy.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Frequently Asked Questions</CardTitle>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">What's the difference between Bazaar flipping and Auction House flipping?</CardTitle>
                                    <CardText>
                                        Bazaar is instant (buy/sell within seconds), low fees (1.25%), and better for high-volume items. Auction House requires 1-hour holds, higher fees (~2%), and works for rare items. Bazaar flipping is 5-10x faster and more scalable.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">How much profit can I realistically make per flip?</CardTitle>
                                    <CardText>
                                        On ultra-liquid items (1M+ daily volume): 1-2% per flip after fees. On medium items (500K volume): 2-5%. On slower items: 5-15%. Never chase single flips; focus on chaining 5-10 flips daily. A 2% flip on 10M capital, repeated 5x daily = 1M/day.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">How long should I hold a buy order before canceling?</CardTitle>
                                    <CardText>
                                        For high-volume items, 1-2 days is normal. For medium-volume items, 3-5 days. If an order hasn't filled in 7 days on an item with 500K+ daily volume, cancel and retry. You likely placed it too low, or the item lost liquidity.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">What items should beginners flip?</CardTitle>
                                    <CardText>
                                        Start with Enchanted Cobblestone, Mithril, or Diopside (1-2M daily volume, 1-3% spreads). Graduate to Nether Wart, Glowstone, or Silicon once you have 5M+ capital and understand order timing. Avoid anything below 500K daily volume until you're experienced.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">Is Bazaar flipping faster than farming or slaying?</CardTitle>
                                    <CardText>
                                        Yes. Farming is 2-8M/hr, slaying is 12-25M/hr. Bazaar flipping with good capital (50M+) can hit 15-50M/hr through chaining flips. But the ceiling is higher: bots and professionals can sustain 50-100M+/hr. It's less click-intensive than slaying though.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">Can I use bots or macros to automate flipping?</CardTitle>
                                    <CardText>
                                        No. Automation violates Hypixel ToS and risks a ban. The SkyCofl mod is safe (manual use only). Use spreadsheets to track flips and the Bazaar page to find opportunities, but place all orders yourself. Keep humans in control.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">What's the best way to track my flips?</CardTitle>
                                    <CardText>
                                        Create a simple Google Sheet: columns for Item, Buy Price, Sell Price, Profit, Date Started, Date Ended, ROI%. Update it after each flip. After 50 flips, review: which items were most profitable? Which wasted time? Adjust your item selection based on data.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">How do I avoid losing money on a bad flip?</CardTitle>
                                    <CardText>
                                        Always verify: (1) Spread &gt; 3% after fees, (2) Volume &gt; 500K daily, (3) Price hasn't crashed in last 7 days (check history), (4) Size your position to max 25% of capital. If price drops, hold or accept the loss. Never panic-sell at a loss; that locks it in.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">Can I combine Bazaar flipping with other money-making methods?</CardTitle>
                                    <CardText>
                                        Absolutely. Many players farm while their buy orders fill in the background. You can also flip while doing dungeons (afk bazaar monitoring) or minions auto-generate coins. Flipping is passive-friendly compared to slaying or boss farming.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mb-3">
                                <CardBody>
                                    <CardTitle as="h5">What's the most common mistake beginners make?</CardTitle>
                                    <CardText>
                                        Chasing volume on dead items: "This item trades 100M daily so it must be good!" Dead items have large spreads because no one wants them. Focus instead on trending items with decent volume (500K+). Quality &gt; quantity. Also: over-leveraging. Don't put 50% of capital on one flip.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <CardTitle as="h3" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — live spreads and volume sorted by profitability</li>
                                <li><Link href="/topMovers">Top Movers</Link> — items with biggest 24h price changes</li>
                                <li><Link href="/flipper">Flipper Tool</Link> — advanced profit analysis</li>
                                <li><Link href="/guides/how-to-flip">How to Flip (step-by-step)</Link> — detailed flipping mechanics</li>
                                <li><Link href="/guides/how-to-make-money-with-bazaar-flipping">How to Make Money with Bazaar Flipping</Link> — profit optimization</li>
                                <li><Link href="/guides/best-item-to-flip-right-now">Best Item to Flip Right Now</Link> — real-time recommendations</li>
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
