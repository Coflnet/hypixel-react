import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Best Flipping Strategy by Capital Level | Hypixel SkyBlock Guide",
    "Choose your flipping strategy based on your capital: under 1M (minions/farming), 1–5M (Bazaar volume), 5–20M (craft flips), 20M+ (Auction House). Learn optimal portfolios and scaling paths."
);

export default function BestFlippingStrategyPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Best flipping strategy — the short answer</CardTitle>
                            <CardText>
                                Strategy depends on capital: under 1M (bootstrap), 1–5M (Bazaar volume), 5–20M (craft flips + hybrid), 20M+ (Auction House + high-margin plays). The "best" strategy is diversified across 3–4 methods to hedge risk. Use <Link href="/bazaar">Bazaar Flips</Link> and <Link href="/crafts">Craft Flips</Link> to find daily opportunities.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">Strategy by capital level</CardTitle>

                            <CardTitle as="h3">Under 1M: Bootstrap phase (minions & farming)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Build initial capital to enter Bazaar flipping.
                                <br />
                                <strong>Timeline:</strong> 7–14 days to reach 1M
                            </CardText>
                            <ul>
                                <li><strong>Sugar Cane Minion setup:</strong> Best ROI. Costs ~200k initial, generates ~100k/day at level 6. Reaches 1M in ~10 days.</li>
                                <li><strong>Farming (combat/enchanting XP):</strong> Plant Seeds/Sugar Cane, harvest every 6 hours. Profit: 50k–100k/day depending on garden level.</li>
                                <li><strong>NPC flipping:</strong> Flip items from NPCs to Bazaar (e.g., buy Oak Wood @ NPC 5k, sell Bazaar @ 20k). Profit: 10–50k/day, limited by 400M daily NPC cap.</li>
                                <li><strong>Foraging:</strong> Collect resources (Wood, Crops). Lowest profit (~20k/day) but requires no capital.</li>
                            </ul>
                            <CardText>
                                <strong>Risk:</strong> Ultra-low. Capital is locked in minions (safe) or farming (always sellable).
                            </CardText>

                            <CardTitle as="h3">1–5M: Bazaar volume phase</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Compound capital 10–30%/day by flipping high-volume Bazaar items.
                                <br />
                                <strong>Timeline:</strong> 1–3 months to reach 5M (depending on daily playtime)
                            </CardText>
                            <ul>
                                <li><strong>Portfolio composition:</strong> Split 1M across 5–10 items (200k per item max).</li>
                                <li><strong>Item selection:</strong> Use <Link href="/bazaar">Bazaar Flips</Link>, pick items with 3–8% margin + 10k+ units/day volume.</li>
                                <li><strong>Flip frequency:</strong> 5–15 flips/day per item. Each flip = 30–90 min. Target: 10–20% daily return.</li>
                                <li><strong>Reinvestment rule:</strong> Reinvest 100% of profits daily. Compound: 1M → 1.1M → 1.21M → ... → 5M in ~45 days.</li>
                                <li><strong>Scaling:</strong> As capital grows, increase sizing (max 25% per flip at 5M). Add 3–5 new items weekly.</li>
                            </ul>
                            <CardText>
                                <strong>Risk:</strong> Low–Medium. Market crashes (events, updates) can cause 10–20% losses. Hedge by diversifying items.
                            </CardText>

                            <CardTitle as="h3">5–20M: Hybrid phase (Bazaar + Crafts + NPC)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Maximize profit by combining 3 strategies. Target 15–30% daily return.
                                <br />
                                <strong>Capital split:</strong> 50% Bazaar, 30% Crafts, 20% NPC flipping / reserve
                            </CardText>
                            <ul>
                                <li>
                                    <strong>Bazaar (50% = 2.5–10M):</strong> Continue volume strategy. Increase sizing to 30% per flip. Flip 20–30 items daily. Return: 5–15% daily.
                                </li>
                                <li>
                                    <strong>Craft flipping (30% = 1.5–6M):</strong> Buy materials from Bazaar, craft items, sell to Bazaar/AH. Examples:
                                    <ul>
                                        <li>Enchanted Blocks (Enchanted Cobblestone → Enchanted Stone Block): 5–10% margin</li>
                                        <li>Perfect Armor (combine perks, reforge): 15–30% margin</li>
                                        <li>Mushroom Armor → Crimson Armor: 20–40% margin (requires crafting bench)</li>
                                    </ul>
                                    Return: 8–20% daily (slower, higher margins).
                                </li>
                                <li>
                                    <strong>NPC flipping (20% reserve):</strong> Use daily 400M NPC cap to flip bulk items (Wood, Crops). ~1.5–5M/day profit if capital allows. Keep rest as reserve for AH opportunities.
                                </li>
                            </ul>
                            <CardText>
                                <strong>Risk:</strong> Medium. Diversification hedges Bazaar crashes. Craft flips are slower but safer. NPC cap limits losses.
                            </CardText>

                            <CardTitle as="h3">20M+: Advanced phase (AH + Bazaar + Crafts + Events)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Maximize margins and exploit rare opportunities. Target 20–50% daily return on portions of capital.
                                <br />
                                <strong>Capital split:</strong> 40% Bazaar, 20% Crafts, 20% AH, 20% reserve for events/spikes
                            </CardText>
                            <ul>
                                <li>
                                    <strong>Bazaar (40% = 8–20M):</strong> Focus on high-volume, low-friction items. Flip 30–50 items daily. Target: 5–10% daily return. Scale positioning to 30–40% per flip.
                                </li>
                                <li>
                                    <strong>Craft flipping (20% = 4–10M):</strong> Expand to mid-tier crafts (god rolls, dungeon gear prep). 10–30% margins. 1–3 flips/week per craft.
                                </li>
                                <li>
                                    <strong>Auction House (20% = 4–10M):</strong> Flip high-value items: pets (5M–50M), god-roll weapons, dungeon gear. Margins: 20–100%+. 2–10 active listings. Holds 1–7 days/flip.
                                </li>
                                <li>
                                    <strong>Event reserve (20%):</strong> Hold 4M–10M liquid for price spikes: mayor perks, balance patches, seasonal events. Buy 50–100% dips during crashes, sell 20–50% rebounds.
                                </li>
                            </ul>
                            <CardText>
                                <strong>Risk:</strong> Medium–High. AH has liquidity risk (niche items stuck). Event plays are speculative. Hedge by maintaining diversified active flips across all 3 markets.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Core principles for ALL levels</CardTitle>

                            <CardTitle as="h3">1. Capital preservation &gt; raw return</CardTitle>
                            <CardText>
                                Losing 2M is worse than missing 5M in upside. Risk max 10–15% per flip. Diversify. Use <Link href="/topMovers">Top Movers</Link> to avoid volatility spikes.
                            </CardText>

                            <CardTitle as="h3">2. Reinvest 100% of profits (at least initially)</CardTitle>
                            <CardText>
                                Compounding is exponential. 1M @ 20% daily = 1M → 1.2M → 1.44M → 2.5M in 5 days. Don't hoard profits; redeploy daily.
                            </CardText>

                            <CardTitle as="h3">3. Diversify to hedge</CardTitle>
                            <CardText>
                                Bazaar crash doesn't hurt AH. NPC cap limits NPC losses. Craft flips move slower so lag Bazaar movements. 3–4 uncorrelated strategies = lower volatility.
                            </CardText>

                            <CardTitle as="h3">4. Track and optimize weekly</CardTitle>
                            <CardText>
                                Which items flip profitably? Which lag? Which are losing? Drop losers, double down on winners. Use <Link href="/flips">flip tracker</Link> or SkyCofl history. Weekly review = 10–20% improvement in ROI.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Portfolio example: 10M capital</CardTitle>
                            <CardText>
                                <strong>Allocation:</strong>
                            </CardText>
                            <ul>
                                <li>Bazaar flips (5M) → 30 items @ 150–200k each → 5–10 flips per item per day → 8–12% daily ROI = +400–600k/day</li>
                                <li>Craft flips (2M) → 4–5 ongoing crafts @ 400–500k each → 1–2 flips/day → 12–15% ROI = +240–300k/day</li>
                                <li>AH flips (2M) → 2–4 active listings @ 500k–1M each → 1–2 sells/day → 25–40% margin = +250–400k/day</li>
                                <li>NPC/Reserve (1M) → Capitalizes on spikes, covers losses</li>
                            </ul>
                            <CardText>
                                <strong>Total daily:</strong> 890k–1.3M profit = 8.9–13% daily return.
                                <br />
                                <strong>Monthly:</strong> 10M → 25M–45M (assuming compounding + reinvestment)
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Frequently Asked Questions</CardTitle>
                            <CardTitle as="h3">What's the fastest way to scale from 1M to 5M?</CardTitle>
                            <CardText>
                                <strong>Pure Bazaar volume.</strong> Pick 3–5 items with highest daily volumes, flip aggressively (target 10–20 flips/day across all), reinvest 100%. Expected: 5 weeks if flipping 3+ hours/day. Slower if less active, but safest.
                            </CardText>

                            <CardTitle as="h3">Should I do Bazaar or crafts first at 5M?</CardTitle>
                            <CardText>
                                <strong>Bazaar first, craft second.</strong> Bazaar provides daily baseline (safe 5–10% ROI). Crafts are riskier (wrong craft = -50% loss). Use Bazaar profits to fund craft experiments.
                            </CardText>

                            <CardTitle as="h3">At what capital should I start AH flipping?</CardTitle>
                            <CardText>
                                <strong>20M minimum, preferably 30M+.</strong> Below 20M, your opportunity cost is too high (10% daily Bazaar return beats 25% AH margin if holding 3–5 days). At 20M+, AH's margin makes holding time worthwhile. Need 3M+ liquid per item for meta pets.
                            </CardText>

                            <CardTitle as="h3">How do I survive a Bazaar crash?</CardTitle>
                            <CardText>
                                1. Diversify across 10+ items (if 3 crash, 7 steady).
                                <br />
                                2. Hold 20% reserve cash for rebuy dips.
                                <br />
                                3. Shift to craft flips (move slower, absorb crashes better).
                                <br />
                                4. Use <Link href="/topMovers">Top Movers</Link> to spot recoveries (buy rebound plays).
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides & tools</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — find high-volume items</li>
                                <li><Link href="/crafts">Craft Flips</Link> — profitable crafting chains</li>
                                <li><Link href="/flipper">AH Flipper</Link> — undervalued item finder</li>
                                <li><Link href="/topMovers">Top Movers</Link> — price volatility tracker</li>
                                <li><Link href="/guides/bazaar-vs-auction-house">Bazaar vs Auction House</Link></li>
                                <li><Link href="/guides/how-to-flip">How to Flip (step-by-step)</Link></li>
                                <li><Link href="/guides/how-to-start-flipping-with-no-money">How to Start with No Money</Link></li>
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
