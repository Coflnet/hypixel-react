import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Complete Hypixel Skyblock Flipping Guides | Learn Bazaar & Auction House Strategies",
    "Master Hypixel Skyblock flipping with our comprehensive guides. Learn bazaar flipping, auction house strategies, profit tracking, scam prevention, and advanced money-making methods.",
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
