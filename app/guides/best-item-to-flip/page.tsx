import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "What's the Best Item to Flip? | Characteristics & Selection Criteria",
    "Learn what makes a good flip: margin %, volume, stability, competition. Use data-driven criteria to find best items vs chasing hype.",
    undefined,
    [],
    undefined,
    getCanonicalUrl('/guides/best-item-to-flip')
);

export default function BestItemToFlipPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">What's the best item to flip — the short answer</CardTitle>
                            <CardText>
                                No "best" item exists universally—it changes daily. Use <Link href="/bazaar">Bazaar Flips</Link> sorted by Volume ⇩ for beginners (pick top 3 items with 10k+ units/day + 3–8% margin). Use Spread ⇩ for intermediate (find 5–10% margins with stable volume). Avoid items with &lt;1k daily volume or &gt;20% spreads (likely manipulation). Best items = high volume + stable price + moderate margin.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">The ideal flip scorecard</CardTitle>
                            <CardText>
                                <strong>Rate each candidate on these criteria:</strong>
                            </CardText>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Criterion</th>
                                        <th>Ideal for Beginners</th>
                                        <th>Ideal for Intermediate</th>
                                        <th>Ideal for Advanced</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Daily Volume</strong></td>
                                        <td>20k+ units</td>
                                        <td>5k–15k units</td>
                                        <td>1k–5k units</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Margin %</strong></td>
                                        <td>2–5%</td>
                                        <td>5–12%</td>
                                        <td>15–50%</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Volatility (24h swing)</strong></td>
                                        <td>&lt;3%</td>
                                        <td>&lt;5%</td>
                                        <td>&lt;10%</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Buy wall depth</strong></td>
                                        <td>&gt;20% daily volume</td>
                                        <td>&gt;10% daily volume</td>
                                        <td>&gt;5% daily volume</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Sell wall depth</strong></td>
                                        <td>&gt;20% daily volume</td>
                                        <td>&gt;10% daily volume</td>
                                        <td>&gt;5% daily volume</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Price history</strong></td>
                                        <td>Flat for 30 days</td>
                                        <td>Stable for 14 days</td>
                                        <td>Any trend, understand why</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">Checklist: Is this item worth flipping?</CardTitle>
                            <ol>
                                <li>☐ <strong>Volume check:</strong> At least 3k units/day? If &lt;1k, skip (can't exit position).</li>
                                <li>☐ <strong>Spread check:</strong> 3–15% spread? (Use net after fees). If &lt;2%, skip (fees eat profit). If &gt;20%, suspect manipulation.</li>
                                <li>☐ <strong>Volatility check:</strong> Check <Link href="/topMovers">Top Movers</Link>. Has price moved &gt;10% in 24h? If yes, understand why (event? update? manipulation?).</li>
                                <li>☐ <strong>Wall depth check:</strong> Are buy AND sell walls deep? If one is thin (&lt;5% daily volume), prices are unstable.</li>
                                <li>☐ <strong>Trend check:</strong> Pull item's price history (click on <Link href="/item">Item Search</Link>). Is it trending up, down, or flat? Understand before committing.</li>
                                <li>☐ <strong>Competition check:</strong> Is this on every flipper's radar? (If yes, margins are likely compressed → skip). Use <Link href="/bazaar">Bazaar Flips</Link> to see if item was top-flip yesterday and today.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Best items by capital level & playstyle</CardTitle>

                            <CardTitle as="h3">Beginners (under 5M capital)</CardTitle>
                            <ul>
                                <li><strong>Sugar Cane:</strong> 50k+/day volume, 2–3% margin, ultra-stable. Flip 15–20 times/day. Boring but reliable.</li>
                                <li><strong>Wheat:</strong> Similar to Sugar Cane. Good alternative if Sugar Cane gets saturated.</li>
                                <li><strong>Bone:</strong> 30k+/day volume, 2–4% margin. Good for diversification.</li>
                                <li><strong>Enchanted Rotten Flesh:</strong> 15k+/day, 3–5% margin. Slightly more margin than raw crops.</li>
                            </ul>

                            <CardTitle as="h3">Intermediate (5M–20M capital)</CardTitle>
                            <ul>
                                <li><strong>Revenant Flesh:</strong> 5k–8k/day volume, 5–8% margin. Mid-tier slayer drop, stable.</li>
                                <li><strong>Tarantula Web:</strong> Similar to Revenant. Good diversification pair.</li>
                                <li><strong>Enchanted Books (specific tiers):</strong> 2k–5k/day volume, 5–15% margin. More knowledge required (which enchants are in demand?)</li>
                                <li><strong>Refined Diamond/Gold:</strong> 1k–3k/day, 8–12% margin. Niche but stable.</li>
                            </ul>

                            <CardTitle as="h3">Advanced (20M+ capital)</CardTitle>
                            <ul>
                                <li><strong>Meta pets (Dragon, Phoenix):</strong> 10–50M price range, 20–40% margins, 1–3 flips/week. Hold 3–7 days.</li>
                                <li><strong>God-roll armor:</strong> 5M–50M price range, 15–50% margins. Requires reforge/enchant knowledge.</li>
                                <li><strong>Dungeon prep crafts:</strong> Variable margins 20–60%. High risk, high reward.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">How to find undiscovered items with good margins</CardTitle>

                            <CardTitle as="h3">Technique 1: Scan all items below top 50</CardTitle>
                            <CardText>
                                Top 50 items on <Link href="/bazaar">Bazaar Flips</Link> are saturated. Sort by Volume (ascending), find items with 5k–10k volume showing &gt;5% margin. These are often overlooked.
                            </CardText>

                            <CardTitle as="h3">Technique 2: Watch <Link href="/topMovers">Top Movers</Link> for emerging trends</CardTitle>
                            <CardText>
                                Items that jumped 15%+ in 24h might have more runway or be crashing. Understand the catalyst:
                            </CardText>
                            <ul>
                                <li>Mayor change → predictable, play it</li>
                                <li>New update → opportunity, front-run</li>
                                <li>Random pump → likely correction coming, wait</li>
                            </ul>

                            <CardTitle as="h3">Technique 3: Check craft flips for material arbitrage</CardTitle>
                            <CardText>
                                Use <Link href="/crafts">Craft Flips</Link>. If Craft X shows 15% margin, work backwards: which materials are underpriced? Flip those materials pre-craft-flip surge.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Items to AVOID</CardTitle>

                            <CardTitle as="h3">❌ &lt;1k daily volume</CardTitle>
                            <CardText>
                                Too illiquid. Orders won't fill. Capital gets stuck.
                            </CardText>

                            <CardTitle as="h3">❌ &gt;20% spread with &lt;2k volume</CardTitle>
                            <CardText>
                                Red flag for manipulation. One whale controls price. Will crash when they leave.
                            </CardText>

                            <CardTitle as="h3">❌ Items in Top Movers with &gt;30% 24h swing</CardTitle>
                            <CardText>
                                Too volatile. Likely event-driven (double XP, new boss). Wait for stabilization.
                            </CardText>

                            <CardTitle as="h3">❌ Items you don't understand</CardTitle>
                            <CardText>
                                "This Enchanted Book shows 20% margin!" But you don't know if it's valuable or toxic. Skip. Master 3–5 items before expanding.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">FAQ: Item selection</CardTitle>

                            <CardTitle as="h3">Should I flip the highest-margin item or highest-volume item?</CardTitle>
                            <CardText>
                                <strong>Highest-volume at first.</strong> Volume beats margin for beginners (faster compounding). Once you have 10M+, margins matter more.
                            </CardText>

                            <CardTitle as="h3">How do I know if an item's margin is temporary?</CardTitle>
                            <CardText>
                                Check 30-day price history. If margin was 2% for 29 days, then 8% today = temporary spike (arbitrage window). If margin was 8% for 30 days = sustainable margin.
                            </CardText>

                            <CardTitle as="h3">Can I flip niche items nobody knows about?</CardTitle>
                            <CardText>
                                <strong>Not recommended for beginners.</strong> Orders won't fill. But if you have 20M+ and understand the niche, yes (e.g., specific pet gear, dungeon items).
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Tools to find best items</CardTitle>
                            <ul>
                                <li><strong><Link href="/bazaar">Bazaar Flips</Link></strong> — primary tool, sort by Volume or Spread</li>
                                <li><strong><Link href="/crafts">Craft Flips</Link></strong> — find profitable crafts (materials are secondary opportunities)</li>
                                <li><strong><Link href="/topMovers">Top Movers</Link></strong> — spot emerging trends and volatility</li>
                                <li><strong><Link href="/item">Item Search</Link></strong> — check 30-day price history</li>
                                <li><strong><Link href="/flipper">AH Flipper</Link></strong> — find undervalued unique items</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Related guides</CardTitle>
                            <ul>
                                <li><Link href="/guides/how-to-find-best-items-to-flip">How to Find Best Items</Link> — deep dive on item analysis</li>
                                <li><Link href="/guides/largest-bazaar-margins">Largest Bazaar Margins</Link> — high-margin opportunities</li>
                                <li><Link href="/guides/getting-started-with-flipping">Getting Started</Link></li>
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
