import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Minimize Flipping Taxes & Losses | Bazaar Fees, AH Tax, Price Crashes",
    "Master tax minimization: Bazaar 1.25%, AH 1%–2.5%, Derpy discount. Avoid price crashes, cancelled orders, scams. Use order strategy to beat fees."
);

export default function AvoidTaxesAndLossesPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to Avoid Common Flipping Taxes and Transfer Losses</CardTitle>
                            <CardText>
                                Every flip you make in Hypixel Skyblock comes with costs beyond just the purchase price. Understanding and minimizing these taxes and fees is essential to maintaining healthy profit margins.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Understanding Hypixel Taxes</CardTitle>
                            
                            <CardTitle as="h3" className="mt-3">Bazaar Tax (1.25%)</CardTitle>
                            <CardText>
                                Every item sold on the Bazaar is subject to a <strong>1.25% tax</strong> on the sell price. This is automatically deducted when you collect your coins from a sell order. This tax was reduced from 2.5% thanks to the Bazaar community upgrade.
                            </CardText>
                            <CardText>
                                <strong>Example:</strong> If you sell an item for 1,000,000 coins, you'll receive 987,500 coins (1.25% = 12,500 coins in tax).
                            </CardText>

                            <CardTitle as="h3" className="mt-3">Auction House Tax (Variable)</CardTitle>
                            <CardText>
                                The Auction House has a more complex tax structure that depends on the sell price:
                            </CardText>
                            <ul>
                                <li>Items selling for under 1M coins: <strong>1% + 500 coins</strong></li>
                                <li>Items selling for 1M - 10M coins: <strong>2%</strong></li>
                                <li>Items selling for over 10M coins: <strong>2.5%</strong></li>
                            </ul>
                            <CardText>
                                During <strong>Derpy Mayor</strong> events, Auction House taxes are reduced by 50%, making it a great time to flip high-value items.
                            </CardText>
                            <CardText>
                                Use the <strong>/cofl ahtax &lt;sellAmount&gt;</strong> command to calculate the exact tax for any sell amount. The command automatically accounts for Derpy's discount if active. See the <Link href="/wiki/docs/mod-commands#ahtaxcommand-alias-t">full command reference</Link>.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How to Minimize Tax Impact</CardTitle>

                            <CardTitle as="h3" className="mt-3">1. Always Calculate Net Profit</CardTitle>
                            <CardText>
                                Never look at the gross margin alone. Always factor in taxes before deciding if a flip is profitable.
                            </CardText>
                            <CardText>
                                <strong>Formula for Bazaar:</strong><br />
                                Net Profit = (Sell Price × 0.9875) - Buy Price
                            </CardText>
                            <CardText>
                                <strong>Formula for Auction House (over 10M):</strong><br />
                                Net Profit = (Sell Price × 0.975) - Buy Price
                            </CardText>
                            <CardText>
                                Our <Link href="/bazaar">Bazaar Flips</Link> and <Link href="/flipper">AH Flipper</Link> tools automatically calculate net profit after taxes, so you always see accurate profit estimates.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">2. Use Buy/Sell Orders Instead of Instant Transactions</CardTitle>
                            <CardText>
                                While using buy and sell orders doesn't reduce taxes, it dramatically improves your margins by getting better prices. The improved margins more than compensate for the tax:
                            </CardText>
                            <ul>
                                <li><strong>Don't instant buy:</strong> Place a buy order slightly above the current top buy order.</li>
                                <li><strong>Don't instant sell:</strong> Place a sell offer slightly below the current top sell offer.</li>
                            </ul>
                            <CardText>
                                This strategy alone can improve your margins by 5-15%, which far exceeds the 1.25% Bazaar tax.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">3. Take Advantage of Derpy Mayor</CardTitle>
                            <CardText>
                                When <strong>Derpy</strong> is mayor, Auction House fees are cut in half. This is the perfect time to flip high-value items (over 10M coins), as the tax drops from 2.5% to just 1.25%. Check our <Link href="/mayor">Mayor Flips</Link> page to see predicted price changes based on the current mayor.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">4. Choose the Right Marketplace</CardTitle>
                            <CardText>
                                For items available on both the Bazaar and Auction House, always calculate which platform will give you better net profit after taxes:
                            </CardText>
                            <ul>
                                <li>The Bazaar has a flat 1.25% tax, making it better for most commodity items.</li>
                                <li>The Auction House can be better for unique items (enchants, pets) where you can get a premium price that exceeds the higher tax.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Avoiding Transfer Losses</CardTitle>

                            <CardTitle as="h3" className="mt-3">1. Cancelled Orders</CardTitle>
                            <CardText>
                                If you cancel a Bazaar buy or sell order before it fills, you get your coins/items back with no penalty. However, you lose time and opportunity cost. To minimize cancelled orders:
                            </CardText>
                            <ul>
                                <li>Don't place orders too far from the current price—they may never fill.</li>
                                <li>Check volume estimates on our <Link href="/bazaar">Bazaar page</Link> to ensure the item has enough daily trades.</li>
                                <li>Use the SkyCofl Mod's automatic tracking to see average fill times for your orders.</li>
                            </ul>

                            <CardTitle as="h3" className="mt-3">2. Price Crashes During Holds</CardTitle>
                            <CardText>
                                The biggest transfer loss comes from buying an item and then having its price crash before you can sell it. To minimize this risk:
                            </CardText>
                            <ul>
                                <li>Flip high-volume, stable items rather than volatile ones.</li>
                                <li>Check our <Link href="/topMovers">Top Movers</Link> page or use <strong>/cofl bzmove</strong> to see recent price trends.</li>
                                <li>Set price alerts using <strong>/cofl reminder</strong> for items you're currently holding.</li>
                                <li>Don't hold items overnight unless you're confident in their stability.</li>
                            </ul>

                            <CardTitle as="h3" className="mt-3">3. Coin Transfers and Trading</CardTitle>
                            <CardText>
                                Direct player-to-player trades and coin transfers have no tax, but they carry significant risk of scams. Only trade directly with players you trust completely, and always use the official trade menu to verify items before accepting. See our <Link href="/guides/how-to-avoid-scams">scam prevention guide</Link> for more details.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Track Everything Automatically</CardTitle>
                            <CardText>
                                The <strong>SkyCofl Mod</strong> automatically tracks all your flips and calculates the exact profit after taxes. Use <strong>/cofl flips</strong> to review your flip history and see which items are actually profitable after all fees. The mod also tracks any losses from price crashes or cancelled orders, giving you a complete financial picture.
                            </CardText>
                            <CardText>
                                Learn more in our <Link href="/guides/tracking-profits-automatically">profit tracking guide</Link> and <Link href="/wiki/docs/mod-commands">mod commands reference</Link>.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Advanced: Profit calculation examples</CardTitle>

                            <CardTitle as="h3">Bazaar flip (high volume, low margin)</CardTitle>
                            <ul>
                                <li>Buy 64 × Sugar Cane @ 1,000 coins = 64,000 coins spent</li>
                                <li>Sell 64 × Sugar Cane @ 1,100 coins = 70,400 coins gross</li>
                                <li>Bazaar tax (1.25%): 70,400 × 0.0125 = 880 coins</li>
                                <li><strong>Net profit: 70,400 − 880 − 64,000 = 5,520 coins (8.6% net margin)</strong></li>
                                <li>Coins/flip: 5,520 (fast, maybe 20 min)</li>
                            </ul>

                            <CardTitle as="h3">Auction House flip (unique item, high margin)</CardTitle>
                            <ul>
                                <li>Buy rare pet @ 50M coins (mid-tier)</li>
                                <li>Sell rare pet @ 65M coins</li>
                                <li>AH tax (2.5% for &gt;10M): 65M × 0.025 = 1.625M coins</li>
                                <li><strong>Net profit: 65M − 1.625M − 50M = 13.375M (26.75% net margin)</strong></li>
                                <li>But holds 2–5 days (lower coins/hour)</li>
                            </ul>

                            <CardTitle as="h3">Derpy mayor advantage</CardTitle>
                            <ul>
                                <li><strong>Normal mayor:</strong> Sell @ 50M, tax 2.5% = 1.25M coins lost</li>
                                <li><strong>Derpy mayor:</strong> Sell @ 50M, tax 1.25% = 625k coins lost</li>
                                <li><strong>Savings: 625k per flip!</strong> Perfect time to offload high-value AH inventory.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Strategy: Beat the fees through order placement</CardTitle>

                            <CardTitle as="h3">Example: Standard instant-buy/sell (loses to fees)</CardTitle>
                            <ul>
                                <li>Instant buy @ 1,000 coins per unit (current market price)</li>
                                <li>Instant sell @ 1,100 coins per unit (current market price)</li>
                                <li>Gross margin: 10% = 100 coins per unit</li>
                                <li>Tax (1.25%): −12.5 coins per unit</li>
                                <li><strong>Net: 87.5 coins per unit = 8.75% net margin</strong></li>
                            </ul>

                            <CardTitle as="h3">Example: Smart order placement (beats fees)</CardTitle>
                            <ul>
                                <li>Place buy order @ 990 coins (1% below instant-buy wall)</li>
                                <li>Wait 10–20 min for fill</li>
                                <li>Place sell offer @ 1,120 coins (2% above instant-sell wall)</li>
                                <li>Wait 15–30 min for fill</li>
                                <li>Gross margin: 13% = 130 coins per unit</li>
                                <li>Tax (1.25%): −14.4 coins per unit</li>
                                <li><strong>Net: 115.6 coins per unit = 11.7% net margin</strong></li>
                                <li><strong>Improvement: +34% more profit than instant trades!</strong></li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Common flipping tax mistakes</CardTitle>

                            <CardTitle as="h3">❌ Mistake 1: Ignoring the 1.25% Bazaar fee</CardTitle>
                            <CardText>
                                <strong>Wrong thinking:</strong> "5% margin = 50k profit on 1M sale"
                                <br />
                                <strong>Correct thinking:</strong> "5% margin − 1.25% tax = 3.75% net = 37.5k profit on 1M sale"
                                <br />
                                <strong>Impact:</strong> Flipping "breakeven" items (2% margin) actually loses money after fees!
                            </CardText>

                            <CardTitle as="h3">❌ Mistake 2: Instant-buying + instant-selling (giving away 10%+ of margin)</CardTitle>
                            <CardText>
                                Using instant trades is convenient but expensive. You're paying the market's bid-ask spread on entry and exit.
                                <br />
                                <strong>Fix:</strong> Slow down. Place orders. Wait 10–30 min for fills. Capture the spread instead of losing it.
                            </CardText>

                            <CardTitle as="h3">❌ Mistake 3: Not comparing Bazaar vs AH taxes</CardTitle>
                            <CardText>
                                Example: selling an enchanted book
                                <br />
                                <strong>Bazaar (1.25% tax):</strong> Sell @ 1M, lose 12.5k
                                <br />
                                <strong>AH (1% + 500 for under 1M):</strong> Sell @ 1M, lose 10,500
                                <br />
                                <strong>AH is actually cheaper!</strong> But AH takes longer to sell.
                            </CardText>

                            <CardTitle as="h3">❌ Mistake 4: Holding during price crashes</CardTitle>
                            <CardText>
                                You bought sugar cane @ 1,000 with plan to sell @ 1,100. Then a new farming event makes sugar cane crash to 900.
                                <br />
                                <strong>Loss:</strong> −100 coins per unit + 1.25% tax on whatever you finally sell it for = −11.25 coins/unit minimum = −13.75 coins/unit total impact.
                                <br />
                                <strong>Prevention:</strong> Avoid holding during unknown events. Use <Link href="/topMovers">Top Movers</Link> to spot early crashes.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Tax optimization checklist</CardTitle>

                            <CardTitle as="h3">Before every flip, ask:</CardTitle>
                            <ul>
                                <li>☐ Have I calculated net profit after taxes? (Use our tools—they auto-calculate)</li>
                                <li>☐ Is my net margin above 2% (Bazaar) or 3% (AH)? If not, skip.</li>
                                <li>☐ Can I use buy/sell orders instead of instant? (Usually +5–10% profit)</li>
                                <li>☐ Is Derpy mayor active? (If yes and I'm doing AH, lock in sales now)</li>
                                <li>☐ Have I checked <Link href="/topMovers">Top Movers</Link>? (Avoid items with &gt;5% volatility in 24h)</li>
                                <li>☐ Will this item hold its value overnight? (If not, finish flip before log off)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">FAQ: Taxes and losses</CardTitle>

                            <CardTitle as="h3">Is the 1.25% Bazaar tax unavoidable?</CardTitle>
                            <CardText>
                                <strong>Almost. </strong>You can reduce from 1.25% to 1.125% by claiming orders manually via Mod, but it's marginal (0.125%). The primary way to "beat" taxes is through better order placement, which increases margins by 3–10%.
                            </CardText>

                            <CardTitle as="h3">When should I use Auction House despite higher taxes?</CardTitle>
                            <CardText>
                                When the margin opportunity exceeds the tax penalty.
                                <br />
                                <strong>Example:</strong> 50% AH margin (tax 2.5%) = 47.5% net &gt;&gt; 5% Bazaar margin (tax 1.25%) = 3.75% net
                                <br />
                                <strong>Rule:</strong> AH wins when margin &gt; 2× Bazaar available margin. At 5M+ capital, this flips.
                            </CardText>

                            <CardTitle as="h3">What's the biggest source of loss: taxes or price crashes?</CardTitle>
                            <CardText>
                                <strong>Price crashes.</strong> Taxes are 1–2.5%. Crashes can be 20–50%. Avoid volatility &gt;&gt; optimize taxes.
                            </CardText>

                            <CardTitle as="h3">If I cancel an order, do I lose money?</CardTitle>
                            <CardText>
                                <strong>No direct fee,</strong> but you lose opportunity cost (time + capital locked). Only cancel if item is tanking or order won't fill in reasonable time (&gt;1h).
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides</CardTitle>
                            <ul>
                                <li><Link href="/guides/how-to-flip">How to Flip</Link> — mechanics review</li>
                                <li><Link href="/guides/tracking-profits-automatically">Track Profits Automatically</Link> — SkyCofl Mod setup</li>
                                <li><Link href="/guides/how-to-avoid-scams">How to Avoid Scams</Link></li>
                                <li><Link href="/mayor">Mayor Flips</Link> — see mayor perks affecting prices</li>
                                <li><Link href="/topMovers">Top Movers</Link> — avoid volatile items</li>
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
