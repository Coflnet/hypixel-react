import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Hypixel Skyblock Flipping Guides | Bazaar, AH, Craft, Safety and Profit Tracking",
    "Read complete Hypixel Skyblock flipping guides for Bazaar, Auction House, crafting, scam prevention, profit tracking, and strategy selection. Learn which SkyCofl tools to use at each stage.",
    undefined,
    [],
    undefined,
    getCanonicalUrl("/guides")
);

export default function GuidesPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Hypixel Skyblock Flipping Guides</CardTitle>
                            <CardText>
                                Welcome to the most comprehensive collection of flipping guides for Hypixel Skyblock. Whether you're a complete beginner with no coins or an experienced flipper looking to maximize profits, these guides will help you master the art of flipping on the Bazaar and Auction House.
                            </CardText>
                            <CardText>
                                Our guides cover everything from basic concepts to advanced strategies, helping you understand market mechanics, avoid common mistakes, and use powerful tools to track and optimize your profits. All guides are regularly updated to reflect the latest game changes and market trends.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How to use this guide library</CardTitle>
                            <CardText>
                                The fastest way to improve is to read the guides in the same order you would build a real flipping workflow. Start with the beginner fundamentals, move into item selection and strategy, then finish with the safety and tracking guides so you can protect and measure your profit.
                            </CardText>
                            <ul>
                                <li>New players should start with basic Bazaar and entry-level flipping concepts before touching higher-risk Auction House markets.</li>
                                <li>Intermediate players should focus on item selection, capital allocation, and deciding when to mix Bazaar, craft, and Auction House methods.</li>
                                <li>Advanced players should use the safety, automation, and profit-tracking guides to tighten execution and avoid avoidable losses.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Getting Started</CardTitle>
                            <CardText>New to flipping? Start here to learn the fundamentals:</CardText>
                            <ul>
                                <li>
                                    <Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping?</Link> - Understand the basics of bazaar flipping and how it works
                                </li>
                                <li>
                                    <Link href="/guides/getting-started-with-flipping">How to Get Started with Flipping?</Link> - Your first steps into the world of flipping
                                </li>
                                <li>
                                    <Link href="/guides/how-to-start-flipping-with-no-money">How to Start Flipping with No Money</Link> - Begin your flipping journey even with zero coins
                                </li>
                                <li>
                                    <Link href="/guides/how-to-flip">How to Flip on Hypixel Skyblock</Link> - Complete guide to flipping mechanics and strategies
                                </li>
                                <li>
                                    <Link href="/guides/is-flipping-worth-it">Is It Worth It to Flip in Hypixel Skyblock?</Link> - Understand the time investment and potential returns
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Finding Profitable Flips</CardTitle>
                            <CardText>Learn how to identify the best items and opportunities:</CardText>
                            <ul>
                                <li>
                                    <Link href="/guides/best-item-to-flip">What is the Best Item to Flip?</Link> - Characteristics of profitable items
                                </li>
                                <li>
                                    <Link href="/guides/best-item-to-flip-right-now">What is the Best Item to Flip Right Now?</Link> - Using real-time tools to find current opportunities
                                </li>
                                <li>
                                    <Link href="/guides/how-to-find-best-items-to-flip">How to Find the Best Items to Flip</Link> - Strategies and tools for discovering profitable items
                                </li>
                                <li>
                                    <Link href="/guides/largest-bazaar-margins">Which Items Have the Largest Bazaar Margins?</Link> - High-margin items for maximum profit
                                </li>
                                <li>
                                    <Link href="/guides/starter-items-under-10m">Best Starter Items for Players Under 10M Coins</Link> - Accessible flips for newer players
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Flipping Strategies & Methods</CardTitle>
                            <CardText>Master different flipping techniques and approaches:</CardText>
                            <ul>
                                <li>
                                    <Link href="/guides/best-flipping-strategy">What is the Best Flipping Strategy?</Link> - Compare different strategies and find what works for you
                                </li>
                                <li>
                                    <Link href="/guides/bazaar-vs-auction-house">Bazaar vs. Auction House Flipping</Link> - Understanding the differences and when to use each
                                </li>
                                <li>
                                    <Link href="/guides/how-to-make-money-with-bazaar-flipping">How to Make Money with Bazaar Flipping</Link> - Specific strategies for bazaar success
                                </li>
                                <li>
                                    <Link href="/guides/making-a-lot-of-money-with-flipping">How to Make a Lot of Money with Flipping?</Link> - Advanced techniques for serious profit
                                </li>
                                <li>
                                    <Link href="/guides/money-making-methods">Best Money Making Methods</Link> - Beyond flipping: comprehensive profit strategies
                                </li>
                                <li>
                                    <Link href="/guides/optimal-minion-setups">Optimal Minion Setups</Link> - Passive income to complement your flipping
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Profit Optimization & Safety</CardTitle>
                            <CardText>Maximize your earnings while staying safe:</CardText>
                            <ul>
                                <li>
                                    <Link href="/guides/avoid-taxes-and-losses">How to Avoid Flipping Taxes and Transfer Losses</Link> - Minimize costs and maximize net profit
                                </li>
                                <li>
                                    <Link href="/guides/tracking-profits-automatically">How to Track Your Profits Automatically</Link> - Use tools to monitor your flip performance
                                </li>
                                <li>
                                    <Link href="/guides/safe-tracker-tools">Safe and Reliable Third-Party Tracker Tools</Link> - Approved tools that won't get you banned
                                </li>
                                <li>
                                    <Link href="/guides/how-to-avoid-scams">How to Avoid Scams While Flipping</Link> - Protect yourself from common scams
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Advanced Topics & Tools</CardTitle>
                            <CardText>For experienced flippers and developers:</CardText>
                            <ul>
                                <li>
                                    <Link href="/guides/automating-flips">Automating Hypixel Skyblock Flips: Tools, Risks, and Safe Alternatives</Link> - Understanding automation and why you should avoid it
                                </li>
                                <li>
                                    <Link href="/guides/buying-skyblock-coins">Buying Hypixel Skyblock Coins: Risks, Bans, and Safe Alternatives</Link> - Why buying coins is dangerous
                                </li>
                                <li>
                                    <Link href="/guides/greenhouse-guide">Greenhouse Guide</Link> — setup, watering, mutation mechanics for Garden farming
                                </li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Which SkyCofl tool to open after each guide</CardTitle>
                            <CardText>
                                The best-performing SEO pages on competing sites all connect educational content directly to a next action. Use these pairings to move from reading into execution without losing context.
                            </CardText>
                            <ul>
                                <li><Link href="/bazaar">Bazaar Flips</Link> after beginner, volume, and margin guides so you can apply the spread and liquidity rules immediately.</li>
                                <li><Link href="/flipper">Item Flipper</Link> after Auction House, item-selection, and advanced strategy guides when you want higher-margin opportunities.</li>
                                <li><Link href="/crafts">Craft Flips</Link>, <Link href="/bookFlips">Book Flips</Link>, and <Link href="/forge">Forge Flips</Link> after craft-oriented guides when you want to convert inputs into higher-value outputs.</li>
                                <li><Link href="/topMovers">Top Movers</Link>, <Link href="/lowSupply">Low Supply Items</Link>, and <Link href="/recentFlips">Recent Flips</Link> after real-time market guides when timing and validation matter most.</li>
                                <li><Link href="/profitLeaderboard">Profit Leaderboard</Link> after the profit-tracking and strategy pages when you want to benchmark long-run results.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">External Money-Making Guide Library</CardTitle>
                            <CardText>The <a href="https://notenoughcoins.net/guides" target="_blank" rel="noopener">NotEnoughCoins guide library</a> publishes longer, transcript-backed companion guides covering AH flipping, BIN sniping, craft and book flips, NPC and reverse-NPC routes, slayer and mining money methods, farming progression and market literacy. Useful pairings:</CardText>
                            <ul>
                                <li><a href="https://notenoughcoins.net/guides/ah-flipping-guide-2026" target="_blank" rel="noopener">Auction House Flipping Guide 2026</a></li>
                                <li><a href="https://notenoughcoins.net/guides/bazaar-flipping-guide-2026" target="_blank" rel="noopener">Bazaar Flipping Guide 2026</a></li>
                                <li><a href="https://notenoughcoins.net/guides/craft-flipping-guide-2026" target="_blank" rel="noopener">Craft Flipping Guide 2026</a></li>
                                <li><a href="https://notenoughcoins.net/guides/bin-sniping-guide-2026" target="_blank" rel="noopener">BIN Sniping Guide 2026</a></li>
                                <li><a href="https://notenoughcoins.net/guides/market-literacy-margin-volume-risk" target="_blank" rel="noopener">How to Read Margin, Volume and Risk</a></li>
                                <li><a href="https://notenoughcoins.net/guides/flipping-tools-comparison-2026" target="_blank" rel="noopener">Flipping Tools Compared (SkyCofl vs Skyblock.bz vs BazaarPro vs BazaarTracker)</a></li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Frequently asked questions</CardTitle>
                            <CardText>
                                <strong>Which guide should I read first?</strong> Start with <Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping?</Link> and <Link href="/guides/getting-started-with-flipping">Getting Started with Flipping</Link>. They give you the language and workflow that the rest of the library builds on.
                            </CardText>
                            <CardText>
                                <strong>Are these guides only for Bazaar flipping?</strong> No. The library covers Bazaar, Auction House, craft, NPC, reverse NPC, Kat, safety, and profit-tracking topics so you can build a complete flipping process instead of a single tactic.
                            </CardText>
                            <CardText>
                                <strong>How do I know which tool matches my current guide?</strong> Use the tool pairings above. In general, theory pages should end with either a live market tool like <Link href="/bazaar">Bazaar Flips</Link> or a validation page like <Link href="/recentFlips">Recent Flips</Link> so you can test the idea right away.
                            </CardText>

                            <hr className="mt-4" />
                            <CardText className="mt-3">
                                <strong>Ready to start flipping?</strong> Check out our <Link href="/bazaar">Bazaar Flips</Link> page for real-time profitable opportunities, or install the <Link href="/mod">SkyCofl Mod</Link> to get flip suggestions directly in-game!
                            </CardText>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
