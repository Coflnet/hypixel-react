import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardText, CardTitle, Col, Container, Row } from "react-bootstrap";
import { getCanonicalUrl, getHeadMetadata } from "../../../utils/SSRUtils";
const LAST_UPDATED_ISO = "2026-04-19";
const LAST_UPDATED_LABEL = "April 19, 2026";
export const metadata: Metadata = getHeadMetadata(
    "Hypixel SkyBlock NPC Flipping Guide | NPC to Bazaar, AH & Reverse",
    "Master Hypixel SkyBlock NPC flipping. Learn to buy from NPCs and resell to Bazaar or AH, and execute reverse NPC flips. Includes limits, taxes, and SkyCofl mod tools.",
    undefined,
    [],
    undefined,
    getCanonicalUrl("/guides/npc-flipping-guide")
);

export default function NpcFlippingGuidePage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">NPC Flipping Guide: The Short Answer</CardTitle>
                            <CardText className="text-muted small mb-0">
                                Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                            </CardText>
                            <CardText>
                                NPC flipping in Hypixel SkyBlock involves three main strategies: buying from an NPC to resell on the <Link href="/bazaar">Bazaar</Link>, buying from an NPC to list on the Auction House (AH), or buying below the NPC sell price to cash out instantly (<Link href="/reverseNpc">Reverse NPC Flipping</Link>).
                            </CardText>
                            <CardText>
                                Your success depends on exit speed, fee management, and daily NPC limits. Fixed NPC pricing makes market entry easy. The challenge lies in finding high-volume items with profitable spreads. Use the SkyCofl <Link href="/npc">NPC Flips</Link> and <Link href="/reverseNpc">Reverse NPC Flips</Link> tools to find live opportunities.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">SkyCofl Mod Integration</CardTitle>
                            <CardText>
                                If you use the SkyCofl mod, you can access these strategies directly in-game. Run <code>/cofl npc</code> for standard NPC flips and <code>/cofl reverseNpc</code> for reverse flips. The mod automatically tracks your daily 500M coin NPC sell limit, saving you from manual calculations.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">The Three NPC Routes</CardTitle>
                            <ul>
                                <li><strong>NPC to Bazaar:</strong> Fast route for bulk materials. Buy from NPCs and sell to Bazaar buy orders.</li>
                                <li><strong>NPC to Auction House:</strong> Slower route for niche items. Better margins but less liquidity.</li>
                                <li><strong>Reverse NPC (Bazaar/AH to NPC):</strong> Safest route. Buy from players below NPC price and sell to NPCs for guaranteed profit.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">1. NPC to Bazaar</CardTitle>
                            <CardText>
                                This is the default NPC flipping method. You buy at a fixed NPC price and sell into the high-volume Bazaar market. Builder materials and utility items excel here due to steady daily demand.
                            </CardText>
                            <CardTitle as="h3">Execution Steps</CardTitle>
                            <ol>
                                <li>Check <Link href="/npc">NPC Flips</Link> or run <code>/cofl npc</code> in-game.</li>
                                <li>Prioritize items with high daily volume over absolute margin.</li>
                                <li>Buy a test batch from the NPC to confirm the current price spread.</li>
                                <li>Sell via Bazaar sell offers, or instant sell if volume is high enough.</li>
                                <li>Stop when you hit daily NPC buy limits or the margin compresses.</li>
                            </ol>
                            <CardTitle as="h4">Walkthrough Example: Builder's Clay / Promising Tool</CardTitle>
                            <CardText>
                                <strong>Scenario:</strong> <em>Promising Pickaxe</em> is available at the Mine Merchant for 35 coins. The Bazaar sell price fluctuates, but currently sits around 80,000 to 100,000 coins (due to varying demand).
                            </CardText>
                            <ul>
                                <li><strong>Buy:</strong> Purchase from Mine Merchant (Cost: 35 coins).</li>
                                <li><strong>Sell:</strong> List on Bazaar (Expected return: ~90,000 coins).</li>
                                <li><strong>Profit:</strong> ~89,965 coins per item.</li>
                                <li><strong>Note:</strong> Volume on these items can be sporadic compared to bulk materials like Ice or Packed Ice, so check the Bazaar flip volume first.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">2. NPC to Auction House</CardTitle>
                            <CardText>
                                This strategy relies on Auction House demand rather than Bazaar liquidity. It works best for niche items, furniture, or upgrade materials not supported by the Bazaar. You must account for AH listing fees and taxes.
                            </CardText>
                            <CardTitle as="h3">Execution Steps</CardTitle>
                            <ol>
                                <li>Use <Link href="/npc">NPC Flips</Link> or run <code>/cofl npc</code> and look for AH-based exit prices.</li>
                                <li>Verify recent AH sales data. High margins on items that never sell are traps.</li>
                                <li>Calculate your net profit including AH taxes. Pair with our <Link href="/guides/avoid-taxes-and-losses">Tax Guide</Link>.</li>
                                <li>List a small test batch to check the sell-through rate before buying in bulk.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">3. Reverse NPC Flipping</CardTitle>
                            <CardText>
                                Reverse NPC flipping offers a guaranteed exit. You buy items from the Bazaar or AH for less than the NPC sell price, then sell them to any NPC. The NPC price creates a strict price floor, eliminating market risk once the items are secured.
                            </CardText>
                            <CardTitle as="h3">Execution Steps</CardTitle>
                            <ol>
                                <li>Open <Link href="/reverseNpc">Reverse NPC Flips</Link> or run <code>/cofl reverseNpc</code>.</li>
                                <li>Prioritize items with fast fill speeds on buy orders.</li>
                                <li>Set up Bazaar buy orders below the NPC sell value.</li>
                                <li>Once orders fill, immediately sell the inventory to an NPC.</li>
                                <li>Monitor your daily 500M coin NPC sell limit interactively monitored by the SkyCofl mod.</li>
                            </ol>
                            <CardTitle as="h4">Walkthrough Example: Enchanted Snow Blocks</CardTitle>
                            <CardText>
                                <strong>Scenario:</strong> <em>Enchanted Snow Blocks</em> naturally sell to any NPC vendor for exactly 600 coins. Sometimes, during heavy Jerry box events or high mining activity, the Bazaar buy order price drops to around 590 to 595 coins.
                            </CardText>
                            <ul>
                                <li><strong>Buy:</strong> Place a Bazaar buy order for 71,680 Enchanted Snow Blocks at 592 coins each (Total Cost: ~42.4M coins).</li>
                                <li><strong>Wait:</strong> Let the buy orders fill over time as players instant-sell to the Bazaar.</li>
                                <li><strong>Sell:</strong> Take the filled blocks and sell them directly to the Adventurer NPC for 600 coins each.</li>
                                <li><strong>Profit:</strong> 8 coins per block (Total Profit: ~573,000 coins on a zero-risk 42.4M investment).</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Crucial Flipping Factors</CardTitle>
                            <ul>
                                <li><strong>Volume over Margin:</strong> A 3% margin that fills constantly beats a 20% margin that rarely sells.</li>
                                <li><strong>Net Profit:</strong> Always factor AH and Bazaar taxes into your target margin.</li>
                                <li><strong>NPC Limits:</strong> Plan around daily NPC buy caps and the global 500M coin sell cap.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Route Comparison</CardTitle>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Route</th>
                                        <th>Best Exit Market</th>
                                        <th>Speed</th>
                                        <th>Risk Level</th>
                                        <th>Key Metric to Watch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>NPC to Bazaar</td>
                                        <td>Commodity demand</td>
                                        <td>Fast</td>
                                        <td>Low</td>
                                        <td>Daily volume & buy limits</td>
                                    </tr>
                                    <tr>
                                        <td>NPC to AH</td>
                                        <td>Niche demand</td>
                                        <td>Slow</td>
                                        <td>Medium</td>
                                        <td>Sell-through rate & fees</td>
                                    </tr>
                                    <tr>
                                        <td>Reverse NPC</td>
                                        <td>NPC price floor</td>
                                        <td>Medium</td>
                                        <td>Low</td>
                                        <td>Order fill speed & sell cap</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">SkyCofl Flipping Workflow</CardTitle>
                            <ol>
                                <li>Find NPC purchase opportunities via <Link href="/npc">NPC Flips</Link> or <code>/cofl npc</code>.</li>
                                <li>Validate liquid exits using <Link href="/bazaar">Bazaar Flips</Link> or trust the volume (sales per day) displayed in the npc flips.</li>
                                <li>Research niche exits in the <Link href="/flipper">AH Flipper</Link>.</li>
                                <li>Capture guaranteed floors with <Link href="/reverseNpc">Reverse NPC Flips</Link> or <code>/cofl reverseNpc</code>.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Related Tools and Guides</CardTitle>
                            <ul>
                                <li><Link href="/npc">NPC Flips</Link> - Find buy-from-NPC routes with Bazaar and AH value comparisons.</li>
                                <li><Link href="/reverseNpc">Reverse NPC Flips</Link> - Find NPC-floor guaranteed profits.</li>
                                <li><Link href="/bazaar">Bazaar Flips</Link> - Validate liquid commodity exits.</li>
                                <li><Link href="/flipper">AH Flipper</Link> - Research niche Auction House exits.</li>
                                <li><Link href="/guides/how-to-start-flipping-with-no-money">How to Start Flipping with No Money</Link> - Early-game market context.</li>
                                <li><Link href="/guides/avoid-taxes-and-losses">Avoid Taxes and Losses</Link> - Protect margins on Bazaar and AH exits.</li>
                            </ul>
                            
                            <div className="mt-4">
                                <Link href="/guides" passHref>
                                    Back to Guides
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
