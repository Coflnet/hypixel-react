import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Make a Lot of Money with Flipping | Advanced Strategies to 100M+ Coins",
    "Scale from 10M to 100M+ using advanced flipping: portfolio diversification, market event exploitation, premium tools, profit reinvestment discipline."
);

export default function MakingMoneyWithFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to make a lot of money with flipping — the short answer</CardTitle>
                            <CardText>
                                Scale from 10M to 100M+ by: (1) diversifying across Bazaar (60%), Crafts (20%), AH (20%), (2) exploiting mayor perks and events, (3) reinvesting 100% of profits until 50M, then banking some, (4) using premium tools for edge, (5) running 30–50 active flips simultaneously. Timeline: 3–6 months from 10M to 100M with consistent 15–20% daily ROI.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">The scaling pyramid: 10M → 50M → 100M</CardTitle>

                            <CardTitle as="h3">Phase 1: From 10M to 50M (6–12 weeks)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Prove consistent 15–20% daily ROI. Build reputation + experience.
                            </CardText>
                            <ul>
                                <li><strong>Capital allocation:</strong>
                                    <ul>
                                        <li>Bazaar (60%): 6M across 20–30 items @ 200k per item. Target 10–15 flips/day per item.</li>
                                        <li>Crafts (25%): 2.5M actively flipped across 4–5 recipes. Target 1–3 flips/day per recipe.</li>
                                        <li>AH (10%): 1M reserve for opportunity plays. Target 1–2 high-margin flips/week.</li>
                                        <li>Event/Reserve (5%): 0.5M for mayor spike plays.</li>
                                    </ul>
                                </li>
                                <li><strong>Daily workflow:</strong>
                                    <ol>
                                        <li>Check <Link href="/topMovers">Top Movers</Link> & <Link href="/mayor">Mayor</Link> for events (10 min)</li>
                                        <li>Open <Link href="/bazaar">Bazaar Flips</Link>, place 20–30 buy orders (15 min)</li>
                                        <li>Collect fills every 20 min, place sell orders (active play 2–3 hours)</li>
                                        <li>Track profits with /cofl profit (5 min)</li>
                                    </ol>
                                </li>
                                <li><strong>Reinvestment discipline:</strong> 100% of profits reinvested. Never bank coins until 50M.</li>
                                <li><strong>Expected result:</strong> 10M → 50M in 45–60 days (if flipping 3–4 hours/day)</li>
                            </ul>

                            <CardTitle as="h3">Phase 2: From 50M to 100M (4–8 weeks)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Shift focus to higher-margin plays. Capital is large enough to absorb niche risks.
                            </CardText>
                            <ul>
                                <li><strong>Capital allocation (evolves):</strong>
                                    <ul>
                                        <li>Bazaar (45%): 22.5M. Reduced frequency (5–8 flips/day per item) since capital's high. Increase sizing to 30–50% per flip. Let compounding work.</li>
                                        <li>Crafts (20%): 10M. Expand to 8–10 active recipes. Some recipes now at 1M+ scale = 20–30% margins.</li>
                                        <li>AH (20%): 10M. Now run 3–6 active listings simultaneously. Target 3–5 high-margin plays/week.</li>
                                        <li>Event/Premium (15%): 7.5M. Derpy mayor plays, balance updates, new items.</li>
                                    </ul>
                                </li>
                                <li><strong>Focus shift:</strong> Less volume, more margin. Bazaar becomes maintenance (easier), AH becomes primary growth engine.</li>
                                <li><strong>Expected result:</strong> 50M → 100M in 30–45 days (with 10–15% daily ROI, slowing from compounding base)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Advanced strategies for high-capital flippers</CardTitle>

                            <CardTitle as="h3">1. Exploit mayor events (1–3M per spike)</CardTitle>
                            <CardText>
                                <strong>Strategy:</strong> Hold 5–10M in reserve. When predictable mayor perks hit, deploy aggressively.
                            </CardText>
                            <ul>
                                <li><strong>Derpy mayor:</strong> AH taxes drop 50%. Front-run high-value AH inventory before event ends. Profit: 25–50% on 5M commitment = 1.25–2.5M gain.</li>
                                <li><strong>New balance patch:</strong> Items with changed crafting costs become arbitrage opportunities. Buy materials before patch hits, sell after market reprices.</li>
                                <li><strong>Double XP events:</strong> Items spike in demand (players farming). Flip in 2–3 day window, exit before crash.</li>
                                <li><strong>New boss releases:</strong> Boss materials tank initially, stabilize after 1–2 weeks. Buy dips, sell stabilization (20–40% margins).</li>
                            </ul>

                            <CardTitle as="h3">2. Master craft flipping at scale</CardTitle>
                            <CardText>
                                <strong>At 50M+, craft flipping is faster money than pure Bazaar flipping.</strong>
                            </CardText>
                            <ul>
                                <li><strong>High-volume recipes (5–20% margins):</strong>
                                    <ul>
                                        <li>Enchanted Blocks: Cobblestone → blocks. 50–100 flips/week. 200k–500k/flip.</li>
                                        <li>Compacting chains: 160 unenchanted → 1 enchanted. 10–20% margins on demand items.</li>
                                    </ul>
                                </li>
                                <li><strong>High-margin recipes (20–50% margins):</strong>
                                    <ul>
                                        <li>Armor reforges: Combine base armor + gems. 1M–5M/flip. 2–5 flips/week.</li>
                                        <li>Dungeon prep crafts: Items for end-game grind. Margins 30–60% if you get materials right.</li>
                                        <li>Pet food combos: Niche but 15–30% margins. 100k–500k/flip.</li>
                                    </ul>
                                </li>
                                <li><strong>Tracking:</strong> Use <Link href="/crafts">Craft Flips</Link> to monitor recipe profitability. Dump recipes with &lt;8% margin.</li>
                            </ul>

                            <CardTitle as="h3">3. AH flipping for high capital (30–100%+ margins)</CardTitle>
                            <CardText>
                                <strong>At 50M+, AH flipping should yield 30–100%+ margins on niche items.</strong>
                            </CardText>
                            <ul>
                                <li><strong>Meta pets:</strong> Dragon, Phoenix, Griffin. 20M–100M price range. 20–40% margins if you buy right.</li>
                                <li><strong>God-roll gear:</strong> Perfect enchants + reforges. 5M–50M range. 15–50% margins.</li>
                                <li><strong>Dungeon equipment:</strong> New drops from balances changes. 1M–10M range. 20–60% margins in first 2 weeks.</li>
                                <li><strong>Tip:</strong> Use <Link href="/flipper">AH Flipper</Link> to find undervalued items. Premium tool shows demand signals.</li>
                            </ul>

                            <CardTitle as="h3">4. Profit reinvestment discipline (reinvest until 50M, then bank)</CardTitle>
                            <CardText>
                                <strong>Reinvest 100% until 50M.</strong> After 50M, can bank 20–30% of profits safely.
                                <br />
                                <strong>Why?</strong> Compounding is exponential at scale. Holding cash slows growth.
                                <br />
                                <strong>Banking strategy once 50M+:</strong> Hoard 10M (emergency fund) + 5–10M (opportunity fund). Rest stays deployed.
                            </CardText>

                            <CardTitle as="h3">5. Use premium tools for edge</CardTitle>
                            <CardText>
                                <strong><Link href="/premiumBazaar">Premium Bazaar Flips</Link></strong> shows demand-based flips + real-time alerts.
                                <br />
                                <strong>Cost:</strong> Premium subscription (varies)
                                <br />
                                <strong>ROI:</strong> If premium saves 1 hour/day of research, and your time is worth 1M coins/hour = 365M/year value. Subscription pays for itself instantly.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Common scaling mistakes</CardTitle>

                            <CardTitle as="h3">❌ Mistake: Spreading too thin</CardTitle>
                            <CardText>
                                "I'll flip 100 different items!" Result: Can't monitor them all. Orders fail, losses mount.
                                <br />
                                <strong>Fix:</strong> Limit to 20–30 active Bazaar items, 5–8 craft recipes, 3–6 AH listings. Quality &gt; quantity.
                            </CardText>

                            <CardTitle as="h3">❌ Mistake: Not tracking ROI by item</CardTitle>
                            <CardText>
                                Item A yields 8%, Item B yields 2%. But you're flipping both equally.
                                <br />
                                <strong>Fix:</strong> Use /cofl profit weekly. Drop bottom 10% of items. Double down on top performers.
                            </CardText>

                            <CardTitle as="h3">❌ Mistake: Holding capital as "safety net"</CardTitle>
                            <CardText>
                                Once you reach 20M+, you stop reinvesting "just in case." Result: 10M in Bazaar, 3M locked, 7M liquid. You miss 30% growth from deployed capital.
                                <br />
                                <strong>Fix:</strong> Reinvest 100% until 50M. Then keep only 15–20% as reserves.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Timeline and expectations</CardTitle>

                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Capital Level</th>
                                        <th>Daily ROI Target</th>
                                        <th>Time to Next Level</th>
                                        <th>Strategy Focus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1M–5M</td>
                                        <td>5–10%</td>
                                        <td>14–21 days</td>
                                        <td>Bazaar volume only</td>
                                    </tr>
                                    <tr>
                                        <td>5M–10M</td>
                                        <td>10–15%</td>
                                        <td>14–21 days</td>
                                        <td>Bazaar + Crafts hybrid</td>
                                    </tr>
                                    <tr>
                                        <td>10M–50M</td>
                                        <td>12–18%</td>
                                        <td>30–45 days</td>
                                        <td>Bazaar + Crafts + AH (minor)</td>
                                    </tr>
                                    <tr>
                                        <td>50M–100M</td>
                                        <td>8–15%</td>
                                        <td>30–45 days</td>
                                        <td>AH primary, Crafts secondary, Bazaar maintenance</td>
                                    </tr>
                                    <tr>
                                        <td>&gt;100M</td>
                                        <td>5–10%</td>
                                        <td>Indefinite (focus on stability)</td>
                                        <td>High-margin plays only, limit risk</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">FAQ: Scaling to 100M+</CardTitle>

                            <CardTitle as="h3">How long does it take to reach 100M from 1M?</CardTitle>
                            <CardText>
                                <strong>Theoretical minimum:</strong> ~90 days (if 20% daily ROI + reinvestment)
                                <br />
                                <strong>Realistic:</strong> 120–180 days (accounting for market variations, learning curve, 2–3 hours/day playtime)
                            </CardText>

                            <CardTitle as="h3">At what capital should I stop Bazaar flipping?</CardTitle>
                            <CardText>
                                <strong>Never completely.</strong> But shift: Bazaar 60% (10M) at 10M capital → Bazaar 20% (10M) at 50M capital. High-margin plays beat volume at scale.
                            </CardText>

                            <CardTitle as="h3">What's the biggest bottleneck to scaling?</CardTitle>
                            <CardText>
                                <strong>Playtime.</strong> You can't actively flip 100 items if you're only playing 1 hour/day. Scale depends on attention. At 50M+, you can flip less frequently (AH takes 1–7 days/flip) so time requirement drops.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — find high-volume items</li>
                                <li><Link href="/crafts">Craft Flips</Link> — find profitable recipes</li>
                                <li><Link href="/flipper">AH Flipper</Link> — find undervalued items</li>
                                <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link></li>
                                <li><Link href="/guides/tracking-profits-automatically">Track Profits Automatically</Link></li>
                                <li><Link href="/guides/bazaar-vs-auction-house">Bazaar vs Auction House</Link></li>
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
