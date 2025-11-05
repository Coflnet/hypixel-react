import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Optimal Minion Setups for Maximum Passive Income | Complete ROI Guide",
    "Master minion optimization: choose profitable minion types, fuel strategies, upgrades, tier progression, ROI calculations, and break-even analysis. Generate 10M–100M+ coins per day passively."
);

export default function OptimalMinionSetupsPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Optimal Minion Setups for Maximum Passive Income</CardTitle>
                            <CardText>
                                <strong>Minions are the ultimate set-and-forget income.</strong> While they require upfront capital to set up, a fully optimized minion farm can generate 10M–100M+ coins per day with zero active play. This guide teaches you how to choose the right minions, fuel them efficiently, and maximize ROI so your minions earn while you sleep.
                            </CardText>
                            <CardText>
                                <strong>Key reality:</strong> Minions have a long break-even period (2–12 weeks depending on setup). But after that, they're pure profit. Many new players skip minions because of the upfront cost—but endgame players know that minions are essential to scaling passive wealth.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Minion ROI: When Do Minions Pay For Themselves?</CardTitle>
                            <CardText>
                                Before setting up minions, understand the break-even timeline. A minion that generates 1M coins/day but costs 50M to fully set up breaks even in 50 days. After that, every day is profit.
                            </CardText>
                            <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #333" }}>
                                            <th style={{ padding: "10px", textAlign: "left", borderRight: "1px solid #ddd" }}><strong>Minion Type (Tier 11)</strong></th>
                                            <th style={{ padding: "10px", textAlign: "left", borderRight: "1px solid #ddd" }}><strong>Daily Income</strong></th>
                                            <th style={{ padding: "10px", textAlign: "left", borderRight: "1px solid #ddd" }}><strong>Setup Cost (with fuel & upgrades)</strong></th>
                                            <th style={{ padding: "10px", textAlign: "left" }}><strong>Break-Even (days)</strong></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>Snow (with Diamond Spreading)</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>1.5M–2.5M</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>20M–50M</td>
                                            <td style={{ padding: "10px" }}>14–30 days</td>
                                        </tr>
                                        <tr style={{ borderBottom: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>Clay (with Diamond Spreading)</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>1.2M–2M</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>15M–40M</td>
                                            <td style={{ padding: "10px" }}>15–30 days</td>
                                        </tr>
                                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>Nether Quartz</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>1M–1.8M</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>25M–60M</td>
                                            <td style={{ padding: "10px" }}>20–40 days</td>
                                        </tr>
                                        <tr style={{ borderBottom: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>Glowstone</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>800K–1.5M</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>20M–50M</td>
                                            <td style={{ padding: "10px" }}>20–50 days</td>
                                        </tr>
                                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>Revenant (endgame)</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>2M–5M+</td>
                                            <td style={{ padding: "10px", borderRight: "1px solid #ddd" }}>100M–200M</td>
                                            <td style={{ padding: "10px" }}>30–80 days</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <CardText style={{ fontSize: "0.9em", color: "#666" }}>
                                <strong>Note:</strong> These are estimates. Actual income varies based on Bazaar prices, which fluctuate. Use <Link href="/bazaar">SkyCofl Bazaar</Link> to verify current item prices before investing heavily.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Tier Progression: Start Small, Scale Up</CardTitle>
                            <CardText>
                                <strong>Don't buy 50 Tier 11 minions all at once.</strong> Instead, start with 1–2 Tier 1 minions and upgrade as profits compound. Here's the optimal progression:
                            </CardText>
                            <ul>
                                <li><strong>Week 1–2 (1–2 Tier 1 minions):</strong> Invest 100K–500K. Build initial passive income.</li>
                                <li><strong>Week 2–4 (Upgrade to Tier 5–6):</strong> Use early profits to fuel existing minions, not buy new ones.</li>
                                <li><strong>Week 4–8 (Tier 8–9, add a 2nd minion):</strong> Profits now justify adding a second optimized minion.</li>
                                <li><strong>Month 2–3 (Multiple Tier 11 minions):</strong> By now you're generating enough that you can invest in 3–5 optimized minions.</li>
                                <li><strong>Month 3–6 (Full farm scaling):</strong> Scale to 10–20+ minions generating 20M–100M+ daily.</li>
                            </ul>
                            <CardText>
                                The key: <strong>Compounding.</strong> Every coin from your first minion gets reinvested into upgrading it or buying the next one. By month 3, you'll have more passive income than most players earn grinding actively.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Choosing the Right Minion Type</CardTitle>

                            <CardTitle as="h4">🏆 Most Profitable: Snow & Clay (Farming Minions)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Stable, consistent, high daily rates (1.2M–2.5M/day per minion). Prices don't fluctuate wildly. Ideal for beginners.
                            </CardText>
                            <CardText>
                                <strong>Why Snow over Clay:</strong> Snow minions with Diamond Spreading generate both compacted snowballs AND diamonds. The diamond output is worth  2–3x the snowball value, making Snow the highest ROI farming minion.
                            </CardText>
                            <CardText>
                                <strong>Best setup:</strong> Tier 11 Snow Minion + Enchanted Lava Bucket fuel + Super Compactor 3000 + Diamond Spreading. Daily income: 1.8M–2.5M.
                            </CardText>

                            <CardTitle as="h4" className="mt-4">💰 High Risk/High Reward: Mining Minions</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Mining minions can generate more than farming minions, but prices for mined materials are volatile. When prices spike, you earn significantly more. When they crash, income drops.
                            </CardText>
                            <CardText>
                                <strong>Best types:</strong> Nether Quartz (stable), Glowstone (volatile but sometimes high), Tungsten (early game).
                            </CardText>
                            <CardText>
                                <strong>Best setup:</strong> Nether Quartz Tier 11 + Enchanted Lava Bucket + Super Compactor 3000. Daily income: 1M–1.8M (variable).
                            </CardText>

                            <CardTitle as="h4" className="mt-4">🎯 Endgame: Slayer Minions (Revenant/Tarantula)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Generate items AND rare drops worth millions. Highest potential income but also highest variance and cost.
                            </CardText>
                            <CardText>
                                <strong>Warning:</strong> These are expensive to set up (100M+) and maintenance is complex. Only pursue after you have 200M+ networth and understand slayer economics.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Fuel Strategy: Maximize Speed vs. Cost</CardTitle>

                            <CardTitle as="h4">💧 Enchanted Lava Bucket (Recommended for most players)</CardTitle>
                            <CardText>
                                <strong>Cost:</strong> One-time purchase of 1M–3M (prices vary).
                            </CardText>
                            <CardText>
                                <strong>Benefit:</strong> 25% permanent speed boost. This pays for itself in 2–3 days on an active minion.
                            </CardText>
                            <CardText>
                                <strong>Why it's best:</strong> You buy it once, and it's permanent. No recurring cost. Every minion should have one.
                            </CardText>

                            <CardTitle as="h4" className="mt-4">⚡ Catalysts (For power users)</CardTitle>
                            <CardText>
                                <strong>Cost:</strong> 1M–10M per catalyst (one-time use).
                            </CardText>
                            <CardText>
                                <strong>Benefit:</strong> 5–10x speed boost for 1–2 hours. Used when you want to quickly fill a minion.
                            </CardText>
                            <CardText>
                                <strong>Best use:</strong> Use catalysts when you'll manually collect within 2 hours. Otherwise the minion fills and stops, wasting the boost.
                            </CardText>

                            <CardTitle as="h4" className="mt-4">🦷 Foul Flesh & Hamster Wheels (Budget options)</CardTitle>
                            <CardText>
                                <strong>Cost:</strong> Cheap (100K–500K).
                            </CardText>
                            <CardText>
                                <strong>Benefit:</strong> Modest speed boost for 8–24 hours.
                            </CardText>
                            <CardText>
                                <strong>When to use:</strong> Tier 1–6 minions. Once you go Tier 11, upgrade to Enchanted Lava Bucket instead.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Essential Upgrades (Ranked by Priority)</CardTitle>

                            <CardTitle as="h4">1️⃣ Super Compactor 3000 (MUST HAVE)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Automatically compacts items into enchanted form, drastically increasing value. A Snow Minion without a compactor generates snowballs; with one, it generates compacted snowballs (3x value).
                            </CardText>
                            <CardText>
                                <strong>Cost:</strong> 10M–30M (depending on market).
                            </CardText>
                            <CardText>
                                <strong>ROI:</strong> Pays for itself in 10–15 days through increased output value.
                            </CardText>

                            <CardTitle as="h4" className="mt-4">2️⃣ Diamond Spreading (HIGH PRIORITY)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Generates diamonds alongside the minion's primary resource. Diamonds are always valuable and consistent.
                            </CardText>
                            <CardText>
                                <strong>Best on:</strong> Snow, Clay, and other farming minions. These already generate items, so adding diamonds is pure extra profit.
                            </CardText>
                            <CardText>
                                <strong>Cost:</strong> 5M–15M.
                            </CardText>
                            <CardText>
                                <strong>ROI:</strong> 20–50% of total minion income comes from diamonds alone. Essential upgrade.
                            </CardText>

                            <CardTitle as="h4" className="mt-4">3️⃣ Minion Expanders (MEDIUM PRIORITY)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Increases storage capacity. Collect less frequently while maintaining same daily income.
                            </CardText>
                            <CardText>
                                <strong>Cost:</strong> 2M–8M per expander (diminishing returns on stacking).
                            </CardText>
                            <CardText>
                                <strong>When to buy:</strong> After you have 5+ minions. Expanders save time but aren't essential early on.
                            </CardText>

                            <CardTitle as="h4" className="mt-4">4️⃣ Flycatcher (LOW PRIORITY)</CardTitle>
                            <CardText>
                                <strong>Why:</strong> Provides modest speed boost.
                            </CardText>
                            <CardText>
                                <strong>Cost:</strong> 20M–50M (expensive!).
                            </CardText>
                            <CardText>
                                <strong>When to buy:</strong> Only after all other upgrades are done. This is for optimization when you have 100M+ to spare.
                            </CardText>

                            <CardTitle as="h3" className="mt-4">Island Layout & Organization</CardTitle>
                            <ul>
                                <li><strong>Spread minions out:</strong> Give each minion its own 3x3 space. They work independently and need room.</li>
                                <li><strong>Central collection point:</strong> Place storage chests in the middle of your minion farm for easy collection (travel less).</li>
                                <li><strong>Fuel depot:</strong> Keep catalyst and fuel items near the entrance for quick access when adding boosts.</li>
                                <li><strong>Label minions:</strong> Use name tags to label minion types. Makes tracking easier when managing many minions.</li>
                                <li><strong>Plan for expansion:</strong> Build your farm with future expansion in mind. You'll want to add more minions later.</li>
                            </ul>

                            <CardTitle as="h3" className="mt-4">Track Your Minion Income Automatically</CardTitle>
                            <CardText>
                                <strong>Don't guess your minion income. Measure it.</strong> The SkyCofl Mod automatically logs all items your minions produce. Use <strong>/cofl profit</strong> to see:
                            </CardText>
                            <ul>
                                <li>Daily minion income (coins/day)</li>
                                <li>Income per minion (identify which ones underperform)</li>
                                <li>Compare vs. other income sources (farming, flipping, etc.)</li>
                                <li>Track ROI on fuel and upgrades</li>
                            </ul>
                            <CardText>
                                After 30 days of tracking, you'll have real data to optimize your setup. Maybe you'll find that Clay minions outperform Snow for your playstyle, or that Diamond Spreading has longer break-even than expected. Data beats guessing.
                            </CardText>

                            <hr />
                            <CardTitle as="h4" className="mt-4">FAQ: Minion Setup & Optimization</CardTitle>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: How many minions do I need to make serious money?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> 5 Tier 11 minions generate 7M–12M daily. 20+ minions generate 30M–100M+ daily. Start with 1–2 and scale based on profits.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Is it worth upgrading Tier 1 to Tier 11 on one minion, or buying new minions?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Upgrade first. A Tier 11 minion generates 5x more than Tier 1. Once you have 3–5 Tier 11 minions, then buy new ones. Concentrate, then diversify.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Should I buy a Enchanted Lava Bucket for every minion?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes. The cost (1M–3M) pays for itself in 2–3 days. It's the single best ROI upgrade. Every minion should have one.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: How often do I need to collect from minions?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> With storage expanders, every 4–12 hours. Without expanders, every 2–4 hours. Set a reminder and check in twice daily for optimal income.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Is it worth combining Catalysts + Enchanted Lava Bucket?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes, for active play sessions. Enchanted Lava Bucket is your base. Add a Catalyst when you want to power-farm and collect frequently for 1–2 hours.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can I make more flipping than minions generate?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> In coins/hour, yes. But minions are passive—you earn while sleeping. Flipping requires time. For pure passive income, minions are unbeatable.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: When should I start minion farming?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Once you have 5M–10M capital and understand minion ROI. Starting too early wastes capital; starting too late means missed months of passive income. Aim for month 2–3 of gameplay.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Do minions work while I'm offline?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes! That's the whole point. Minions generate items 24/7, whether you're playing or not. Pure passive income.
                                    </CardText>
                                </CardBody>
                            </Card>

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
