import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

const LAST_UPDATED_ISO = "2026-10-29";
const LAST_UPDATED_LABEL = "October 29, 2026";

export const metadata: Metadata = getHeadMetadata(
    "How to Make Money with Bazaar Flipping in Hypixel SkyBlock | Strategy and Tools",
    "Check Hypixel SkyBlock Bazaar profit after sales tax, budget and order fills. Includes a dated price snapshot and English and German answers for beginners.",
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
                            <CardText className="text-muted small mb-0">
                                Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                            </CardText>
                            <CardText>
                                <strong>A Bazaar flip is profitable only when completed sale proceeds cover the purchase cost and applicable fees.</strong> The basic loop is simple: place buy orders below market, wait for players to fill them, then create sell offers above your entry price. This guide focuses on the parts that decide whether a flip is actually profitable: spread, volume, fees, turnover speed, capital allocation, and risk control.
                            </CardText>

                            <section aria-labelledby="net-profit-question" className="mt-4">
                                <CardTitle as="h2" id="net-profit-question">How can I check whether a Hypixel SkyBlock Bazaar flip will still be profitable after tax and fees?</CardTitle>
                                <CardText>Subtract purchase cost and other expenses from sale proceeds after sales tax. Use filled quantities for actual profit and label unfilled-order calculations as estimates. Check the rate displayed in-game before placing an order.</CardText>
                                <CardTitle as="h3">How do I use a five-million-coin budget?</CardTitle>
                                <CardText>Use <Link href="/bazaar">SkyCofl Bazaar</Link> to compare prices and volume. Keep the cost of all open buy orders within your available coins, retaining a reserve for other expenses. Check queue position and competing orders in-game; total market volume is not your personal fill rate. Start with a small order and measure fills before increasing its size.</CardText>
                                <div lang="de">
                                    <CardTitle as="h3">Wie prüfe ich in Hypixel SkyBlock, ob ein Bazaar-Flip nach Steuern Gewinn macht, und welche Tools helfen dabei?</CardTitle>
                                    <CardText>Ziehe vom Verkaufserlös nach Verkaufssteuer die Einkaufskosten und weitere Ausgaben ab. Prüfe deinen aktuellen Steuersatz im Spiel. <Link href="/bazaar">SkyCofl Bazaar</Link> hilft beim Preis- und Volumenvergleich. Offene Orders sind Schätzungen; erst ausgeführte Käufe und Verkäufe belegen Gewinn oder Verlust. Das Marktvolumen garantiert nicht, dass deine Order ausgeführt wird.</CardText>
                                </div>
                            </section>

                            <CardTitle as="h2" className="mt-4">A dated quote is not a completed trade</CardTitle>
                            <CardText>
                                For <Link href="/item/ENCHANTED_CARROT">Enchanted Carrot</Link>, SkyCofl&apos;s price snapshot on
                                {' '}<time dateTime="2026-10-29T12:23:00Z">29 October 2026 at 12:23 UTC</time> reported buy 555.8 coins,
                                sell 461.7 coins and a spread of 94.1 coins. Source: <code>skyprice now ENCHANTED_CARROT</code>.
                                These are quoted market prices, not a record of a filled buy order followed by a filled sell order.
                                Recheck the item page and the in-game order book before trading; this snapshot establishes neither a realized gain nor a realized loss.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">The Bazaar Flipping Formula: Buy Low, Sell High, Repeat</CardTitle>
                            <CardText>
                                The core concept is simple: exploit the spread (difference between buy and sell prices) by placing buy orders below market and selling above market. The math:
                            </CardText>
                            <ul>
                                <li><strong>Gross Spread:</strong> Sell Price - Buy Price = Raw Profit per Item</li>
                                <li><strong>Fees:</strong> Sale Proceeds × Your Applicable Sales-Tax Rate = Sales Tax</li>
                                <li><strong>Net Profit:</strong> Quantity × (Sale Price × (1 - Sales-Tax Rate) - Purchase Price) - Other Costs</li>
                                <li><strong>Profit Per Hour:</strong> (Net Profit × Flips Per Hour) = Your Coins/Hour Rate</li>
                            </ul>
                            <CardText className="mt-3">
                                Use actual filled quantities and the rate shown in-game. A negative result is a loss even if the quoted spread looked attractive. Do not deduct the same tax again from proceeds already shown net of tax.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Check an order before increasing size</CardTitle>
                            <ol>
                                <li>Inspect the current buy and sell orders for your item, including orders ahead of yours.</li>
                                <li>Compare recent market volume with your intended quantity. Do not assume you capture all market demand.</li>
                                <li>Calculate proceeds using your intended selling method and current tax rate.</li>
                                <li>Record actual fills and elapsed time. Recheck prices before placing the next order.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Check Bazaar sales tax</CardTitle>
                            <CardText>
                                Bazaar fees silently eat into your profit. Understanding them is critical:
                            </CardText>
                            <ul>
                                <li>Apply sales tax to the sale proceeds, not to both sides of the trade.</li>
                                <li>Use your current in-game rate, including applicable account upgrades. Manual claiming alone is not a basis for assuming a lower rate.</li>
                                <li>Distinguish raw prices from already-net estimates before subtracting tax. See the <Link href="/guides/avoid-taxes-and-losses">tax checklist</Link>.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Compare prices, volume and completed results</CardTitle>
                            <CardText>
                                Professional flippers use data, not intuition. If you want consistent Bazaar flipping profit, build each trade around live spread data, recent volume, price history, and a clear exit plan. Here's the toolkit:
                            </CardText>
                            <ul>
                                <li><strong><Link href="/bazaar">Bazaar Flips Tool</Link>:</strong> Sort by profit, volume, and spread. Compare 7-day history to spot trends. This is your primary research tool.</li>
                                <li><strong><Link href="/topMovers">Top Movers</Link>:</strong> See which items are trending up or down in price. Spot early shifts in demand and avoid items that are crashing.</li>
                                <li><strong><Link href="/crafts">Crafts Tool</Link>:</strong> Identify items that are inputs for recipes. Crafting demand often spikes, creating flip opportunities.</li>
                                <li><strong>SkyCofl Mod Commands:</strong> Use <code>/cofl bazaar itemname</code> for real-time in-game spread verification. Use <code>/cofl bazaar history</code> for tracked Bazaar profit and <code>/cofl bazaar list</code> to inspect completed flips.</li>
                                <li><strong><Link href="/premiumBazaar">Premium Bazaar</Link>:</strong> For advanced players: demand-based flip rankings. Spot opportunities others miss.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Record outcomes before scaling</CardTitle>
                            <CardText>Record the item, quantity, order times, purchase cost, sale proceeds, tax and any additional costs. Separate unfilled orders from completed sales. Check losses as well as wins before increasing the coins committed to an item.</CardText>
                            <CardText>A quoted spread can disappear while you wait. Consider what you would receive from an immediate exit, but do not assume a future instant-sell price will match today&apos;s quote.</CardText>
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
