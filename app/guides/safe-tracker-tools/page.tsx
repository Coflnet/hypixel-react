import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Safe Profit Tracker Tools for Hypixel Skyblock | Ban-Free Monitoring",
    "Complete guide to safe, ban-free tracking tools: SkyCofl Mod automatic logging, web dashboards, spreadsheet tracking, API tools. Compare tools, learn best practices, avoid automation risks."
);

export default function SafeTrackerToolsPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Safe Flip Tracker Tools for Hypixel Skyblock</CardTitle>
                            <CardText>
                                Tracking your flipping profits is essential to understand which strategies work and which don't. However, not all tracking tools are created equal—some can put your account at risk. This guide covers the safest and most effective ways to track your flipping performance.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Why Track Your Flips?</CardTitle>
                            <CardText>
                                Without proper tracking, you're flying blind. You might think you're making profit, but after accounting for taxes, failed flips, and opportunity costs, you could actually be losing money. Good tracking helps you:
                            </CardText>
                            <ul>
                                <li><strong>Identify your most profitable items</strong> - Focus on what works</li>
                                <li><strong>Calculate true profit</strong> - Account for all taxes and fees</li>
                                <li><strong>Spot trends</strong> - See which market conditions favor your strategy</li>
                                <li><strong>Set realistic goals</strong> - Track progress toward your coin targets</li>
                                <li><strong>Avoid repeated mistakes</strong> - Learn from failed flips</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Safe Tracking Methods</CardTitle>

                            <CardTitle as="h3" className="mt-3">1. SkyCofl Mod (Recommended)</CardTitle>
                            <CardText>
                                The <strong>SkyCofl Mod</strong> is the safest and most comprehensive tracking solution. It's fully compliant with Hypixel's rules because it only reads data and displays information—it never automates actions.
                            </CardText>
                            <CardText>
                                <strong>Features:</strong>
                            </CardText>
                            <ul>
                                <li><strong>Automatic flip tracking</strong> - Every purchase and sale is logged automatically</li>
                                <li><strong>Tax calculations</strong> - Shows net profit after all Bazaar and AH taxes</li>
                                <li><strong>Session statistics</strong> - See your profits for today, this week, or all time</li>
                                <li><strong>Item-by-item breakdown</strong> - Identify which items are most profitable</li>
                                <li><strong>Web dashboard sync</strong> - View detailed analytics on our website</li>
                            </ul>
                            <CardText>
                                Use <strong>/cofl flips</strong> to see your recent flip history and <strong>/cofl profit</strong> to see total earnings. The mod integrates seamlessly with our website, giving you access to detailed charts and long-term trend analysis.
                            </CardText>
                            <CardText>
                                <Link href="/mod">Download the SkyCofl Mod here</Link> and see the <Link href="/wiki/docs/mod-commands">full command reference</Link>.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">2. Manual Spreadsheet Tracking</CardTitle>
                            <CardText>
                                For players who prefer full control, manually logging flips in a spreadsheet (Google Sheets, Excel) is a safe option. While time-consuming, it helps you deeply understand your profit patterns.
                            </CardText>
                            <CardText>
                                <strong>What to track:</strong>
                            </CardText>
                            <ul>
                                <li>Item name</li>
                                <li>Buy price and quantity</li>
                                <li>Sell price and quantity</li>
                                <li>Tax paid (1.25% for Bazaar, variable for AH)</li>
                                <li>Net profit</li>
                                <li>Time to flip (optional but useful)</li>
                            </ul>
                            <CardText>
                                The downside is that manual tracking is tedious and prone to human error. Most serious flippers eventually migrate to automated tracking via the SkyCofl Mod.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">3. In-Game Transaction Log</CardTitle>
                            <CardText>
                                Hypixel provides a basic transaction history accessible through the Auction House and Bazaar menus. While limited, this can help you verify recent trades if you forget to log them elsewhere.
                            </CardText>
                            <CardText>
                                <strong>Limitations:</strong>
                            </CardText>
                            <ul>
                                <li>Only shows recent transactions (not comprehensive history)</li>
                                <li>Doesn't calculate net profit or taxes</li>
                                <li>No analytics or trend visualization</li>
                                <li>Tedious to review manually</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Tools to Avoid</CardTitle>

                            <CardTitle as="h3" className="mt-3">Third-Party Automation Scripts</CardTitle>
                            <CardText>
                                Any tool that automates in-game actions (placing orders, claiming items, relisting) is a bannable offense. This includes macro scripts, autoclickers configured for flipping, and automation bots. While some of these tools claim to include "tracking," the automation component puts your account at severe risk.
                            </CardText>
                            <CardText>
                                See our <Link href="/guides/automating-flips">guide on automation risks</Link> for more details.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">Sketchy Browser Extensions</CardTitle>
                            <CardText>
                                Some browser extensions claim to track flips by reading Hypixel API data. While reading public API data is safe, be cautious about granting extensions access to your Minecraft account credentials or API keys. Stick to trusted, open-source tools with good community reputation.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Best Practices for Safe Tracking</CardTitle>
                            <ul>
                                <li><strong>Use official or widely-trusted tools</strong> - The SkyCofl Mod is recommended by thousands of active flippers and is regularly updated</li>
                                <li><strong>Never share your Minecraft credentials</strong> - Legitimate tracking tools don't need your password</li>
                                <li><strong>Avoid automation</strong> - Only use tools that assist, not replace, human decision-making</li>
                                <li><strong>Review your data regularly</strong> - Track trends weekly to adjust your strategy</li>
                                <li><strong>Back up your data</strong> - If using spreadsheets, keep backups to avoid losing your history</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Conclusion</CardTitle>
                            <CardText>
                                The safest and most effective way to track your flips is with the <strong>SkyCofl Mod</strong>. It provides comprehensive, automated tracking without any risk of violating Hypixel's rules. Combined with our web dashboard, you'll have access to professional-grade analytics that help you maximize your profits while staying completely safe.
                            </CardText>
                            <CardText>
                                Start tracking smarter today: <Link href="/mod">Download the SkyCofl Mod</Link>
                            </CardText>

                            <hr />
                            <CardTitle as="h4" className="mt-4">FAQ: Tracking Tools & Data Privacy</CardTitle>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Is using the SkyCofl Mod against Hypixel's TOS?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> No. The SkyCofl Mod is fully compliant because it <strong>only reads and displays data</strong>—it never automates actions, injects chat commands, or manipulates gameplay. Hypixel explicitly permits client-side mods that provide information without automation.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can using a tracking tool get me banned?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Only if the tool automates actions. The SkyCofl Mod, spreadsheets, and manual tracking are 100% safe. Any tool that claims to automate flipping (auto-clicking, auto-claiming orders, etc.) is bannable.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Should I use the SkyCofl Mod or track manually?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> The SkyCofl Mod is recommended. It automatically logs every transaction, calculates taxes, and syncs to our website for advanced analytics. Manual spreadsheet tracking works but is tedious and error-prone. Use the mod.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: What data does the SkyCofl Mod collect?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> The mod logs transactions (buy/sell prices, quantities, taxes, profit), items collected (mining, farming, fishing, etc.), and playtime. This data is stored locally first and synced to our servers only when you choose to use the web dashboard. You control your privacy.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: How often should I check my profit data?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Review weekly to identify trends and adjust strategy. Check /cofl profit daily for a quick summary. The more frequently you review, the faster you optimize. But weekly reviews are the practical minimum.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can I export my flip data?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes! The SkyCofl Mod syncs data to our website where you can export to CSV. This is useful for advanced analysis, creating your own charts, or backing up your data. Spreadsheets also support export.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: If I stop using the mod, do I lose my history?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> No. Data synced to our website is preserved even if you uninstall the mod. You can always download your history as CSV or revisit the web dashboard later.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Why should I care about tracking if I'm just having fun?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Tracking reveals what's actually working. You might THINK your flips are profitable, but taxes might be eating profit. Tracking forces reality. Many "fun" flippers find they're actually making 50% less than they thought—and adjust strategy accordingly.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can I track income from methods other than flipping?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes! The SkyCofl Mod tracks mining, farming, fishing, crafting, slaying, and more. The /cofl profit command shows a breakdown by income source. This helps you compare which method is actually most profitable for YOUR playstyle.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Are there any tracking tools I should avoid?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes. Avoid any tool that promises "automation," "autoclicking," "auto-flipping," or "guaranteed profits." These are bannable and/or scams. Stick to <Link href="/mod">the official SkyCofl Mod</Link> or manual spreadsheets.
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
