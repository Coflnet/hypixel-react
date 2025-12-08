import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Start Flipping with No Money | Bootstrap to 1M Coins",
    "Bootstrap from zero using minions, farming, and NPC flipping. Earn 100k–500k/day, reach 1M coins in 7–30 days, then start Bazaar flipping."
);

export default function HowToStartFlippingWithNoMoneyPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to bootstrap from zero — the short answer</CardTitle>
                            <CardText>
                                Start with Sugar Cane Minions (fastest path), farming, or NPC flipping. Target: 100k–500k/day. Timeline: 7–30 days to reach 1M coins. Once you hit 1M, begin <Link href="/bazaar">Bazaar flipping</Link> to compound exponentially. The "no money" phase is a grind, but essential for beginners.
                            </CardText>

                            <CardTitle as="h2" className="mt-3">Fastest path: Sugar Cane Minion setup (7–14 days)</CardTitle>
                            <CardText>
                                <strong>Why this is fastest:</strong> Zero playtime required after setup. Runs 24/7. Best ROI for passive income.
                            </CardText>
                            <ul>
                                <li><strong>Starting capital needed:</strong> 0 coins (farm initial resources, sell to NPC)</li>
                                <li><strong>Timeline:</strong> Level 1 minion (day 1) → Level 5 (day 5) → Level 8 (day 14) → Profits skyrocket</li>
                                <li><strong>Daily profit:</strong>
                                    <ul>
                                        <li>Level 1: 20k/day</li>
                                        <li>Level 5: 100k/day</li>
                                        <li>Level 8: 300k–500k/day</li>
                                    </ul>
                                </li>
                                <li><strong>Setup steps:</strong>
                                    <ol>
                                        <li>Reach SkyBlock Level 5 (farm 1–2 hours, grow crops, sell to NPC)</li>
                                        <li>Place Sugar Cane Minion (Level 1, slot 1)</li>
                                        <li>Every day: collect + sell output to NPC (or Bazaar if profitable)</li>
                                        <li>Use profits to level up minion + add new minions (Pumpkin, Melon)</li>
                                        <li>Once minion income &gt; 200k/day, start active flipping</li>
                                    </ol>
                                </li>
                                <li><strong>Pro tips:</strong>
                                    <ul>
                                        <li>Use Wood/Coal Minion as second minion (diversify income)</li>
                                        <li>Upgrade minion speed using Enchanted Books</li>
                                        <li>Combine minion crops + active farming (double production)</li>
                                    </ul>
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Alternative path 1: Active farming (10–21 days)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Faster than minions alone. Requires 2–3 hours/day playtime.
                            </CardText>
                            <ul>
                                <li><strong>Garden setup:</strong> Plant Sugar Cane + Wheat in garden (Level 1–3). Unlock Pumpkin/Melon plots as you level.</li>
                                <li><strong>Workflow:</strong>
                                    <ol>
                                        <li>Cultivate (plant) every 6 hours (breaks/overnight)</li>
                                        <li>Harvest every 12 hours</li>
                                        <li>Sell to NPC or Bazaar (check pricing first)</li>
                                    </ol>
                                </li>
                                <li><strong>Daily profit:</strong> 50k–200k/day (depending on garden level + playtime)</li>
                                <li><strong>Timeline:</strong> 10–21 days to 1M</li>
                                <li><strong>Pro tips:</strong>
                                    <ul>
                                        <li>Crop Level affects yield. Level 10 crops produce 2x more than Level 1.</li>
                                        <li>Composter (converts dung + crops → compost) boosts yield by 5–10%</li>
                                        <li>Pesticide (grows crops 20% faster) reduces wait between harvests</li>
                                    </ul>
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Alternative path 2: NPC flipping (14–30 days)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Learn flipping mechanics while earning. Fastest if you're active and smart about pricing.
                            </CardText>
                            <ul>
                                <li><strong>How it works:</strong> Buy items cheaply from NPCs (or player shops), sell to Bazaar for markup.</li>
                                <li><strong>Best NPC flip items:</strong>
                                    <ul>
                                        <li>Oak Wood: NPC 5 coins → Bazaar 20–25 coins (4–5x margin)</li>
                                        <li>Acacia Wood: NPC 10 coins → Bazaar 30–40 coins (3–4x margin)</li>
                                        <li>Sand: NPC 3 coins → Bazaar 10–15 coins (3–5x margin)</li>
                                        <li>Gravel: NPC 2 coins → Bazaar 8–12 coins (4–6x margin)</li>
                                    </ul>
                                </li>
                                <li><strong>Daily profit:</strong> 100k–300k/day (limited by 400M daily NPC flip cap)</li>
                                <li><strong>Timeline:</strong> 14–20 days to 1M if flipping 2–3 hours/day</li>
                                <li><strong>Workflow:</strong>
                                    <ol>
                                        <li>Farm raw materials (chop wood, dig sand/gravel)</li>
                                        <li>Sell to NPC (collect coins)</li>
                                        <li>Buy from player shop or re-buy from NPC at Bazaar rates</li>
                                        <li>Place buy order on Bazaar</li>
                                        <li>When filled, place sell order at market price</li>
                                    </ol>
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Hybrid path (fastest for active players): Minions + Farming</CardTitle>
                            <CardText>
                                <strong>Recommended for</strong> players who can dedicate 1–2 hours/day.
                            </CardText>
                            <ul>
                                <li><strong>Day 1–5:</strong> Farm intensively (50k/day), place Sugar Cane Minion</li>
                                <li><strong>Day 5–10:</strong> Farm casually (30k/day) + collect minion (70k/day) = 100k/day</li>
                                <li><strong>Day 10–14:</strong> Upgrade minion, add second minion = 200k/day passive + 50k/day farming = 250k/day</li>
                                <li><strong>Day 14+:</strong> Minion income sufficient. Start active flipping with accumulated capital.</li>
                                <li><strong>Total to 1M:</strong> 7–10 days (fastest path)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">From 1M to 5M: First flipping campaigns</CardTitle>
                            <CardText>
                                Once you have 1M, immediately start <Link href="/bazaar">Bazaar flipping</Link>. Don't hoard!
                            </CardText>
                            <ul>
                                <li><strong>Capital allocation:</strong> Split 1M across 5 items (200k each)</li>
                                <li><strong>Item selection:</strong> Pick cheapest items with high volume (Enchanted Sugar Cane, Wheat, Bone)</li>
                                <li><strong>Flip frequency:</strong> Target 10–15 flips/day per item</li>
                                <li><strong>Daily return:</strong> 5–10% (50k–100k/day)</li>
                                <li><strong>Reinvestment:</strong> 100% of profits daily</li>
                                <li><strong>Timeline:</strong> 1M → 5M in 20–40 days (exponential compounding)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Comparison: Which path is best?</CardTitle>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Method</th>
                                        <th>Daily Profit</th>
                                        <th>Playtime</th>
                                        <th>Timeline to 1M</th>
                                        <th>Best For</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Minions only</td>
                                        <td>20k–300k (depends on level)</td>
                                        <td>~30 min/day</td>
                                        <td>14–30 days</td>
                                        <td>Passive players</td>
                                    </tr>
                                    <tr>
                                        <td>Farming only</td>
                                        <td>50k–200k</td>
                                        <td>2–3 hours/day</td>
                                        <td>10–21 days</td>
                                        <td>Active grinders</td>
                                    </tr>
                                    <tr>
                                        <td>NPC flipping</td>
                                        <td>100k–300k</td>
                                        <td>2–3 hours/day</td>
                                        <td>10–14 days</td>
                                        <td>Learn flipping early</td>
                                    </tr>
                                    <tr>
                                        <td>Hybrid (minions + farming)</td>
                                        <td>150k–400k</td>
                                        <td>1–2 hours/day</td>
                                        <td>7–10 days</td>
                                        <td>Fastest overall</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">Mistakes to avoid</CardTitle>
                            <ul>
                                <li><strong>Don't hoard coins:</strong> Every coin earned should be reinvested or deployed. Idle capital = lost opportunity.</li>
                                <li><strong>Don't spread too thin:</strong> Focus on 1–2 income sources first. Adding minions/farming/flipping all at once is overwhelming.</li>
                                <li><strong>Don't ignore crop levels:</strong> A Level 10 crop produces 2x more than Level 1. Invest in leveling early.</li>
                                <li><strong>Don't forget NPC cap:</strong> 400M/day NPC flip limit. Once you hit it, switch to Bazaar or farming.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">FAQ: Bootstrap edition</CardTitle>
                            <CardTitle as="h3">How do I reach SkyBlock Level 5 to unlock minions?</CardTitle>
                            <CardText>
                                Farm crops for 1–2 hours (Skill XP), complete tutorials, mine/fish a bit. Level 5 is easy and takes 2–4 hours of casual play.
                            </CardText>

                            <CardTitle as="h3">Can I start flipping with 100k instead of 1M?</CardTitle>
                            <CardText>
                                <strong>Yes, but margins are thin.</strong> 100k flips = ~5k per flip (5% margin). Profitable but slow. Better to reach 500k–1M first using minions/farming, then flip with more frequency.
                            </CardText>

                            <CardTitle as="h3">What if I want to skip minions and just farm/NPC flip?</CardTitle>
                            <CardText>
                                <strong>Doable.</strong> NPC flipping teaches you market mechanics faster than minions. Active farming is more engaging than waiting. Choose based on your playstyle, not speed.
                            </CardText>

                            <CardTitle as="h3">How fast can I reach 1M if I'm very active (5+ hours/day)?</CardTitle>
                            <CardText>
                                <strong>5–7 days.</strong> Hybrid path (minions + farming + NPC flipping) at maximum capacity.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related guides</CardTitle>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> — start here once you hit 1M</li>
                                <li><Link href="/guides/getting-started-with-flipping">Getting Started with Flipping</Link></li>
                                <li><Link href="/guides/best-flipping-strategy">Best Flipping Strategy</Link> — capital-based approaches</li>
                                <li><Link href="/guides/npc-flipping-guide">NPC Flipping Guide</Link></li>
                                <li><Link href="/guides/greenhouse-guide">Greenhouse Guide</Link> — setup, watering, and mutation mechanics for Garden farming</li>
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
