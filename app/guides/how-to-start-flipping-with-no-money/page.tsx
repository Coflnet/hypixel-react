import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Start Flipping with No Money | Flipping Guides",
    "Learn how to start flipping in Hypixel Skyblock even if you have no money. A guide for new players."
);

export default function HowToStartFlippingWithNoMoneyPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Start Flipping with No Money</CardTitle>
                            <CardText>
                                It's a common misconception that you need a lot of money to start flipping. While having more capital helps, it's possible to start with very little. Here's how.
                            </CardText>
                            <CardTitle as="h3">1. Earn Your First Coins</CardTitle>
                            <CardText>
                                You'll need a small amount of starting capital. You can earn this by:
                            </CardText>
                            <ul>
                                <li><strong>Farming:</strong> Harvest crops like wheat or carrots and sell them to an NPC.</li>
                                <li><strong>Mining:</strong> Mine ores like coal or iron in the Gold Mine and sell them.</li>
                                <li><strong>Foraging:</strong> Chop down trees and sell the wood.</li>
                            </ul>
                            <CardText>
                                Your goal is to get enough money to start trading on the Bazaar. You'll need to reach SkyBlock Level 7 to unlock it.
                            </CardText>
                            <CardTitle as="h3">2. Start with Low-Cost, High-Volume Flips</CardTitle>
                            <CardText>
                                Once you have a few thousand coins, head to the Bazaar. You won't be able to afford high-tier items, so focus on cheap items that are traded in large quantities.
                            </CardText>
                            <CardText>
                                Use our <Link href="/bazaar">Bazaar Flips</Link> page and sort by "Buy Price" to find the cheapest items to flip. Even if the profit per item is only a few coins, the high volume can help you build your capital quickly.
                            </CardText>
                            <CardTitle as="h3">3. Be Patient and Reinvest</CardTitle>
                            <CardText>
                                Flipping with a small budget requires patience. Your profits will be small at first, but it's crucial to reinvest everything you earn. As your capital grows, you'll be able to move on to more profitable items.
                            </CardText>
                            <CardTitle as="h3">4. Don't Be Afraid to Diversify</CardTitle>
                            <CardText>
                                Even with a small budget, don't put all your coins into a single flip. Spread your money across a few different items to reduce your risk.
                            </CardText>
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
