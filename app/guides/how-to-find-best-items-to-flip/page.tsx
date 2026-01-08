import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Find Best Items to Flip | Volume, Margins & Liquidity Analysis",
    "Master item selection using volume metrics, buy/sell walls, spreads, and price momentum. Learn to identify high-volume, low-risk flips vs niche high-margin plays."
,
    undefined,
    getCanonicalUrl('/guides/how-to-find-best-items-to-flip')
);

export default function HowToFindBestItemsToFlipPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to find best items — the short answer</CardTitle>
                            <CardText>
                                Use <Link href="/bazaar">Bazaar Flips</Link> sorted by Volume ⇩ for beginners, Advanced Users should analyze spread %, buy/sell wall liquidity, and margin stability. For 1st 100 flips, pick items with 10k+ units/day volume + 3–8% spread. Avoid single-wall monopolies (risky) and volatile items (10%+ swings in 24h).
                            </CardText>

                            <CardTitle as="h2" className="mt-3">The three types of good flips</CardTitle>

                            <CardTitle as="h3">1. High-volume, low-margin flips (safest)</CardTitle>
                            <CardText>
                                <strong>Profile:</strong> 20k+ units/day, 2–5% margin
                                <br />
                                <strong>Examples:</strong> Enchanted Sugar Cane, Wheat, Bone, Cocoa Beans
                            </CardText>
                            <ul>
                                <li><strong>Why:</strong> Huge liquidity means orders fill fast. Tight margins mean predictable outcomes. Hard to be hurt by sudden crashes.</li>
                                <li><strong>Best for:</strong> Beginners, capital compounding (need high frequency)</li>
                                <li><strong>Flip frequency:</strong> 10–20 per day per item</li>
                                <li><strong>Risk:</strong> Ultra-low. Worst case = break even after fees.</li>
                            </ul>

                            <CardTitle as="h3">2. Medium-volume, medium-margin flips (balanced)</CardTitle>
                            <CardText>
                                <strong>Profile:</strong> 5k–15k units/day, 5–12% margin
                                <br />
                                <strong>Examples:</strong> Revenant Flesh, Tarantula Web, Enchanted Book combos
                            </CardText>
                            <ul>
                                <li><strong>Why:</strong> Good margins + decent liquidity = balanced risk/reward. Less competition than ultra-high-volume items.</li>
                                <li><strong>Best for:</strong> Intermediate flippers with 5M+ capital</li>
                                <li><strong>Flip frequency:</strong> 3–8 per day per item</li>
                                <li><strong>Risk:</strong> Medium. Price swings 5–10% but stabilize quickly.</li>
                            </ul>

                            <CardTitle as="h3">3. Low-volume, high-margin flips (risky but lucrative)</CardTitle>
                            <CardText>
                                <strong>Profile:</strong> &lt;2k units/day, 15–50% margin
                                <br />
                                <strong>Examples:</strong> Meta pets, rare enchanted gear, niche Craft recipes
                            </CardText>
                            <ul>
                                <li><strong>Why:</strong> Low competition + unique items = large spreads. One winning flip = 5–10 losing flips offset.</li>
                                <li><strong>Best for:</strong> Advanced flippers, Auction House specialists</li>
                                <li><strong>Flip frequency:</strong> 1–2 per week per item</li>
                                <li><strong>Risk:</strong> High. Item can tank 20–50% if market shifts or competitors undercut.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">How to read Bazaar Flips page (metrics explained)</CardTitle>

                            <CardTitle as="h3">Volume (units/day)</CardTitle>
                            <CardText>
                                <strong>Definition:</strong> How many units of this item trade daily on Bazaar.
                                <br />
                                <strong>How to use:</strong>
                                <br />
                                10k+ units/day = ultra-safe, liquid, best for beginners
                                <br />
                                5k–10k = safe, good for intermediate
                                <br />
                                2k–5k = medium risk, medium margins
                                <br />
                                &lt;2k = high risk, very high margins (AH-tier liquidity risk)
                                <br />
                                <strong>Rule:</strong> Never flip items below 1k units/day unless you specialize in that niche.
                            </CardText>

                            <CardTitle as="h3">Spread (buy/sell difference)</CardTitle>
                            <CardText>
                                <strong>Definition:</strong> Gap between highest buy order and lowest sell offer.
                                <br />
                                <strong>Example:</strong> Buy wall @ 1,000 coins, Sell wall @ 1,100 coins = 100 coin spread = 10% spread.
                                <br />
                                <strong>How to use:</strong>
                                <br />
                                &lt;3% spread = tight market, hard to profit (used by bots, highly efficient)
                                <br />
                                3–8% spread = beginner sweet spot, 2–5% net margin after fees
                                <br />
                                8–15% spread = profitable opportunities, watch for market shifts
                                <br />
                                &gt;15% spread = red flag (potential manipulation, low volume)
                                <br />
                                <strong>Rule:</strong> Target 5–10% spread as beginner. Avoid &lt;2% (fees eat all profit) and &gt;15% (likely unstable).
                            </CardText>

                            <CardTitle as="h3">Margin % (instant-buy to instant-sell)</CardTitle>
                            <CardText>
                                <strong>Definition:</strong> (Instant-sell price - Instant-buy price) / Instant-buy price × 100
                                <br />
                                <strong>Example:</strong> Buy @ 1,000, Sell @ 1,100 = 10% margin (gross). After 1.25% fee = ~8.75% net margin.
                                <br />
                                <strong>How to use:</strong> Target 3–8% for high-volume, 10–20% for medium-volume, 20%+ for low-volume.
                            </CardText>

                            <CardTitle as="h3">Buy/Sell wall heights (order liquidity)</CardTitle>
                            <CardText>
                                <strong>Definition:</strong> How many units are available at the current buy wall and sell wall.
                                <br />
                                <strong>Why it matters:</strong> High walls = stable prices. Low walls = prone to sudden shifts.
                                <br />
                                <strong>Example:</strong>
                                <br />
                                Buy wall: 50k units @ 1,000 coins (strong, stable)
                                <br />
                                Sell wall: 5k units @ 1,100 coins (weak, could jump if someone buys it all)
                                <br />
                                <strong>Red flag:</strong> Single seller with &lt;1% of daily volume at sell wall (risk of price spike if they leave).
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How to filter items using Bazaar Flips</CardTitle>

                            <CardTitle as="h3">Filter 1: Volume → sort descending</CardTitle>
                            <CardText>
                                <strong>Why:</strong> High volume = safe for beginners
                                <br />
                                <strong>Start here for first 10 flips</strong>
                            </CardText>

                            <CardTitle as="h3">Filter 2: Spread % → between 3–10%</CardTitle>
                            <CardText>
                                <strong>Why:</strong> 3–10% is the "goldilocks zone" for Bazaar
                                <br />
                                Skip &lt;2% (low profit) and &gt;15% (high risk)
                            </CardText>

                            <CardTitle as="h3">Filter 3: Volatility (24h price change) → less than 5%</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Items that swing 20%+ in 24h are often event-driven or manipulated
                                <br />
                                Avoid unless you understand the catalyst (mayor perk, balance patch)
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Advanced: What to avoid</CardTitle>

                            <CardTitle as="h3">❌ Single-wall monopolies</CardTitle>
                            <CardText>
                                <strong>Red flag:</strong> One seller controls 80%+ of sell wall with low daily volume.
                                <br />
                                <strong>Why:</strong> Price can crash 20%+ if monopolist leaves. Too risky.
                                <br />
                                <strong>Example:</strong> A niche crafted item with 1k units/day, 1 seller at 50k price = avoid.
                            </CardText>

                            <CardTitle as="h3">❌ Items with recent huge price swings</CardTitle>
                            <CardText>
                                <strong>Red flag:</strong> 30%+ change in 24h
                                <br />
                                <strong>Why:</strong> Often driven by speculation, mayor perks, or patches. Wait for stabilization.
                                <br />
                                <strong>Tool:</strong> Use <Link href="/topMovers">Top Movers</Link> to spot these (avoid anything in top 10 most volatile).
                            </CardText>

                            <CardTitle as="h3">❌ Items with crashing buy walls</CardTitle>
                            <CardText>
                                <strong>Red flag:</strong> Buy wall price drops 5%+ in an hour
                                <br />
                                <strong>Why:</strong> Market is weakening. If you buy, you'll overpay and hold losses.
                                <br />
                                <strong>Fix:</strong> Wait for stabilization (check 1h later). Flip only after recovery.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Market segmentation: Which items to pick</CardTitle>

                            <CardTitle as="h3">Ultra-high volume (safest)</CardTitle>
                            <ul>
                                <li>Enchanted Sugar Cane (50k+/day)</li>
                                <li>Enchanted Wheat (40k+/day)</li>
                                <li>Bone (30k+/day)</li>
                                <li>Enchanted Cobblestone (25k+/day)</li>
                            </ul>

                            <CardTitle as="h3">High volume (safe)</CardTitle>
                            <ul>
                                <li>Enchanted Potato / Carrot</li>
                                <li>Revenant Flesh (Slayer)</li>
                                <li>Tarantula Web (Slayer)</li>
                                <li>Ender Pearls</li>
                            </ul>

                            <CardTitle as="h3">Medium volume (intermediate)</CardTitle>
                            <ul>
                                <li>Enchanted Books (specific tiers)</li>
                                <li>Crafted Enchanted Blocks</li>
                                <li>Refined Diamond / Gold</li>
                                <li>Sven Steak (Slayer)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Tools and pages to use</CardTitle>
                            <ul>
                                <li><strong><Link href="/bazaar">Bazaar Flips</Link></strong> — primary tool, sort by Volume ⇩ for beginners</li>
                                <li><strong><Link href="/topMovers">Top Movers</Link></strong> — see volatility, avoid high-risk items</li>
                                <li><strong><Link href="/flipper">AH Flipper</Link></strong> — unique items (pets, gear), high margin alternative</li>
                                <li><strong><Link href="/crafts">Craft Flips</Link></strong> — crafting recipes, sometimes beat Bazaar margins</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">FAQ: Item selection</CardTitle>
                            <CardTitle as="h3">What if I can only afford 100k— which item should I flip?</CardTitle>
                            <CardText>
                                Pick items under 10k unit price (e.g., Sugar Cane @ 800–1,200 coins each). You'll buy ~80–125 units per flip. Volume &gt; margin at your capital level.
                            </CardText>

                            <CardTitle as="h3">Should I specialize in one item or diversify?</CardTitle>
                            <CardText>
                                <strong>Diversify at first:</strong> Flip 3–5 items to learn market patterns and reduce risk. Once comfortable, you can specialize in 1–2 high-volume items.
                            </CardText>

                            <CardTitle as="h3">How often should I change items?</CardTitle>
                            <CardText>
                                <strong>Weekly review:</strong> Check if an item is losing money (bought high, sold low) 2+ times. If so, replace with higher-volume item. Winners: keep flipping.
                            </CardText>

                            <CardTitle as="h3">Can I flip niche items with &lt;1k daily volume?</CardTitle>
                            <CardText>
                                <strong>Not recommended for beginners.</strong> Risk of holding losses is too high. Build capital on 10k+ volume items first, graduate to niche once you have 20M+.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — live filterable list</li>
                                <li><Link href="/guides/getting-started-with-flipping">Getting Started with Flipping</Link></li>
                                <li><Link href="/guides/how-to-flip">How to Flip (step-by-step)</Link></li>
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
