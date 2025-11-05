import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "What is the Best Item to Flip Right Now? | Flipping Guides",
    "Find out how to identify the best item to flip right now in Hypixel Skyblock using our real-time tools."
);

export default function BestItemToFlipRightNowPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">What is the Best Item to Flip Right Now?</CardTitle>
                            <CardText>
                                The Hypixel Skyblock market is incredibly dynamic, so the "best" item to flip changes by the minute. Instead of looking for a single answer, the key is to use the right tools to find the most profitable items in real-time.
                            </CardText>
                            <CardTitle as="h3">Using Our Tools to Find the Best Flips</CardTitle>
                            <CardText>
                                Our website provides several tools designed to help you find the best flips at any given moment:
                            </CardText>
                            <ul>
                                <li>
                                    <p><strong><Link href="/bazaar">Bazaar Flips</Link>:</strong> This is the best place to start. It shows you a real-time list of the most profitable items to flip on the Bazaar, based on the current spread between buy and sell orders.</p>
                                </li>
                                <li>
                                    <p><strong><Link href="/flipper">AH Flipper</Link>:</strong> For more advanced flippers, the Auction House flipper helps you find undervalued items on the AH. This requires more capital and knowledge, but the profits can be much higher.</p>
                                </li>
                                <li>
                                    <p><strong><Link href="/crafts">Craft Flips</Link>:</strong> Sometimes, the most profitable flips aren't on the market at all. Our craft flips page shows you which items you can craft from materials bought on the Bazaar for a profit.</p>
                                </li>
                                <li>
                                    <p><strong><Link href="/premiumBazaar">Premium Bazaar Flips</Link>:</strong> For the most dedicated flippers, our premium tools offer demand-based analysis, giving you an even more accurate picture of the market and revealing flips that others might miss.</p>
                                </li>
                            </ul>
                            <CardTitle as="h3">General Tips</CardTitle>
                            <ul>
                                <li><strong>Look for high volume:</strong> A high profit margin is great, but you also need to be able to buy and sell the item quickly. Look for items with a high number of instant buys and sells.</li>
                                <li><strong>Check for recent updates:</strong> Game updates can dramatically shift the market. An item that was worthless yesterday might be in high demand today.</li>
                                <li><strong>Start small:</strong> If you're unsure about an item, start with a small quantity to test the waters before investing a large amount of coins.</li>
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
