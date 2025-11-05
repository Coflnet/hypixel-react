import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Best Starter Items for Players Under 10M Coins | Hypixel Skyblock",
    "Learn which items are best to flip when you have less than 10 million coins in Hypixel Skyblock."
);

export default function StarterItemsUnder10MPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Best Starter Items for Players Under 10M Coins</CardTitle>
                            <CardText>
                                When you're just starting out with flipping and have less than 10 million coins, choosing the right items is crucial. You need items that are profitable, low-risk, and have quick turnaround times so you can reinvest your capital rapidly.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Ideal Starter Item Characteristics</CardTitle>
                            <CardText>
                                When flipping with limited capital, look for items with these traits:
                            </CardText>
                            <ul>
                                <li><strong>Low Entry Cost:</strong> Items you can buy in bulk with your limited coins (typically under 100k per unit).</li>
                                <li><strong>High Volume:</strong> Popular items that trade frequently, ensuring your orders fill quickly.</li>
                                <li><strong>Consistent Margins:</strong> Even small profits (5-15%) are good when you can flip the same item multiple times per hour.</li>
                                <li><strong>Bazaar-Based:</strong> The Bazaar is safer than the Auction House for beginners because prices are more predictable and you can use buy/sell orders.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Recommended Starter Items</CardTitle>
                            
                            <CardTitle as="h3" className="mt-3">1. Enchanted Farming Materials</CardTitle>
                            <CardText>
                                These are perfect for beginners because they have high volume and low prices:
                            </CardText>
                            <ul>
                                <li><strong>Enchanted Sugar Cane</strong></li>
                                <li><strong>Enchanted Melon</strong></li>
                                <li><strong>Enchanted Seeds (Wheat, Carrot, Potato)</strong></li>
                                <li><strong>Enchanted Rotten Flesh</strong></li>
                            </ul>
                            <CardText>
                                These items typically have margins of 5-10% and sell within minutes to hours. You can often flip them multiple times per day.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">2. Common Slayer Drops</CardTitle>
                            <CardText>
                                Items like <strong>Enchanted Rotten Flesh</strong>, <strong>Revenant Flesh</strong>, and <strong>Tarantula Silk</strong> are constantly in demand due to slayer quests. They have good volume and consistent margins.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">3. Minion Fuels</CardTitle>
                            <CardText>
                                Items like <strong>Foul Flesh</strong>, <strong>Hamster Wheels</strong>, and cheaper catalyst materials can have good margins because many players need them for their minion setups.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">4. Basic Enchanted Ores</CardTitle>
                            <CardText>
                                <strong>Enchanted Coal</strong>, <strong>Enchanted Iron</strong>, and <strong>Enchanted Gold</strong> are used in many recipes and have steady demand.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How to Find the Best Starter Flips</CardTitle>
                            <CardText>
                                Use our tools to identify profitable starter items:
                            </CardText>
                            <ul>
                                <li><strong><Link href="/bazaar">Bazaar Flips Page</Link>:</strong> Filter by your purse size to see items you can actually afford. The system automatically hides items that are too expensive for you.</li>
                                <li><strong>In-Game Command:</strong> Use <strong>/cofl bazaar</strong> with the SkyCofl Mod. The command respects your purse size and won't show flips you can't afford. See our <Link href="/wiki/docs/mod-commands#bazaarcommand-alias-bz">command reference</Link> for more details.</li>
                                <li><strong>Settings:</strong> Use <strong>/cofl set minProfit 50k</strong> to only see flips with at least 50k profit potential, filtering out tiny margins that aren't worth your time.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Starter Strategy</CardTitle>
                            <CardText>
                                Here's a simple strategy for players under 10M coins:
                            </CardText>
                            <ol>
                                <li>Start with 2-3 different items to diversify your risk.</li>
                                <li>Use the entire buy/sell order system—never instant buy or sell.</li>
                                <li>Aim for 5-10% profit margins with quick turnaround (under 6 hours).</li>
                                <li>Reinvest all profits immediately to compound your growth.</li>
                                <li>Track your results with the <strong>/cofl profit</strong> command to see which items work best for you.</li>
                            </ol>

                            <CardTitle as="h2" className="mt-4">Avoiding Common Mistakes</CardTitle>
                            <ul>
                                <li><strong>Don't chase high margins on low-volume items:</strong> A 50% margin is useless if your order never fills.</li>
                                <li><strong>Avoid the Auction House initially:</strong> It's more complex and risky. Stick to the Bazaar until you have at least 20-30M coins.</li>
                                <li><strong>Watch out for manipulation:</strong> If an item has an unusually high margin but very low volume, it might be price-manipulated. Our tools mark these items for you.</li>
                                <li><strong>Don't tie up all your capital:</strong> Always keep some coins liquid so you can take advantage of new opportunities.</li>
                            </ul>

                            <CardText className="mt-4">
                                For more flipping strategies, check out our guides on <Link href="/guides/how-to-flip">How to Flip</Link>, <Link href="/guides/how-to-make-money-with-bazaar-flipping">Making Money with Bazaar Flipping</Link>, and <Link href="/guides/how-to-start-flipping-with-no-money">Starting with No Money</Link>.
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
