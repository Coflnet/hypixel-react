import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Best Starter Items Under 10M | Low-Capital Flipping Guide",
    "Top 30+ beginner-friendly items for flipping with under 10M coins. Capital allocation, first flip examples, profit targets, volume analysis, and 50-day scaling roadmap.",
    undefined,
    [],
    undefined,
    getCanonicalUrl('/guides/starter-items-under-10m')
);

export default function StarterItemsUnder10MPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Best Starter Items Under 10M Coins</CardTitle>
                            <CardText>
                                When flipping with under 10M coins, <strong>success depends 100% on item selection</strong>. You need high-volume, low-margin items that flip fast. One successful 3% margin flip × 50 times/day beats one 50% margin flip that never sells. This guide shows exactly which 30+ items work best at each capital level (0-2M, 2-5M, 5-10M) with real examples, profit targets, and a 50-day scaling roadmap.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">The Core Principle: Volume &gt; Margin</CardTitle>
                            <CardText>
                                This cannot be overstated. As a beginner, your strength is <strong>rapid capital turnover</strong>. Even 2-3% margins stack fast if you flip daily. Use this formula to evaluate items:
                            </CardText>
                            <ul>
                                <li><strong>Coins/hour = (Margin % × Current Price) × (Daily Volume ÷ 24) ÷ Average Hold Time (hours)</strong></li>
                                <li>Example: Enchanted Sugar Cane at 3% margin × 100k+/day volume = 50k+/hour easily. That's 1.2M/day with 5M capital cycling the same item.</li>
                                <li><strong>Low-volume high-margin trap:</strong> A 20% margin item with 10/day volume = only 2k profit/day even with 5M. Avoid this.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Capital Allocation by Level</CardTitle>

                            <CardTitle as="h3">Level 1: 0-2M Capital (Your First 50 Flips)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> 50-100k/flip × 30 flips in 2 weeks = 1.5M→2.5M. Safe items only. Zero high-risk experiments.
                            </CardText>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Price</th>
                                        <th>Margin %</th>
                                        <th>Daily Vol</th>
                                        <th>Capital (20% of 2M)</th>
                                        <th>Coins/Hour</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Enchanted Sugar Cane</td>
                                        <td>108k</td>
                                        <td>4.6%</td>
                                        <td>1,800+</td>
                                        <td>400k (4 flips)</td>
                                        <td>75k</td>
                                    </tr>
                                    <tr>
                                        <td>Enchanted Rotten Flesh</td>
                                        <td>488</td>
                                        <td>34%</td>
                                        <td>44k+</td>
                                        <td>400k (800 units)</td>
                                        <td>165k</td>
                                    </tr>
                                    <tr>
                                        <td>Enchanted Cocoa Beans</td>
                                        <td>668</td>
                                        <td>24.5%</td>
                                        <td>30k+</td>
                                        <td>400k (600 units)</td>
                                        <td>98k</td>
                                    </tr>
                                    <tr>
                                        <td>Enchanted Raw Cod</td>
                                        <td>1,470</td>
                                        <td>33.6%</td>
                                        <td>21k+</td>
                                        <td>400k (270 units)</td>
                                        <td>110k</td>
                                    </tr>
                                    <tr>
                                        <td>Enchanted Slimeball</td>
                                        <td>949</td>
                                        <td>13%</td>
                                        <td>51k+</td>
                                        <td>400k (420 units)</td>
                                        <td>123k</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h3">Level 2: 2-5M Capital (Weeks 3-4)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Expand to 3-4 items (diversify), increase per-flip size. Target 150k-250k/flip × 20 flips/day = 3M→5M (10 days). Introduce craft-flips at scale.
                            </CardText>
                            <ul>
                                <li><strong>Add these items:</strong> Revenant Flesh (5.8% margin, 600+/day), Tarantula Silk (4.7% margin, 1.2k+/day), Enchanted Ender Pearl (68% margin BUT 10k/day only = still viable), Hemoglass (11.5% margin, 1.7k+/day)</li>
                                <li><strong>Start small craft-flips:</strong> Enchanted books (Unbreaking, Sharpness IV) often have 8-15% margins with decent volume. Capital: 100-200k per craft.</li>
                                <li><strong>Capital split:</strong> 50% core items (Sugar Cane, Rotten Flesh), 30% secondary items (Slimeball, Hemoglass), 20% craft flips</li>
                            </ul>

                            <CardTitle as="h3">Level 3: 5-10M Capital (Weeks 4-8)</CardTitle>
                            <CardText>
                                <strong>Goal:</strong> Stabilize 300k-500k/day profit. Introduce AH items (1-3 items max), scale best craft-flips. Target = reach 10M in 4 weeks.
                            </CardText>
                            <ul>
                                <li><strong>Keep Bazaar core:</strong> 40% capital in Sugar Cane + Rotten Flesh (proven 75k+/hr each)</li>
                                <li><strong>Add mid-tier items:</strong> Tarantula Silk (8% margin, 1.2k/day = 10k profit/day), Revenant Flesh (5.8%, 600+/day = 3k profit/day), Shard drops (8-12% margin, 2-5k/day)</li>
                                <li><strong>AH experimentation (max 10% capital):</strong> Low-tier enchanted books (Prot 1-4, Sharpness 1-4, Unbreaking 1-2) with 10-20% margins. Hold 1-2 days max. Test with 500k first.</li>
                                <li><strong>Craft scaling:</strong> Find 1-2 high-volume crafts with stable 15-20% margins. Examples: Enchanted books that craft from cheap mats, simple potions.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Complete Beginner Item List (Tier & Profit Info)</CardTitle>

                            <CardTitle as="h3">Tier S: Ultra-Safe, High-Volume (Start here)</CardTitle>
                            <ul>
                                <li><strong>Enchanted Sugar Cane:</strong> 108k price, 4.6% margin, 1,800+/day volume, 5-15 min hold. Coins/hour: 75k. Start with 500k (5 flips). Safe for weeks 1-4.</li>
                                <li><strong>Enchanted Wheat:</strong> Similar to Sugar Cane, often same margin. Backup item if Sugar gets oversaturated.</li>
                                <li><strong>Enchanted Rotten Flesh:</strong> 488 price, 34% margin (!), 44k+/day volume, 10-30 min hold. Coins/hour: 165k. Buy 800 units with 400k = flip daily. *This is your money printer.*</li>
                                <li><strong>Enchanted Slimeball:</strong> 949 price, 13% margin, 51k+/day volume, 10-20 min hold. Coins/hour: 123k. Reliable mid-tier.</li>
                            </ul>

                            <CardTitle as="h3">Tier A: Safe, Medium-Volume, Good Margins (Weeks 2-3+)</CardTitle>
                            <ul>
                                <li><strong>Enchanted Raw Cod:</strong> 1,470 price, 33.6% margin, 21k+/day, 15-45 min hold. Coins/hour: 110k.</li>
                                <li><strong>Enchanted Cocoa Beans:</strong> 668 price, 24.5% margin, 30k+/day, 15-30 min hold. Coins/hour: 98k.</li>
                                <li><strong>Enchanted Raw Rabbit:</strong> 6,800 price, 13.5% margin, 15k+/day, 20-60 min hold. Coins/hour: 112k. Slightly slower turnaround but solid margin.</li>
                                <li><strong>Enchanted Baked Potato:</strong> 81k price, 3.3% margin, 2,160+/day volume, 10-20 min hold. Lower margin but mega-volume.</li>
                            </ul>

                            <CardTitle as="h3">Tier B: Good, Requires Learning (Weeks 3+)</CardTitle>
                            <ul>
                                <li><strong>Revenant Flesh:</strong> 145k price, 5.8% margin, 600+/day, 30-90 min hold. Coins/hour: 67k. Slayer drop, so subject to event changes.</li>
                                <li><strong>Tarantula Silk:</strong> 391k price, 4.7% margin, 1.2k+/day, 45-120 min hold. Coins/hour: 68k. Same category as Revenant, more stable.</li>
                                <li><strong>Hemoglass:</strong> 23k price, 11.5% margin, 1.7k+/day, 30-60 min hold. Coins/hour: 75k. Solid workhorse.</li>
                                <li><strong>Fine Ruby Gemstone:</strong> 24k price, 19.3% margin, 2k+/day, 60-120 min hold. Coins/hour: 96k. Gems are predictable.</li>
                            </ul>

                            <CardTitle as="h3">Tier C: Specialized (Weeks 4+, use 10-20% of capital only)</CardTitle>
                            <ul>
                                <li><strong>Enchanted Ender Pearl:</strong> 524 price, 68.6% margin (!), 10k+/day, 60-180 min hold. Coins/hour: 358k (!). BUT 60+ min hold means slower turnover. Use 300k max to test.</li>
                                <li><strong>Shard drops (Shard Draconic, etc):</strong> 187k-260k price, 8-12% margin, 2-5k+/day, 60-120 min hold. Coins/hour: 65k+. Solid mid-tier. Wait until week 3.</li>
                                <li><strong>Enchanted Mithril:</strong> 1,358 price, 4.9% margin, 72k+/day, 30-60 min hold. Coins/hour: 76k. Ultra-safe but slow hold time.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">First Flip Walkthrough: 1M → 1.5M (Days 1-3)</CardTitle>
                            <CardText>
                                <strong>Capital:</strong> 1M coins
                            </CardText>
                            <CardText>
                                <strong>Day 1 (First Flip):</strong>
                            </CardText>
                            <ol>
                                <li>Go to <Link href="/bazaar">Bazaar</Link> page, search "Enchanted Rotten Flesh"</li>
                                <li>See: Buy price 488, Sell price 315 = 173 profit per unit (35% margin)</li>
                                <li>Allocate 400k (40% of 1M) → Buy 820 units at 488 each (exactly 400k)</li>
                                <li>Set sell order for all 820 @ 661 (mid-spread) or instant-sell @ 667 (spreads change)</li>
                                <li>Result: 820 × 173 profit = 141k gross, minus 1.25% fee (1,768) = 139k net. New capital: 1.139M</li>
                                <li>Hold time: 15 minutes (fast turnaround)</li>
                            </ol>

                            <CardText>
                                <strong>Days 1-3 (Compound 10+ more times):</strong> Repeat with 450k allocation (now 1.139M capital). Each flip takes 15 min, do 3-4/day, compound daily. By day 3: 1M → 1.5M+
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Capital Allocation Formula (Copy This)</CardTitle>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Capital Level</th>
                                        <th>Item 1 (Rotten Flesh)</th>
                                        <th>Item 2 (Sugar Cane)</th>
                                        <th>Item 3 (Slimeball)</th>
                                        <th>Item 4 (Cocoa Beans)</th>
                                        <th>Reserve (10%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1-2M</td>
                                        <td>50% (500-1M)</td>
                                        <td>30% (300-600k)</td>
                                        <td>10% (100-200k)</td>
                                        <td>—</td>
                                        <td>10%</td>
                                    </tr>
                                    <tr>
                                        <td>2-5M</td>
                                        <td>40% (800k-2M)</td>
                                        <td>30% (600k-1.5M)</td>
                                        <td>15% (300-750k)</td>
                                        <td>5% (100-250k)</td>
                                        <td>10%</td>
                                    </tr>
                                    <tr>
                                        <td>5-10M</td>
                                        <td>30% (1.5M-3M)</td>
                                        <td>25% (1.25M-2.5M)</td>
                                        <td>20% (1M-2M)</td>
                                        <td>15% (750k-1.5M)</td>
                                        <td>10%</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">50-Day Scaling Roadmap</CardTitle>
                            <ul>
                                <li><strong>Days 1-7 (1M → 2.5M):</strong> Rotten Flesh + Sugar Cane only. 3-4 flips/day. Target: 150k-200k/day profit. Feel out hold times.</li>
                                <li><strong>Days 8-14 (2.5M → 4M):</strong> Add Slimeball (10% capital). Same items, more volume per flip. Target: 250k/day.</li>
                                <li><strong>Days 15-21 (4M → 6M):</strong> Add Cocoa Beans (5% capital). Introduce 1 craft-flip test (200k capital max). Target: 300k/day.</li>
                                <li><strong>Days 22-30 (6M → 8M):</strong> Scale craft-flips if working. Keep 4 Bazaar items stable. Target: 350k/day.</li>
                                <li><strong>Days 31-40 (8M → 10M+):</strong> Consider 1-2 easy AH items (low-tier enchanted books). Test with 500k. Target: 400k/day.</li>
                                <li><strong>Days 41-50 (10M+ achieved):</strong> Document which items worked best. Transition to intermediate guide. You're ready for 10M→50M scaling.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Profit & Turnaround Table</CardTitle>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Profit/Unit</th>
                                        <th>Units with 400k</th>
                                        <th>Profit/Flip</th>
                                        <th>After Fee (1.25%)</th>
                                        <th>Hold Time</th>
                                        <th>Flips/Day</th>
                                        <th>Daily Profit (1 item)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Rotten Flesh</td>
                                        <td>173</td>
                                        <td>820</td>
                                        <td>141k</td>
                                        <td>139k</td>
                                        <td>15 min</td>
                                        <td>4</td>
                                        <td>556k</td>
                                    </tr>
                                    <tr>
                                        <td>Sugar Cane</td>
                                        <td>5k</td>
                                        <td>80</td>
                                        <td>400k</td>
                                        <td>395k</td>
                                        <td>30 min</td>
                                        <td>2</td>
                                        <td>790k</td>
                                    </tr>
                                    <tr>
                                        <td>Slimeball</td>
                                        <td>123</td>
                                        <td>3.2k</td>
                                        <td>394k</td>
                                        <td>389k</td>
                                        <td>20 min</td>
                                        <td>3</td>
                                        <td>1.167M</td>
                                    </tr>
                                    <tr>
                                        <td>Rotten Flesh (4x/day)</td>
                                        <td>—</td>
                                        <td>—</td>
                                        <td>139k</td>
                                        <td>—</td>
                                        <td>15 min</td>
                                        <td>4</td>
                                        <td>556k</td>
                                    </tr>
                                </tbody>
                            </table>

                            <CardTitle as="h2" className="mt-4">Common Beginner Mistakes (Avoid These!)</CardTitle>

                            <CardTitle as="h3">❌ Chasing high margins on low-volume items</CardTitle>
                            <CardText>
                                "A 30% margin is ALWAYS better than 5%!" No. A 30% margin on 10 items/day = 3k profit. A 5% margin on 1,800 items/day = 90k profit. Volume dominates margin for beginners.
                            </CardText>

                            <CardTitle as="h3">❌ Holding capital as "safety net"</CardTitle>
                            <CardText>
                                "I'll keep 2M safe and only flip 1M." This kills compound growth. Your safety net IS your profitable flips. Deploy 90% + reinvest wins daily.
                            </CardText>

                            <CardTitle as="h3">❌ Instant buying/selling instead of orders</CardTitle>
                            <CardText>
                                Instant buy at 800, instant sell at 650? That's -18.75% per transaction plus fees. Orders: buy order at 600 (fill), sell order at 800 (fill) = +33% margin. Use orders 100%.
                            </CardText>

                            <CardTitle as="h3">❌ Not tracking coins/hour</CardTitle>
                            <CardText>
                                You flipped 20 Rotten Flesh (3 hour hold) + 2 Sugar Cane (2 hour hold) = 200k profit in 5 hours = 40k/hr. But Sugar Cane was only 10k/hr, Rotten Flesh was 67k/hr. Drop Sugar Cane. Track everything using <Link href="/guides/tracking-profits-automatically">/cofl profit</Link>.
                            </CardText>

                            <CardTitle as="h3">❌ Jumping to Auction House too early</CardTitle>
                            <CardText>
                                "I want 50% margins!" AH is different beast: slower fills, manipulation risk, reforge/enchant knowledge needed. Stay Bazaar-only until 10M. Then graduate.
                            </CardText>

                            <CardTitle as="h3">❌ Holding one item too long</CardTitle>
                            <CardText>
                                If you bought Enchanted Rotten Flesh this morning and it's sitting unsold 6 hours later, price likely moved down. Cancel, rebuy lower, resell. Don't hold overnight on early items.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">FAQ: Beginner Flipping Questions</CardTitle>

                            <CardTitle as="h3">Q: Why does my order not fill even though the price shows available?</CardTitle>
                            <CardText>
                                Bazaar prices update instantly for instabuy/instasell, but buy/sell orders lag. If you place a buy order at 600 and insta prices are 605, your order may never fill. Place orders 5-10 coins above/below instas but not too far (or you tie up capital).
                            </CardText>

                            <CardTitle as="h3">Q: Is Rotten Flesh always a good flip or will it get oversaturated?</CardTitle>
                            <CardText>
                                Rotten Flesh has 44k+/day volume. If beginners like you buy 50k units, that's 1.1% of daily volume. You won't saturate it. The margin stays stable because it's needed daily for slayer quests. Safe forever.
                            </CardText>

                            <CardTitle as="h3">Q: How do I know if an item's margin is from manipulation vs real demand?</CardTitle>
                            <CardText>
                                Check volume. 30% margin with 10/day volume = manipulation (don't touch). 5% margin with 40k+/day volume = real demand (buy it). Use our <Link href="/largest-bazaar-margins">Bazaar Margins tool</Link> which flags suspicious items.
                            </CardText>

                            <CardTitle as="h3">Q: Should I sell to a buy order or wait for my sell order to fill?</CardTitle>
                            <CardText>
                                If time &gt; money: place sell order (higher price, slower). If capital turnover &gt; max profit: sell to buy order (instant, lower price). As beginner, turnover wins: sell faster, reinvest faster, compound faster.
                            </CardText>

                            <CardTitle as="h3">Q: What happens if I place a buy order too low and it never fills?</CardTitle>
                            <CardText>
                                Your capital sits tied up. After 6 hours with no fill, cancel and raise the order by 10-20 coins. Flipping is about turnover, not trying to squeeze every coin from each buy.
                            </CardText>

                            <CardTitle as="h3">Q: When should I start using /cofl profit to track?</CardTitle>
                            <CardText>
                                Day 1. Seriously. Install the SkyCofl Mod and run /cofl profit daily. By day 7 you'll see which items are printing money (Rotten Flesh typically 65-75k/hr) and which are duds. This is how you optimize.
                            </CardText>

                            <CardTitle as="h3">Q: Can I start with just one item or should I diversify?</CardTitle>
                            <CardText>
                                Start with one (Rotten Flesh, 10-15 days). Once you hit 2M and understand order mechanics, add a second (Sugar Cane). At 4M, add third (Slimeball). Diversify gradually as you learn. This prevents burnout and capital loss.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Related Guides</CardTitle>
                            <ul>
                                <li><Link href="/guides/best-item-to-flip">What's the Best Item to Flip?</Link> — Item selection criteria</li>
                                <li><Link href="/guides/how-to-flip">How to Flip Items</Link> — Step-by-step Bazaar mechanics</li>
                                <li><Link href="/guides/how-to-start-flipping-with-no-money">How to Start with No Money</Link> — Bootstrap from 0 coins</li>
                                <li><Link href="/guides/tracking-profits-automatically">Track Profits Automatically</Link> — /cofl profit command</li>
                                <li><Link href="/guides/avoid-taxes-and-losses">Minimize Taxes & Losses</Link> — Fee optimization</li>
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
