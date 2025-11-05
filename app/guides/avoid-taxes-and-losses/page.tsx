import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Avoid Flipping Taxes and Transfer Losses | Hypixel Skyblock",
    "Learn how to minimize taxes and transfer losses when flipping items in Hypixel Skyblock to maximize your profits."
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

                            <hr />
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
