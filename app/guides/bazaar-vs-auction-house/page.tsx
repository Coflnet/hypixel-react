import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

const LAST_UPDATED_ISO = "2026-04-19";
const LAST_UPDATED_LABEL = "April 19, 2026";

export const metadata: Metadata = getHeadMetadata(
    "Bazaar vs Auction House Flipping | Which is Better for Profit?",
    "Compare Bazaar and Auction House flipping: speed vs margin, volume vs uniqueness. Learn which market fits your capital, experience level, and profit goals.",
    undefined,
    [],
    undefined,
    getCanonicalUrl('/guides/bazaar-vs-auction-house')
);

export default function BazaarVsAuctionHousePage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Bazaar vs Auction House — the short answer</CardTitle>
                            <CardText className="text-muted small mb-0">
                                Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                            </CardText>
                            <CardText>
                                Bazaar is faster (30–90 min per flip), easier for beginners, and scales with volume. Auction House has higher margins (10–50%+) but requires 1–7 days per flip and deeper item knowledge (reforges, pet levels, enchants). Start with Bazaar to learn mechanics, graduate to AH once you have 5M+ coins and understand item valuation.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">Quick comparison</CardTitle>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        <th>Bazaar</th>
                                        <th>Auction House</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Item Type</strong></td>
                                        <td>Commodities (stackable, identical): Enchanted Sugar Cane, Wheat, Bone, etc.</td>
                                        <td>Unique items: Pets (leveled), reforged gear, enchanted weapons, dungeon loot</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Flip Speed</strong></td>
                                        <td>average 30–90 min (buy order fill + sell offer fill)</td>
                                        <td>often multiple days</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Profit Margin</strong></td>
                                        <td>2–8% per flip (1.25% fee eats margin)</td>
                                        <td>10–50%+ per flip (larger spreads, less competition)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Volume</strong></td>
                                        <td>High (flip thousands-millions of items per day)</td>
                                        <td>Low (usually 10s of items per day)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Capital Required</strong></td>
                                        <td>500k–3M to start, 100M+ to scale and at least Skybock Level 7</td>
                                        <td>3M–10M minimum, 500M+ for high-value pets/gear</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Complexity</strong></td>
                                        <td>Low: Pick item from <Link href="/bazaar">Bazaar Flips</Link>, place orders, wait</td>
                                        <td>High: Evaluate reforges, enchants, pet XP, compare recent sales, time listings</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Best For</strong></td>
                                        <td>Beginners, low capital (&lt;5M), players who want fast turnover</td>
                                        <td>Experienced flippers, high capital (&gt;5M), players with item knowledge</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">The Bazaar: Speed & volume</CardTitle>
                            <CardTitle as="h3">How it works</CardTitle>
                            <CardText>
                                The Bazaar is a commodity market where all items of the same type are identical (fungible). One stack of Enchanted Sugar Cane is indistinguishable from another. You profit by:
                            </CardText>
                            <ol>
                                <li>Placing buy orders below instant-buy price (1–10% cheaper)</li>
                                <li>Waiting 5–60 min for fills</li>
                                <li>Placing sell offers above instant-sell price (1–10% higher)</li>
                                <li>Collecting 2–8% margin minus 1.25% Bazaar fee</li>
                            </ol>

                            <CardTitle as="h3">Advantages</CardTitle>
                            <ul>
                                <li><strong>Fast turnover:</strong> Complete a flip in 30–90 min. Reinvest profits 10–20 times/day.</li>
                                <li><strong>Low barrier to entry:</strong> Start with 500k–1M capital. Beginner-friendly.</li>
                                <li><strong>High liquidity:</strong> Top items trade 50k+ units/day. Orders fill reliably.</li>
                                <li><strong>Compounding power:</strong> Flip 10x/day → 20% daily return → 1M becomes 10M in 13 days (theoretical max).</li>
                            </ul>

                            <CardTitle as="h3">Disadvantages</CardTitle>
                            <ul>
                                <li><strong>Low margins:</strong> 2–8% per flip. Fees eat 1.25% of gross profit on each order.</li>
                                <li><strong>Competition:</strong> Popular items have tight spreads due to many flippers.</li>
                                <li><strong>Price volatility:</strong> Events (mayor changes, updates) can crash prices 20%+ overnight.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">The Auction House: Margin & uniqueness</CardTitle>
                            <CardTitle as="h3">How it works</CardTitle>
                            <CardText>
                                The AH lists unique items where each has distinct attributes (reforge, pet level, enchants, dungeon stars). You profit by:
                            </CardText>
                            <ol>
                                <li>Finding undervalued auctions using <Link href="/flipper">AH Flipper</Link> (items 10–50% below market)</li>
                                <li>Winning BIN (Buy It Now) or sniping timed auctions in the last 5 seconds</li>
                                <li>Relisting at median market price (2–5% below lowest active listing)</li>
                                <li>Waiting 12h–7d for sale</li>
                            </ol>

                            <CardTitle as="h3">Advantages</CardTitle>
                            <ul>
                                <li><strong>High margins:</strong> 10–50%+ per flip. Rare god-roll items can 2x–10x.</li>
                                <li><strong>Less competition:</strong> Requires knowledge → fewer flippers → larger spreads.</li>
                                <li><strong>Skill-based edge:</strong> Learn reforge values, pet meta, enchant tiers → consistently beat market.</li>
                                <li><strong>No sell fee:</strong> Only 1% listing fee (refunded on sale). Keep full margin.</li>
                            </ul>

                            <CardTitle as="h3">Disadvantages</CardTitle>
                            <ul>
                                <li><strong>Slow turnover:</strong> 1–7 days per flip. Capital locked for longer.</li>
                                <li><strong>High capital requirement:</strong> Meta pets cost 10M–100M+. Need reserves to flip multiple items.</li>
                                <li><strong>Steep learning curve:</strong> Must know which reforges add value, optimal pet levels, enchant book combinations.</li>
                                <li><strong>Liquidity risk:</strong> Niche items (off-meta pets, outdated gear) can take weeks to sell.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Which should you choose?</CardTitle>
                            <CardTitle as="h3">Start with Bazaar if you:</CardTitle>
                            <ul>
                                <li>Have &lt;3M capital</li>
                                <li>Are new to flipping (first 30 days)</li>
                                <li>Want daily profit (compounding is key)</li>
                                <li>Prefer low-risk, predictable returns</li>
                            </ul>

                            <CardTitle as="h3">Graduate to AH when you:</CardTitle>
                            <ul>
                                <li>Have 5M+ liquid capital (can absorb 1–2 day holds)</li>
                                <li>Understand item stats (reforges, pet abilities, enchant values)</li>
                                <li>Are comfortable with 1–7 day flip cycles</li>
                                <li>Want to scale beyond Bazaar's 2–8% margins</li>
                            </ul>

                            <CardTitle as="h3">Hybrid strategy (best for 10M+ capital)</CardTitle>
                            <CardText>
                                Split capital 60/40:
                            </CardText>
                            <ul>
                                <li><strong>60% in Bazaar flips:</strong> Fast turnover, daily profit, compounding base</li>
                                <li><strong>40% in AH flips:</strong> High-margin plays, 1–3 active listings at a time</li>
                            </ul>
                            <CardText>
                                This balances speed (Bazaar) with margin (AH). Bazaar profits fund AH capital; AH windfalls boost Bazaar volume.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Frequently Asked Questions</CardTitle>
                            <CardTitle as="h3">Can I make more total profit with Bazaar or AH?</CardTitle>
                            <CardText>
                                <strong>Bazaar (high volume):</strong> 1M capital → 2–5% daily → 60k–150k/day. Over 30 days with compounding: 4M–16M.
                                <br />
                                <strong>AH (high margin):</strong> 5M flip → 30% margin → 1.5M profit in 3 days. Over 30 days (10 flips): 15M.
                                <br />
                                <strong>Winner:</strong> AH has higher ceiling, but Bazaar is safer and faster to scale for beginners.
                            </CardText>

                            <CardTitle as="h3">How do I learn AH item valuation?</CardTitle>
                            <CardText>
                                1. Study recent sales: Check <Link href="/flipper">AH Flipper</Link> for sold items with similar stats.
                                <br />
                                2. Join trading Discord servers: Ask experienced traders about reforge/pet tier lists.
                                <br />
                                3. Track meta shifts: New dungeons, balance patches, or mayor perks change demand.
                                <br />
                                4. Start small: Flip cheap items (100k–500k) to learn without risking millions.
                            </CardText>

                            <CardTitle as="h3">Should I flip both Bazaar and AH simultaneously?</CardTitle>
                            <CardText>
                                <strong>Yes, if you have 10M+ capital.</strong> Diversify to hedge risk:
                                <br />
                                - Bazaar crashes don't affect AH inventory.
                                <br />
                                - AH slow periods are buffered by Bazaar daily profits.
                                <br />
                                <strong>No, if you have &lt;5M capital.</strong> Focus on mastering Bazaar first to build capital faster.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — live profit estimates and volume data</li>
                                <li><Link href="/flipper">AH Flipper</Link> — undervalued auction finder</li>
                                <li><Link href="/guides/how-to-flip">How to Flip (step-by-step)</Link></li>
                                <li><Link href="/guides/getting-started-with-flipping">Getting Started with Flipping</Link></li>
                                <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link></li>
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
