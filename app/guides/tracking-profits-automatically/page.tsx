import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Track Your Profits Automatically | Hypixel Skyblock",
    "Learn why manually tracking profits is a thing of the past. Discover how the SkyCofl Mod automatically logs all your earnings in Hypixel Skyblock."
);

export default function TrackingProfitsAutomaticallyPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to Track Your Profits Automatically</CardTitle>
                            <CardText>
                                Are you tired of using spreadsheets or manually calculating your profits in Hypixel Skyblock? The key to efficient money-making is understanding your exact income, but manual tracking is slow, tedious, and often inaccurate.
                            </CardText>
                            <CardText>
                                <strong>The solution is the SkyCofl Mod.</strong> It is the best and safest tool to automatically log your playtime and all your earnings, giving you a precise, real-time overview of your financial success in the game.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">What Does the SkyCofl Mod Track?</CardTitle>
                            <CardText>
                                The mod is designed to be a comprehensive financial logger for your Skyblock journey. It automatically detects and records profits and items from virtually every activity:
                            </CardText>
                            <ul>
                                <li><strong>Bazaar & Auction Flips:</strong> The mod tracks every buy and sell order, automatically calculating the profit margin after taxes for every single flip.</li>
                                <li><strong>Player Trades:</strong> All trades with other players are logged, showing you the net gain or loss from each transaction.</li>
                                <li><strong>Farming, Mining, and Foraging:</strong> Every crop harvested, ore mined, and log chopped is recorded, allowing you to see the true output of your grinding sessions.</li>
                                <li><strong>Fishing:</strong> Tracks all caught sea creatures and items, perfect for calculating the profitability of fishing events.</li>
                                <li><strong>Slayer & Dungeon Runs:</strong> Logs drops from bosses and rewards from dungeon chests, helping you determine your earnings per run.</li>
                                <li><strong>Dragon Runs:</strong> Automatically records the loot you get from fighting dragons.</li>
                                <li><strong>Galatea Activity:</strong> Tracks items and profits from activities related to the Galatea fountain.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">From Raw Data to Coins Per Hour</CardTitle>
                            <CardText>
                                The SkyCofl Mod doesn't just give you raw data; it converts it into the most important metric: <strong>coins per hour</strong>. By tracking your playtime alongside your earnings, the mod provides an accurate calculation of your efficiency for any money-making method. This allows you to:
                            </CardText>
                            <ul>
                                <li>Compare different money-making methods with objective data.</li>
                                <li>Optimize your strategies by seeing what yields the highest return on your time.</li>
                                <li>Stop guessing and start making data-driven decisions to grow your wealth faster.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Export Your Data with CSV</CardTitle>
                            <CardText>
                                For players who love data analysis, our website allows you to export your tracked history as a CSV file. You can open this in any spreadsheet software like Google Sheets or Excel to create your own custom graphs, track long-term trends, or build a detailed financial history of your Skyblock career.
                            </CardText>
                            <CardText>
                                You can also use in-game commands to review your profits. The <strong>/cofl profit</strong> command shows your total profit over a customizable time period (default 7 days, up to 180 days with Premium Plus). It includes detailed breakdowns of your best and worst flips, average margins, and contributions by finder type. Learn more in our <Link href="/wiki/docs/mod-commands#profitcommand">mod commands reference</Link>.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Is It Safe?</CardTitle>
                            <CardText>
                                Absolutely. The SkyCofl Mod is a trusted and reliable tool used by thousands of players. It operates client-side and does not interfere with game mechanics in any way that would be considered cheating. It simply reads game events to provide you with valuable data.
                            </CardText>

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
