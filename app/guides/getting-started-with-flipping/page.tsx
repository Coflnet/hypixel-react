import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Getting Started with Flipping | Hypixel SkyBlock Beginner Guide",
    "Start flipping in Hypixel SkyBlock in under 1 hour. Learn how to flip with low capital, step-by-step workflows, and quick wins for beginners.",
    undefined,
    [],
    undefined,
    getCanonicalUrl('/guides/getting-started-with-flipping')
);

export default function GettingStartedWithFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Get Started with Flipping?</CardTitle>
                            <CardText>
                                Start with low-risk, high-volume Bazaar items, use buy orders (not instant-buy), and flip 3–5 items at once to spread risk. With 500k–2M coins you can make your first profitable flip in under an hour. The site's <Link href="/bazaar">Bazaar Flips</Link> page will show you the safest starting items sorted by volume.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">Quick start (first flip in 30–60 min)</CardTitle>
                            <ol>
                                <li>Open <Link href="/bazaar">Bazaar Flips</Link> and sort by "Volume ⇩" — pick 3 top items you can afford.</li>
                                <li>Place buy orders slightly below the buy wall (3–10% below instant-buy price).</li>
                                <li>Wait 5–30 minutes for fills (check back or use the SkyCofl mod for alerts).</li>
                                <li>Place sell offers at or near the sell wall — avoid instant-sell unless the margin is very tight.</li>
                                <li>Track profit for 24 hours and adjust sizing if you see losses &gt;3% of capital.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Core principles for beginners</CardTitle>
                            <CardTitle as="h3">1. Volume beats margin (for your first 10 flips)</CardTitle>
                            <CardText>
                                High-volume items move fast, reducing risk of overnight price crashes. A safe 2–5% margin on an item trading 50k+ units/day is better than a 40% margin on something that sells once a week. Volume = faster turnover = faster reinvestment = compounding growth.
                            </CardText>

                            <CardTitle as="h3">2. Start small, scale gradually</CardTitle>
                            <CardText>
                                Beginners should risk max 10–15% of total capital per flip. Example: with 1M coins, flip items worth 100k–150k each across 3–5 different items. As you gain confidence and see consistent profit, increase sizing to 20–30% per flip.
                            </CardText>

                            <CardTitle as="h3">3. Use buy/sell orders, not instant trades</CardTitle>
                            <CardText>
                                Instant-buy and instant-sell eat most of your margin due to fees and spreads. Buy orders let you buy cheaper, and sell offers let you sell higher. Be patient — most orders fill within an hour during peak times.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Advanced tips</CardTitle>
                            <ul>
                                <li>
                                    <strong>Check <Link href="/topMovers">Top Movers</Link></strong> before flipping — avoid items with sudden 20%+ price swings (sign of manipulation or events).
                                </li>
                                <li>
                                    <strong>Diversify across 5–10 items:</strong> Spreading risk minimizes single-item losses. If one flip tanks, the others buffer your portfolio.
                                </li>
                                <li>
                                    <strong>Reinvest profits daily:</strong> Compound growth is exponential. Flipping 1M → 1.05M → 1.1M daily scales much faster than hoarding profits.
                                </li>
                                <li>
                                    <strong>Use the SkyCofl Mod</strong> for in-game flip alerts and order tracking (<strong>/cofl bazaar</strong> command).
                                </li>
                                <li>
                                    <strong>Account for fees:</strong> Bazaar fee is 1.25% (reducible to 1.125% when claiming). The site's profit estimates already factor this in.
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Frequently Asked Questions</CardTitle>
                            <CardTitle as="h3">How much capital do I need to start?</CardTitle>
                            <CardText>
                                <strong>Minimum:</strong> 200k–500k for very small flips.
                                <br />
                                <strong>Comfortable start:</strong> 1M–3M lets you diversify and flip mid-tier items with good volume.
                                <br />
                                You can bootstrap from zero using minions, farming, or NPC flipping to build initial capital.
                            </CardText>

                            <CardTitle as="h3">How long until I see profit?</CardTitle>
                            <CardText>
                                First flip: 30–90 minutes (buy order fill + sell offer fill).
                                <br />
                                Consistent daily profit: 3–7 days once you learn item patterns and refine your picks.
                            </CardText>

                            <CardTitle as="h3">What if my orders don't fill?</CardTitle>
                            <CardText>
                                Buy orders: increase your price slightly (1–3%) to match the buy wall.
                                <br />
                                Sell orders: lower your price slightly (1–3%) to match the sell wall or instant-sell if you need capital fast.
                                <br />
                                Check <Link href="/topMovers">Top Movers</Link> — if the item had a sudden price crash, cancel and move capital elsewhere.
                            </CardText>

                            <CardTitle as="h3">Should I flip Auction House (AH) or Bazaar first?</CardTitle>
                            <CardText>
                                <strong>Bazaar first.</strong> It's faster, more liquid, and easier to test. AH flipping has higher margins but requires deeper item knowledge and patience for auctions to end.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — live data sorted by profit and volume</li>
                                <li><Link href="/topMovers">Top Movers</Link> — biggest 24h price changes</li>
                                <li><Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping?</Link></li>
                                <li><Link href="/guides/how-to-flip">How to Flip (step-by-step)</Link></li>
                                <li><Link href="/guides/how-to-start-flipping-with-no-money">How to Start Flipping with No Money</Link></li>
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
